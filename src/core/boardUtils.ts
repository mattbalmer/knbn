import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Board, Task } from './types';
import { boardVersion } from '../../package.json';

export function getBoardFiles(): string[] {
  const cwd = process.cwd();
  const possibleFiles = [
    ...fs.readdirSync(cwd).filter(file => file.endsWith('.knbn'))
  ];

  // If ".knbn" exists, it should be the first file
  const orderedFiles = possibleFiles.sort((a, b) => {
    if (a === '.knbn') return -1; // ".knbn" should come first
    if (b === '.knbn') return 1;
    return 0;
  });

  return orderedFiles.map(file => path.join(cwd, file));
}

export function findBoardFile(): string | null {
  const possibleFiles = getBoardFiles();

  for (const file of possibleFiles) {
    if (fs.existsSync(file)) {
      return file;
    }
  }

  return null;
}

export function loadBoard(filePath: string): Board {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as any;
    
    // Ensure the board has the correct structure
    const defaultConfig = {
      name: 'Default Board',
      description: 'A kanban board',
      columns: [{ name: 'todo' }, { name: 'done' }]
    };
    
    const defaultMetadata = {
      nextId: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: boardVersion,
    };
    
    const board: Board = {
      configuration: {
        name: data.configuration?.name || defaultConfig.name,
        description: data.configuration?.description || defaultConfig.description,
        columns: data.configuration?.columns || defaultConfig.columns
      },
      tasks: data.tasks || {},
      sprints: data.sprints || undefined,
      metadata: {
        nextId: data.metadata?.nextId || defaultMetadata.nextId,
        createdAt: data.metadata?.createdAt || defaultMetadata.createdAt,
        lastModified: data.metadata?.lastModified || defaultMetadata.lastModified,
        version: data.metadata?.version || defaultMetadata.version
      }
    };
    
    return board;
  } catch (error) {
    throw new Error(`Failed to load board file: ${error}`);
  }
}

export function loadBoardMetaAndConfig(filePath: string): Pick<Board, 'metadata' | 'configuration'> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as any;

    const board: Pick<Board, 'metadata' | 'configuration'> = {
      configuration: data.configuration,
      metadata: data.metadata,
    };

    return board;
  } catch (error) {
    throw new Error(`Failed to load board file: ${error}`);
  }
}

export function saveBoard(filePath: string, board: Board): void {
  try {
    board.metadata.lastModified = new Date().toISOString();
    const content = yaml.dump(board, { 
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to save board file: ${error}`);
  }
}

export function addTaskToBoard(board: Board, taskData: Partial<Task>): Task {
  const now = new Date().toISOString();
  const newTask: Task = {
    id: board.metadata.nextId,
    title: taskData.title || 'Untitled Task',
    description: taskData.description || '',
    column: taskData.column || board.configuration.columns[0]?.name || 'todo',
    labels: taskData.labels,
    assignee: taskData.assignee,
    sprint: taskData.sprint,
    storyPoints: taskData.storyPoints,
    dates: {
      created: taskData.dates?.created || now,
      updated: taskData.dates?.updated || now,
      moved: taskData.dates?.moved
    }
  };

  board.tasks[newTask.id] = newTask;
  board.metadata.nextId += 1;
  
  return newTask;
}

export function updateTaskInBoard(board: Board, taskId: number, updates: Partial<Task>): Task | null {
  const task = board.tasks[taskId];
  if (!task) {
    return null;
  }

  const now = new Date().toISOString();
  const columnChanged = updates.column && updates.column !== task.column;

  // Handle dates separately to avoid overwriting
  const { dates: updateDates, ...otherUpdates } = updates;
  
  // Update the task with new values, keeping existing values for unspecified fields
  const updatedTask: Task = {
    ...task,
    ...otherUpdates,
    id: taskId, // Ensure ID doesn't change
    dates: {
      created: task.dates.created,
      updated: now,
      moved: updateDates?.moved !== undefined 
        ? updateDates.moved 
        : (columnChanged ? now : task.dates.moved)
    }
  };

  board.tasks[taskId] = updatedTask;
  return updatedTask;
}

export function createBoard(name?: string): string {
  const now = new Date().toISOString();
  const fileName = name ? `${name}.knbn` : '.knbn';
  const filePath = path.join(process.cwd(), fileName);
  
  if (fs.existsSync(filePath)) {
    throw new Error(`Board file ${fileName} already exists`);
  }

  // TODO: Maybe remove the initial task
  const board: Board = {
    configuration: {
      name: name || 'Your Board',
      description: 'Your local kanban board',
      columns: [{ name: 'backlog' }, { name: 'todo' }, { name: 'working' }, { name: 'done' }]
    },
    tasks: {
      1: {
        id: 1,
        title: 'Create a .knbn!',
        description: 'Create your .knbn file to start using KnBn',
        column: 'done',
        dates: {
          created: now,
          updated: now,
          moved: now,
        }
      }
    },
    metadata: {
      nextId: 2,
      createdAt: now,
      lastModified: now,
      version: boardVersion
    }
  };
  
  saveBoard(filePath, board);
  return filePath;
}
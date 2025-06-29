import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Board, Task } from './types';
import { boardVersion } from '../../package.json';

export function findBoardFile(): string | null {
  const cwd = process.cwd();
  const possibleFiles = [
    path.join(cwd, '.knbn'),
    path.join(cwd, 'knbn.knbn'),
    ...fs.readdirSync(cwd).filter(file => file.endsWith('.knbn')).map(file => path.join(cwd, file))
  ];

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
    status: taskData.status || board.configuration.columns[0]?.name || 'todo',
    labels: taskData.labels,
    assignee: taskData.assignee,
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
  const statusChanged = updates.status && updates.status !== task.status;

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
        : (statusChanged ? now : task.dates.moved)
    }
  };

  board.tasks[taskId] = updatedTask;
  return updatedTask;
}
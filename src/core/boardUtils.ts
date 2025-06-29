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
    const board: Board = {
      configuration: data.configuration || {
        name: 'Default Board',
        description: 'A kanban board',
        columns: [{ name: 'todo' }, { name: 'done' }]
      },
      tasks: data.tasks || {},
      metadata: data.metadata || {
        nextId: 1,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: boardVersion,
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
  const newTask: Task = {
    id: board.metadata.nextId,
    title: taskData.title || 'Untitled Task',
    description: taskData.description || '',
    status: taskData.status || board.configuration.columns[0]?.name || 'todo',
    labels: taskData.labels,
    assignee: taskData.assignee,
    storyPoints: taskData.storyPoints,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    completed: taskData.completed
  };

  board.tasks[newTask.id] = newTask;
  board.metadata.nextId += 1;
  
  return newTask;
}
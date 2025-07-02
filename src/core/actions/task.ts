import { Board, Task } from '../types';
import { newTask, updateTaskOnBoard } from '../utils/board';
import { CreateTaskParams } from '../utils/task';
import { loadBoard, saveBoard } from './board';

export const getTask = (filepath: string, taskId: number): Task | undefined => {
  const board = loadBoard(filepath);
  return board.tasks[taskId];
}

// TODO: more advanced search capabilities (eg. ands, ors, regex)
export const findTasks = (filepath: string, query: string, keys?: string[]): Task[] => {
  const board = loadBoard(filepath);
  const lowerQuery = query.toLowerCase();

  if (!query) {
    return Object.values(board.tasks);
  }

  const stringKeys = ['title', 'description', 'sprint'].filter(key => keys?.includes(key) ?? true);
  const arrayKeys = ['labels'].filter(key => keys?.includes(key) ?? true);

  // TODO: make more performant
  const callback = (task: Task) => {
    const stringMatch = stringKeys.some(key => {
      const value = task[key as keyof Task];
      return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
    });
    const arrayMatch = arrayKeys.some(key => {
      const value = task[key as keyof Task];
      return Array.isArray(value) && value.some(item => item.toLowerCase().includes(lowerQuery));
    });
    return stringMatch || arrayMatch;
  };

  return Object.values(board.tasks)
    .filter(task => callback(task));
}

export const createTask = (filepath: string, taskData: Omit<CreateTaskParams, 'id'>): {
  board: Board,
  task: Task,
} => {
  const board = loadBoard(filepath);
  const {
    board: updatedBoard,
    task,
  } = newTask(board, taskData);
  saveBoard(filepath, updatedBoard);
  return {
    board: updatedBoard,
    task
  };
}

export const updateTask = (filepath: string, taskId: number, updates: Partial<Task>): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = updateTaskOnBoard(board, taskId, updates);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

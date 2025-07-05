import { Board, Filepath, Task } from '../types';
import { newTask } from '../utils/board';
import { CreateTaskParams, updateTask as updateTaskUtil, updateTasksBatch as updateTasksBatchUtil, sortTasks } from '../utils/task';
import { loadBoard, saveBoard } from '../utils/board-files';

export const getTask = (filepath: Filepath, taskId: number): Task | undefined => {
  const board = loadBoard(filepath);
  return board.tasks[taskId];
}

// TODO: more advanced search capabilities (eg. ands, ors, regex)
export const findTasks = (filepath: Filepath, query: string, keys?: string[]): Task[] => {
  const board = loadBoard(filepath);
  const lowerQuery = query.toLowerCase();

  if (!query) {
    return sortTasks(Object.values(board.tasks));
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

  return sortTasks(Object.values(board.tasks)
    .filter(task => callback(task)));
}

export const createTask = (filepath: Filepath, taskData: Omit<CreateTaskParams, 'id'>): {
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

export const updateTask = (filepath: Filepath, taskId: number, updates: Partial<Task>): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = updateTaskUtil(board, taskId, updates);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const updateTasksBatch = (filepath: Filepath, updates: Record<number, Partial<Task>>): {
  board: Board,
  tasks: Record<number, Task>,
} => {
  const board = loadBoard(filepath);
  const {
    board: updatedBoard,
    tasks: updatedTasks,
  } = updateTasksBatchUtil(board, updates);
  saveBoard(filepath, updatedBoard);
  return {
    board: updatedBoard,
    tasks: updatedTasks,
  };
}

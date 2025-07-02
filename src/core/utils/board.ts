import { Board, Column, Task } from '../types/knbn';
import { KNBN_BOARD_VERSION } from '../constants';
import { CreateTaskParams } from './task';
import * as taskUtils from './task';
import { getNow } from './misc';

export type CreateBoardParams = Partial<Board>;
export function createBoard(boardData: CreateBoardParams): Board {
  const now = getNow();

  return {
    name: boardData.name ?? 'Your Board',
    description: boardData.description ?? 'Your local kanban board',
    columns: boardData.columns ?? [{ name: 'backlog' }, { name: 'todo' }, { name: 'working' }, { name: 'done' }],
    labels: boardData.labels ?? undefined,
    tasks: boardData.tasks ?? {},
    sprints: boardData.sprints ?? undefined,
    metadata: {
      nextId: 1,
      version: KNBN_BOARD_VERSION
    },
    dates: {
      created: now,
      updated: now,
      saved: now,
    },
  };
}

export const findDefaultColumn = (board: Board): Column | undefined => {
  return board.columns[0];
}

export const createTaskOnBoard = (board: Board, taskData: Omit<CreateTaskParams, 'id'>): {
  board: Board,
  task: Task,
} => {
  const now = getNow();

  const nextId = board.metadata.nextId;

  const task = taskUtils.createTask({
    ...taskData,
    id: nextId,
    column: findDefaultColumn(board)?.name || '',
    dates: {
      created: taskData.dates?.created || now,
      updated: taskData.dates?.updated || now,
      moved: taskData.dates?.moved,
    }
  });

  const updatedTasks = {
    ...board.tasks,
    [task.id]: task,
  };

  const updatedBoard = {
    ...board,
    tasks: updatedTasks,
    metadata: {
      ...board.metadata,
      nextId: nextId + 1,
    },
    dates: {
      ...board.dates,
      updated: now,
    }
  };

  return {
    board: updatedBoard,
    task,
  }
}

export const updateTaskOnBoard = (board: Board, taskId: number, updates: Partial<Task>): Board => {
  const task = board.tasks[taskId];
  if (!task) {
    throw new Error(`Task with ID ${taskId} not found on the board.`);
  }

  const now = getNow();
  const columnChanged = updates.column && updates.column !== task.column;

  // Update the task with new values, keeping existing values for unspecified fields
  const updatedTask: Task = {
    ...task,
    ...updates,
    id: taskId, // Ensure ID doesn't change
    dates: {
      created: task.dates.created,
      updated: now,
      moved: (columnChanged ? now : task.dates.moved)
    }
  };

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: updatedTask,
    },
    dates: {
      ...board.dates,
      updated: now,
    },
  };
}

export const getBoardFileName = (filePath: string): string => {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.knbn$/, '');
}
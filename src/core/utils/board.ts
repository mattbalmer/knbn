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

/**
 * This function is here instead of ./task.ts because it modifies the board metadata too
 */
export const newTask = (board: Board, taskData: Omit<CreateTaskParams, 'id'>): {
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

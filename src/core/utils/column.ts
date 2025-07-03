import { Column, Board, Task } from '../types/knbn';
import { getNow } from './misc';
import { sortTasks } from './task';

export type CreateColumnParams = Partial<Column> & Pick<Column, 'name'>;

export function createColumn(columnData: CreateColumnParams): Column {
  return {
    name: columnData.name,
  };
}

export const getColumnByName = (board: Board, name: string): Column | undefined => {
  return board.columns.find(column => column.name === name);
}

export const addColumnToBoard = (board: Board, column: Column, position?: number): Board => {
  const existingColumn = getColumnByName(board, column.name);
  if (existingColumn) {
    throw new Error(`Column with name "${column.name}" already exists`);
  }

  const columns = [...board.columns];
  
  if (position !== undefined && position >= 0 && position <= columns.length) {
    columns.splice(position, 0, column);
  } else {
    columns.push(column);
  }

  return {
    ...board,
    columns,
    dates: {
      ...board.dates,
      updated: getNow(),
    }
  };
}

export const updateColumnOnBoard = (board: Board, columnName: string, updates: Partial<Column>): Board => {
  const columnIndex = board.columns.findIndex(column => column.name === columnName);
  
  if (columnIndex === -1) {
    throw new Error(`Column with name "${columnName}" not found`);
  }

  const updatedColumn = {
    ...board.columns[columnIndex],
    ...updates,
    name: updates.name || board.columns[columnIndex].name,
  };

  const updatedColumns = [...board.columns];
  updatedColumns[columnIndex] = updatedColumn;

  return {
    ...board,
    columns: updatedColumns,
    dates: {
      ...board.dates,
      updated: getNow(),
    },
  };
}

export const removeColumnFromBoard = (board: Board, columnName: string): Board => {
  const columnExists = board.columns.some(column => column.name === columnName);
  
  if (!columnExists) {
    return board; // No change if column does not exist
  }

  const tasksInColumn = Object.values(board.tasks).filter(task => task.column === columnName);
  if (tasksInColumn.length > 0) {
    throw new Error(`Cannot remove column "${columnName}" because it contains ${tasksInColumn.length} task(s)`);
  }

  return {
    ...board,
    columns: board.columns.filter(column => column.name !== columnName),
    dates: {
      ...board.dates,
      updated: getNow(),
    },
  };
}

export const moveColumnOnBoard = (board: Board, columnName: string, newPosition: number): Board => {
  const columnIndex = board.columns.findIndex(column => column.name === columnName);
  
  if (columnIndex === -1) {
    throw new Error(`Column with name "${columnName}" not found`);
  }

  if (newPosition < 0 || newPosition >= board.columns.length) {
    throw new Error(`Invalid position ${newPosition}. Must be between 0 and ${board.columns.length - 1}`);
  }

  const columns = [...board.columns];
  const [movedColumn] = columns.splice(columnIndex, 1);
  columns.splice(newPosition, 0, movedColumn);

  return {
    ...board,
    columns,
    dates: {
      ...board.dates,
      updated: getNow(),
    },
  };
}

export const getTasksInColumn = (board: Board, columnName: string): Task[] => {
  return sortTasks(Object.values(board.tasks).filter(task => task.column === columnName));
}

export const getColumnTaskCount = (board: Board, columnName: string): number => {
  return getTasksInColumn(board, columnName).length;
}

export const getColumnNames = (board: Board): string[] => {
  return board.columns.map(column => column.name);
}
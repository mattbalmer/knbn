import * as columnUtils from '../utils/column';
import * as boardActions from './board';
import { Column, Board, Task } from '../types/knbn';
import { getNow } from '../utils/misc';

export const addColumn = (filePath: string, columnData: columnUtils.CreateColumnParams, position?: number): Column => {
  const board = boardActions.loadBoard(filePath);
  const column = columnUtils.createColumn(columnData);
  const updatedBoard = columnUtils.addColumnToBoard(board, column, position);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  return column;
}

export const updateColumn = (filePath: string, columnName: string, updates: Partial<Column>): Column => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = columnUtils.updateColumnOnBoard(board, columnName, updates);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  
  const updatedColumn = columnUtils.findColumnByName(boardWithUpdatedDates, updates.name || columnName);
  if (!updatedColumn) {
    throw new Error(`Updated column not found`);
  }
  
  return updatedColumn;
}

export const removeColumn = (filePath: string, columnName: string): void => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = columnUtils.removeColumnFromBoard(board, columnName);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
}

export const moveColumn = (filePath: string, columnName: string, newPosition: number): Column => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = columnUtils.moveColumnOnBoard(board, columnName, newPosition);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  
  const movedColumn = columnUtils.findColumnByName(boardWithUpdatedDates, columnName);
  if (!movedColumn) {
    throw new Error(`Moved column not found`);
  }
  
  return movedColumn;
}

export const listColumns = (filePath: string): Column[] => {
  const board = boardActions.loadBoard(filePath);
  return board.columns;
}

export const getColumn = (filePath: string, columnName: string): Column => {
  const board = boardActions.loadBoard(filePath);
  const column = columnUtils.findColumnByName(board, columnName);
  
  if (!column) {
    throw new Error(`Column with name "${columnName}" not found`);
  }
  
  return column;
}

export const getTasksInColumn = (filePath: string, columnName: string): Task[] => {
  const board = boardActions.loadBoard(filePath);
  return columnUtils.getTasksInColumn(board, columnName);
}

export const getColumnTaskCount = (filePath: string, columnName: string): number => {
  const board = boardActions.loadBoard(filePath);
  return columnUtils.getColumnTaskCount(board, columnName);
}

export const getColumnNames = (filePath: string): string[] => {
  const board = boardActions.loadBoard(filePath);
  return columnUtils.getColumnNames(board);
}
import * as columnUtils from '../utils/column';
import * as boardActions from './board';
import { Column, Board, Task } from '../types/knbn';

export const createColumn = (filePath: string, columnData: columnUtils.CreateColumnParams, position?: number): Board => {
  const board = boardActions.loadBoard(filePath);
  const column = columnUtils.createColumn(columnData);
  const updatedBoard = columnUtils.addColumnToBoard(board, column, position);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const updateColumn = (filePath: string, columnName: string, updates: Partial<Column>): Board => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = columnUtils.updateColumnOnBoard(board, columnName, updates);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const removeColumn = (filePath: string, columnName: string): Board => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = columnUtils.removeColumnFromBoard(board, columnName);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const moveColumn = (filePath: string, columnName: string, newPosition: number): Board => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = columnUtils.moveColumnOnBoard(board, columnName, newPosition);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const listColumns = (filePath: string): Column[] => {
  const board = boardActions.loadBoard(filePath);
  return board.columns;
}

export const getColumn = (filePath: string, columnName: string): Column | undefined => {
  const board = boardActions.loadBoard(filePath);
  return columnUtils.getColumnByName(board, columnName);
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
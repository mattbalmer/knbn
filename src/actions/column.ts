import * as columnUtils from '../utils/column';
import { Column, Board, Task } from '../types/knbn';
import { loadBoard, saveBoard } from '../utils/board-files';
import { Filepath } from '../types';

export const createColumn = (filepath: Filepath, columnData: columnUtils.CreateColumnParams, position?: number): Board => {
  const board = loadBoard(filepath);
  const column = columnUtils.createColumn(columnData);
  const updatedBoard = columnUtils.addColumnToBoard(board, column, position);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const updateColumn = (filepath: Filepath, columnName: string, updates: Partial<Column>): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = columnUtils.updateColumnOnBoard(board, columnName, updates);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const removeColumn = (filepath: Filepath, columnName: string): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = columnUtils.removeColumnFromBoard(board, columnName);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const moveColumn = (filepath: Filepath, columnName: string, newPosition: number): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = columnUtils.moveColumnOnBoard(board, columnName, newPosition);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const listColumns = (filepath: Filepath): Column[] => {
  const board = loadBoard(filepath);
  return board.columns;
}

export const getColumn = (filepath: Filepath, columnName: string): Column | undefined => {
  const board = loadBoard(filepath);
  return columnUtils.getColumnByName(board, columnName);
}

export const getTasksInColumn = (filepath: Filepath, columnName: string): Task[] => {
  const board = loadBoard(filepath);
  return columnUtils.getTasksInColumn(board, columnName);
}

export const getColumnTaskCount = (filepath: Filepath, columnName: string): number => {
  const board = loadBoard(filepath);
  return columnUtils.getColumnTaskCount(board, columnName);
}

export const getColumnNames = (filepath: Filepath): string[] => {
  const board = loadBoard(filepath);
  return columnUtils.getColumnNames(board);
}
import * as labelUtils from '../utils/label';
import { Label, Board } from '../types/knbn';
import { Filepath } from '../types';
import { loadBoard, saveBoard } from '../utils/board-files';

export const addLabel = (filepath: Filepath, labelData: labelUtils.CreateLabelParams): Board => {
  const board = loadBoard(filepath);
  const label = labelUtils.createLabel(labelData);
  const updatedBoard = labelUtils.addLabelToBoard(board, label);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const updateLabel = (filepath: Filepath, labelName: string, updates: Partial<Label>): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = labelUtils.updateLabelOnBoard(board, labelName, updates);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const removeLabel = (filepath: Filepath, labelName: string): Board => {
  const board = loadBoard(filepath);
  const updatedBoard = labelUtils.removeLabelFromBoard(board, labelName);
  saveBoard(filepath, updatedBoard);
  return updatedBoard;
}

export const listLabels = (filepath: Filepath): Label[] => {
  const board = loadBoard(filepath);
  return board.labels || [];
}

export const getLabel = (filepath: Filepath, labelName: string): Label | undefined => {
  const board = loadBoard(filepath);
  return labelUtils.getLabelByName(board, labelName);
}
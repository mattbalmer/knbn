import * as labelUtils from '../utils/label';
import * as boardActions from './board';
import { Label, Board } from '../types/knbn';
import { getNow } from '../utils/misc';

export const addLabel = (filePath: string, labelData: labelUtils.CreateLabelParams): Board => {
  const board = boardActions.loadBoard(filePath);
  const label = labelUtils.createLabel(labelData);
  const updatedBoard = labelUtils.addLabelToBoard(board, label);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const updateLabel = (filePath: string, labelName: string, updates: Partial<Label>): Board => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = labelUtils.updateLabelOnBoard(board, labelName, updates);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const removeLabel = (filePath: string, labelName: string): Board => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = labelUtils.removeLabelFromBoard(board, labelName);
  boardActions.saveBoard(filePath, updatedBoard);
  return updatedBoard;
}

export const listLabels = (filePath: string): Label[] => {
  const board = boardActions.loadBoard(filePath);
  return board.labels || [];
}

export const getLabel = (filePath: string, labelName: string): Label | undefined => {
  const board = boardActions.loadBoard(filePath);
  return labelUtils.getLabelByName(board, labelName);
}
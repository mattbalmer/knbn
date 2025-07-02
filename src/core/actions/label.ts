import * as labelUtils from '../utils/label';
import * as boardActions from './board';
import { Label, Board } from '../types/knbn';
import { getNow } from '../utils/misc';

export const addLabel = (filePath: string, labelData: labelUtils.CreateLabelParams): Label => {
  const board = boardActions.loadBoard(filePath);
  const label = labelUtils.createLabel(labelData);
  const updatedBoard = labelUtils.addLabelToBoard(board, label);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  return label;
}

export const updateLabel = (filePath: string, labelName: string, updates: Partial<Label>): Label => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = labelUtils.updateLabelOnBoard(board, labelName, updates);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  
  const updatedLabel = labelUtils.findLabelByName(boardWithUpdatedDates, updates.name || labelName);
  if (!updatedLabel) {
    throw new Error(`Updated label not found`);
  }
  
  return updatedLabel;
}

export const removeLabel = (filePath: string, labelName: string): void => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = labelUtils.removeLabelFromBoard(board, labelName);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
}

export const listLabels = (filePath: string): Label[] => {
  const board = boardActions.loadBoard(filePath);
  return board.labels || [];
}

export const getLabel = (filePath: string, labelName: string): Label => {
  const board = boardActions.loadBoard(filePath);
  const label = labelUtils.findLabelByName(board, labelName);
  
  if (!label) {
    throw new Error(`Label with name "${labelName}" not found`);
  }
  
  return label;
}
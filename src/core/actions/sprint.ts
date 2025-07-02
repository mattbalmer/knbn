import * as sprintUtils from '../utils/sprint';
import * as boardActions from './board';
import { Sprint, Board } from '../types/knbn';
import { getNow } from '../utils/misc';

export const addSprint = (filePath: string, sprintData: sprintUtils.CreateSprintParams): Sprint => {
  const board = boardActions.loadBoard(filePath);
  const sprint = sprintUtils.createSprint(sprintData);
  const updatedBoard = sprintUtils.addSprintToBoard(board, sprint);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  return sprint;
}

export const updateSprint = (filePath: string, sprintName: string, updates: Partial<Sprint>): Sprint => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = sprintUtils.updateSprintOnBoard(board, sprintName, updates);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
  
  const updatedSprint = sprintUtils.findSprintByName(boardWithUpdatedDates, updates.name || sprintName);
  if (!updatedSprint) {
    throw new Error(`Updated sprint not found`);
  }
  
  return updatedSprint;
}

export const removeSprint = (filePath: string, sprintName: string): void => {
  const board = boardActions.loadBoard(filePath);
  const updatedBoard = sprintUtils.removeSprintFromBoard(board, sprintName);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  boardActions.saveBoard(filePath, boardWithUpdatedDates);
}

export const listSprints = (filePath: string): Sprint[] => {
  const board = boardActions.loadBoard(filePath);
  return board.sprints || [];
}

export const getSprint = (filePath: string, sprintName: string): Sprint => {
  const board = boardActions.loadBoard(filePath);
  const sprint = sprintUtils.findSprintByName(board, sprintName);
  
  if (!sprint) {
    throw new Error(`Sprint with name "${sprintName}" not found`);
  }
  
  return sprint;
}

export const getActiveSprints = (filePath: string): Sprint[] => {
  const board = boardActions.loadBoard(filePath);
  return sprintUtils.getActiveSprints(board);
}

export const getUpcomingSprints = (filePath: string): Sprint[] => {
  const board = boardActions.loadBoard(filePath);
  return sprintUtils.getUpcomingSprints(board);
}

export const getCompletedSprints = (filePath: string): Sprint[] => {
  const board = boardActions.loadBoard(filePath);
  return sprintUtils.getCompletedSprints(board);
}
import * as sprintUtils from '../utils/sprint';
import { Sprint, Board } from '../types/knbn';
import { getNow } from '../utils/misc';
import { loadBoard, saveBoard } from '../utils/board-files';
import { Filepath } from '../types';

export const addSprint = (filepath: Filepath, sprintData: sprintUtils.CreateSprintParams): Sprint => {
  const board = loadBoard(filepath);
  const sprint = sprintUtils.createSprint(sprintData);
  const updatedBoard = sprintUtils.addSprintToBoard(board, sprint);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  saveBoard(filepath, boardWithUpdatedDates);
  return sprint;
}

export const updateSprint = (filepath: Filepath, sprintName: string, updates: Partial<Sprint>): Sprint => {
  const board = loadBoard(filepath);
  const updatedBoard = sprintUtils.updateSprintOnBoard(board, sprintName, updates);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  saveBoard(filepath, boardWithUpdatedDates);
  
  const updatedSprint = sprintUtils.getSprintByName(boardWithUpdatedDates, updates.name || sprintName);
  if (!updatedSprint) {
    throw new Error(`Updated sprint not found`);
  }
  
  return updatedSprint;
}

export const removeSprint = (filepath: Filepath, sprintName: string): void => {
  const board = loadBoard(filepath);
  const updatedBoard = sprintUtils.removeSprintFromBoard(board, sprintName);
  
  const boardWithUpdatedDates: Board = {
    ...updatedBoard,
    dates: {
      ...updatedBoard.dates,
      updated: getNow(),
    },
  };
  
  saveBoard(filepath, boardWithUpdatedDates);
}

export const listSprints = (filepath: Filepath): Sprint[] => {
  const board = loadBoard(filepath);
  return board.sprints || [];
}

export const getSprint = (filepath: Filepath, sprintName: string): Sprint => {
  const board = loadBoard(filepath);
  const sprint = sprintUtils.getSprintByName(board, sprintName);
  
  if (!sprint) {
    throw new Error(`Sprint with name "${sprintName}" not found`);
  }
  
  return sprint;
}

export const getActiveSprints = (filepath: Filepath): Sprint[] => {
  const board = loadBoard(filepath);
  return sprintUtils.getActiveSprints(board);
}

export const getUpcomingSprints = (filepath: Filepath): Sprint[] => {
  const board = loadBoard(filepath);
  return sprintUtils.getUpcomingSprints(board);
}

export const getCompletedSprints = (filepath: Filepath): Sprint[] => {
  const board = loadBoard(filepath);
  return sprintUtils.getCompletedSprints(board);
}
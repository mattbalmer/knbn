import { Sprint, Board } from '../types/knbn';
import { getNow } from './misc';

export type CreateSprintParams = Partial<Sprint> & Pick<Sprint, 'name'>;

export function createSprint(sprintData: CreateSprintParams): Sprint {
  const now = getNow();
  
  return {
    name: sprintData.name,
    description: sprintData.description,
    capacity: sprintData.capacity,
    dates: {
      created: sprintData.dates?.created || now,
      starts: sprintData.dates?.starts || now,
      ends: sprintData.dates?.ends,
    },
  };
}

export const getSprintByName = (board: Board, name: string): Sprint | undefined => {
  return board.sprints?.find(sprint => sprint.name === name);
}

export const addSprintToBoard = (board: Board, sprint: Sprint): Board => {
  const existingSprint = getSprintByName(board, sprint.name);
  if (existingSprint) {
    throw new Error(`Sprint with name "${sprint.name}" already exists`);
  }

  const sprints = board.sprints || [];
  return {
    ...board,
    sprints: [...sprints, sprint],
  };
}

export const updateSprintOnBoard = (board: Board, sprintName: string, updates: Partial<Sprint>): Board => {
  const sprints = board.sprints || [];
  const sprintIndex = sprints.findIndex(sprint => sprint.name === sprintName);
  
  if (sprintIndex === -1) {
    throw new Error(`Sprint with name "${sprintName}" not found`);
  }

  const existingSprint = sprints[sprintIndex];
  const updatedSprint = {
    ...existingSprint,
    ...updates,
    name: updates.name || existingSprint.name,
    dates: {
      ...existingSprint.dates,
      ...updates.dates,
    },
  };

  const updatedSprints = [...sprints];
  updatedSprints[sprintIndex] = updatedSprint;

  return {
    ...board,
    sprints: updatedSprints,
  };
}

export const removeSprintFromBoard = (board: Board, sprintName: string): Board => {
  const sprints = board.sprints || [];
  const sprintExists = sprints.some(sprint => sprint.name === sprintName);
  
  if (!sprintExists) {
    throw new Error(`Sprint with name "${sprintName}" not found`);
  }

  return {
    ...board,
    sprints: sprints.filter(sprint => sprint.name !== sprintName),
  };
}

export const getActiveSprints = (board: Board): Sprint[] => {
  const sprints = board.sprints || [];
  const now = new Date();
  
  return sprints.filter(sprint => {
    const startDate = new Date(sprint.dates.starts);
    const endDate = sprint.dates.ends ? new Date(sprint.dates.ends) : null;
    
    return startDate <= now && (!endDate || endDate >= now);
  });
}

export const getUpcomingSprints = (board: Board): Sprint[] => {
  const sprints = board.sprints || [];
  const now = new Date();
  
  return sprints.filter(sprint => {
    const startDate = new Date(sprint.dates.starts);
    return startDate > now;
  });
}

export const getCompletedSprints = (board: Board): Sprint[] => {
  const sprints = board.sprints || [];
  const now = new Date();
  
  return sprints.filter(sprint => {
    const endDate = sprint.dates.ends ? new Date(sprint.dates.ends) : null;
    return endDate && endDate < now;
  });
}
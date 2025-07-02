import { Label, Board } from '../types/knbn';

export type CreateLabelParams = Partial<Label> & Pick<Label, 'name'>;

export function createLabel(labelData: CreateLabelParams): Label {
  return {
    name: labelData.name,
    color: labelData.color,
  };
}

export const findLabelByName = (board: Board, name: string): Label | undefined => {
  return board.labels?.find(label => label.name === name);
}

export const addLabelToBoard = (board: Board, label: Label): Board => {
  const existingLabel = findLabelByName(board, label.name);
  if (existingLabel) {
    throw new Error(`Label with name "${label.name}" already exists`);
  }

  const labels = board.labels || [];
  return {
    ...board,
    labels: [...labels, label],
  };
}

export const updateLabelOnBoard = (board: Board, labelName: string, updates: Partial<Label>): Board => {
  const labels = board.labels || [];
  const labelIndex = labels.findIndex(label => label.name === labelName);
  
  if (labelIndex === -1) {
    throw new Error(`Label with name "${labelName}" not found`);
  }

  const updatedLabel = {
    ...labels[labelIndex],
    ...updates,
    name: updates.name || labels[labelIndex].name,
  };

  const updatedLabels = [...labels];
  updatedLabels[labelIndex] = updatedLabel;

  return {
    ...board,
    labels: updatedLabels,
  };
}

export const removeLabelFromBoard = (board: Board, labelName: string): Board => {
  const labels = board.labels || [];
  const labelExists = labels.some(label => label.name === labelName);
  
  if (!labelExists) {
    throw new Error(`Label with name "${labelName}" not found`);
  }

  return {
    ...board,
    labels: labels.filter(label => label.name !== labelName),
  };
}

export const getLabelsByNames = (board: Board, labelNames: string[]): Label[] => {
  const labels = board.labels || [];
  return labelNames
    .map(name => labels.find(label => label.name === name))
    .filter((label): label is Label => label !== undefined);
}
import { Label, Board } from '../types/knbn';
import { getNow } from './misc';

export type CreateLabelParams = Partial<Label> & Pick<Label, 'name'>;

export function createLabel(labelData: CreateLabelParams): Label {
  return {
    name: labelData.name,
    color: labelData.color,
  };
}

export const getLabelByName = (board: Board, name: string): Label | undefined => {
  const nameLower = name.toLowerCase();
  return board.labels?.find(label =>
    label.name.toLowerCase() === name.toLowerCase()
  );
}

export const addLabelToBoard = (board: Board, label: Label): Board => {
  const existingLabel = getLabelByName(board, label.name);
  if (existingLabel) {
    throw new Error(`Label with name "${label.name}" already exists`);
  }

  const labels = board.labels || [];
  return {
    ...board,
    labels: [...labels, label],
    dates: {
      ...board.dates,
      updated: getNow(),
    },
  };
}

export const updateLabelOnBoard = (board: Board, labelName: string, updates: Partial<Label>): Board => {
  const labels = board.labels || [];
  const nameLower = labelName.toLowerCase();
  const labelIndex = labels.findIndex(label => label.name.toLowerCase() === nameLower);
  
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
    dates: {
      ...board.dates,
      updated: getNow(),
    },
  };
}

export const removeLabelFromBoard = (board: Board, labelName: string): Board => {
  const labels = board.labels || [];
  const labelNameLower = labelName.toLowerCase();
  const labelExists = labels.some(label => label.name.toLowerCase() === labelNameLower);
  
  if (!labelExists) {
    return board;
  }

  return {
    ...board,
    labels: labels.filter(label => label.name !== labelName),
    dates: {
      ...board.dates,
      updated: getNow(),
    },
  };
}

/**
 * Partial name match or exact color match if starts with #, rgb(, or hsl(
 */
export const findLabels = (board: Board, query: string): Label[] => {
  const queryLower = query.toLowerCase();

  const isSearchingColor = queryLower.startsWith('#') || queryLower.startsWith('rgb(') || queryLower.startsWith('hsl(');

  if (isSearchingColor) {
    return board.labels
      ?.filter((label) => label.color?.toLowerCase() === queryLower)
      ?? [];
  }

  return board.labels
    ?.filter((label) =>
      label.name.toLowerCase().includes(queryLower) || label.color?.toLowerCase().includes(queryLower)
    )
    ?? [];
}
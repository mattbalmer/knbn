import { Board, Filepath } from '../types';
import { getNow } from './misc';
import * as yaml from 'js-yaml';
import fs from 'fs';

export const saveBoard = (filePath: Filepath, board: Board): void => {
  // TODO: validate board and path

  const updatedBoard: Board = {
    ...board,
    dates: {
      ...board.dates,
      saved: getNow(),
    },
  };

  try {
    const content = yaml.dump(updatedBoard, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to save board file: ${error}`);
  }
}

export const loadBoard = (filepath: Filepath): Board => {
  // TODO: validate board and path

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = yaml.load(content) as Board;

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid board file format');
    }

    return {
      name: data.name,
      description: data.description,
      columns: data.columns,
      labels: data.labels,
      tasks: data.tasks || {},
      sprints: data.sprints,
      dates: data.dates,
      metadata: data.metadata,
    };
  } catch (error) {
    throw new Error(`Failed to load board file: ${error}`);
  }
}

/**
 * Loads specific fields from a board file.
 *
 * The idea here is that - in the future, you can skip full validation steps (which are not yet implemented)
 */
export const loadBoardFields = <K extends keyof Board>(filePath: Filepath, keys: K[]): Pick<Board, K> => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as Board;

    const board: Pick<Board, K> = Object.entries(data)
      .filter(([key]) => keys.includes(key as K))
      .reduce((obj, [key, value]) => {
        (obj as any)[key] = value;
        return obj;
      }, {} as Pick<Board, K>);

    return board;
  } catch (error) {
    throw new Error(`Failed to load board file: ${error}`);
  }
}
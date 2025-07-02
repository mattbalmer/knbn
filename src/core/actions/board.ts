import * as boardUtils from '../utils/board';
import { Board } from '../types/knbn';
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import { getNow } from '../utils/misc';

export const findBoardFiles = (dirPath: string): string[] => {
  const possibleFiles = [
    ...fs.readdirSync(dirPath).filter(file => file.endsWith('.knbn'))
  ];

  // If ".knbn" exists, it should be the first file
  const orderedFiles = possibleFiles.sort((a, b) => {
    if (a === '.knbn') return -1; // ".knbn" should come first
    if (b === '.knbn') return 1;
    return 0;
  });

  return orderedFiles.map(file => path.join(dirPath, file));
}

export const createBoard = (filePath: string, boardData: boardUtils.CreateBoardParams): Board => {
  // First prepare the file
  if (fs.existsSync(filePath)) {
    throw new Error(`Board file ${filePath} already exists`);
  }
  const fileName = boardUtils.getBoardFileName(filePath);

  // Then create the board
  const board = boardUtils.createBoard({
    ...boardData,
    name: boardData.name || fileName,
  });

  // Add an initial task, for fun (if no tasks are provided)
  if (!board.tasks || Object.keys(board.tasks).length === 0) {
    boardUtils.createTaskOnBoard(board, {
      title: 'Create a .knbn!',
      description: 'Create your .knbn file to start using KnBn',
      column: 'done',
    });
  }

  saveBoard(filePath, board);
  return board;
}

export const saveBoard = (filePath: string, board: Board): void => {
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

export const loadBoard = (filePath: string): Board => {
  // TODO: validate board and path

  try {
    const content = fs.readFileSync(filePath, 'utf8');
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
export const loadBoardFields = <K extends keyof Board>(filePath: string, keys: K[]): Pick<Board, K> => {
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
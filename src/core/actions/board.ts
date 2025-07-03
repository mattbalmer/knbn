import * as boardUtils from '../utils/board';
import { Board } from '../types';
import fs from 'fs';
import path from 'path';
import { extractFilenameFromPath } from '../utils/files';
import { Dirpath, Filepath } from '../types';
import { Brands } from '../utils/ts';
import { saveBoard } from '../utils/board-files';

export const findBoardFiles = (dirPath: Dirpath<'abs'>): Filepath<'abs'>[] => {
  const possibleFiles = [
    ...fs.readdirSync(dirPath).filter(file => file.endsWith('.knbn'))
  ];

  // If ".knbn" exists, it should be the first file
  const orderedFiles = possibleFiles.sort((a, b) => {
    if (a === '.knbn') return -1; // ".knbn" should come first
    if (b === '.knbn') return 1;
    return 0;
  });

  return orderedFiles.map(file => Brands.Filepath(path.join(dirPath, file)));
}

export const createBoard = (filePath: Filepath<'abs'>, boardData: boardUtils.CreateBoardParams): Board => {
  // First prepare the file
  if (fs.existsSync(filePath)) {
    throw new Error(`Board file ${filePath} already exists`);
  }

  // Then create the board
  const board = boardUtils.createBoard(boardData);

  // Add an initial task, for fun (if no tasks are provided)
  if (!board.tasks || Object.keys(board.tasks).length === 0) {
    boardUtils.newTask(board, {
      title: 'Create a .knbn!',
      description: 'Create your .knbn file to start using KnBn',
      column: 'done',
    });
  }

  saveBoard(filePath, board);
  return board;
}

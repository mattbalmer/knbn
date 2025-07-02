import { Command } from 'commander';
import { createBoard } from '../../core/actions/board';
import { getFilenameFromBoardName, getFilepathForBoardFile } from '../../core/utils/files';

export const attachCreateBoard = (program: Command) =>
  program
    .command('create-board [name]')
    .description('Create a new board file')
    .action((name) => {
      try {
        const boardName = name || 'My Board';
        const filePath = getFilepathForBoardFile(getFilenameFromBoardName(boardName));
        createBoard(filePath, { name: boardName });
        const fileName = getFilepathForBoardFile(filePath);
        console.log(`Created board file: ${fileName}`);
      } catch (error) {
        console.error(`Failed to create board: ${error}`);
        process.exit(1);
      }
    });
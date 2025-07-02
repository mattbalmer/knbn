import { Command } from 'commander';
import { createBoard } from '../../core/actions/board';

export const attachCreateBoard = (program: Command) =>
  program
    .command('create-board [name]')
    .description('Create a new board file')
    .action((name) => {
      try {
        const boardName = name || 'My Board';
        const filePath = `${boardName.toLowerCase().replace(/\s+/g, '-')}.knbn`;
        createBoard(filePath, { name: boardName });
        const fileName = filePath;
        console.log(`Created board file: ${fileName}`);
      } catch (error) {
        console.error(`Failed to create board: ${error}`);
        process.exit(1);
      }
    });
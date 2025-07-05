import { Command } from 'commander';
import { createBoardFile } from '../utils/board';

export const attachCreateBoard = (program: Command) =>
  program
    .command('create-board [name]')
    .description('Create a new board file')
    .action((name) => {
      createBoardFile(name);
    });
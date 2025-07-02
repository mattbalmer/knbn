import { Command } from 'commander';
import { attachServe } from './commands/serve';
import { attachCreateBoard } from './commands/create-board';
import { attachCreateTask } from './commands/create-task';
import { attachUpdateTask } from './commands/update-task';
import { listBoardFiles } from './utils/board';

const program = new Command();

export function setupCommander(): Command {
  program
    .name('knbn')
    .description('KnBn - Kanban CLI Tool')
    .version('0.2.3');

  attachServe(program);
  attachCreateBoard(program);
  attachCreateTask(program);
  attachUpdateTask(program);

  program.action(async (options) => {
    await listBoardFiles(options['no-prompt']);
  });

  return program;
}
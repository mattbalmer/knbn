import { Command } from 'commander';
import { attachServe } from './commands/serve';
import { attachCreateBoard } from './commands/create-board';
import { attachCreateTask } from './commands/create-task';
import { attachUpdateTask } from './commands/update-task';
import { attachDefault, attachListBoards } from './commands/list-boards';
import { KNBN_CORE_VERSION } from '../core/constants';

const program = new Command();

export function setupCommander(): Command {
  program
    .name('knbn')
    .description('KnBn - Kanban CLI Tool')
    .version(KNBN_CORE_VERSION);

  attachServe(program);
  attachCreateBoard(program);
  attachCreateTask(program);
  attachUpdateTask(program);
  attachListBoards(program);
  attachDefault(program);

  return program;
}
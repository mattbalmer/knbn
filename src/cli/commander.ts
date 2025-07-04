import { Command } from 'commander';
import { attachServe } from './commands/serve';
import { attachCreateBoard } from './commands/create-board';
import { attachCreateTask } from './commands/create-task';
import { attachUpdateTask } from './commands/update-task';
import { attachDefault, attachListBoards } from './commands/list-boards';
import { attachListTasks } from './commands/list-tasks';
import { attachGetTask } from './commands/get-task';
import { attachListColumns } from './commands/list-columns';
import { attachCreateColumn } from './commands/create-column';
import { attachMoveColumn } from './commands/move-column';
import { attachRemoveColumn } from './commands/remove-column';
import { attachUpdateColumn } from './commands/update-column';
import { attachListLabels } from './commands/list-labels';
import { attachAddLabel } from './commands/add-label';
import { attachUpdateLabel } from './commands/update-label';
import { attachRemoveLabel } from './commands/remove-label';
import { attachListSprints } from './commands/list-sprints';
import { attachAddSprint } from './commands/add-sprint';
import { attachUpdateSprint } from './commands/update-sprint';
import { attachRemoveSprint } from './commands/remove-sprint';
import { KNBN_CORE_VERSION } from '../core/constants';

const program = new Command();

export function setupCommander(): Command {
  program
    .name('knbn')
    .description('KnBn - Kanban CLI Tool')
    .version(KNBN_CORE_VERSION);

  // Serve Command
  attachServe(program);
  // Board Commands
  attachListBoards(program);
  attachCreateBoard(program);
  // Task Commands
  attachGetTask(program);
  attachListTasks(program);
  attachCreateTask(program);
  attachUpdateTask(program);
  // Column Commands
  attachListColumns(program);
  attachCreateColumn(program);
  attachUpdateColumn(program);
  attachRemoveColumn(program);
  attachMoveColumn(program);
  // Label Commands
  attachListLabels(program);
  attachAddLabel(program);
  attachUpdateLabel(program);
  attachRemoveLabel(program);
  // Sprint Commands
  attachListSprints(program);
  attachAddSprint(program);
  attachUpdateSprint(program);
  attachRemoveSprint(program);
  // Default command
  attachDefault(program);

  return program;
}
import { Command } from 'commander';
import * as TaskActions from '../../core/actions/task';
import { ensureBoardFile } from '../utils/board';

export const attachCreateTask = (program: Command) =>
  program
    .command('create-task <title>')
    .description('Create a new task')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--no-prompt', 'Skip prompts for board creation')
    .action(async (title, options: {
      file?: string;
      noPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.noPrompt);

      try {
        const taskTitle = title || 'New Task';
        const { task } = TaskActions.createTask(boardFile, { title: taskTitle });

        if (task) {
          console.log(`Created task #${task.id}: ${task.title}`);
          console.log(`Column: ${task.column}`);
        }
      } catch (error) {
        console.error(`Failed to create task: ${error}`);
        process.exit(1);
      }
    });
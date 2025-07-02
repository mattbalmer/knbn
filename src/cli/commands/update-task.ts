import { Command } from 'commander';
import * as TaskActions from '../../core/actions/task';
import { ensureBoardFile } from '../utils/board';

export const attachUpdateTask = (program: Command) =>
  program
    .command('update-task <id>')
    .description('Update an existing task')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--title <text>', 'Update the task title')
    .option('--column <column>', 'Update the task column')
    .option('--description <text>', 'Update the task description')
    .option('--priority <number>', 'Update the task priority')
    .option('--no-prompt', 'Skip prompts for board creation')
    .action(async (taskId, options) => {
      const boardFile = await ensureBoardFile(options.file, options['no-prompt']);

      const id = parseInt(taskId, 10);
      if (isNaN(id)) {
        console.error('Task ID must be a number');
        process.exit(1);
      }

      try {
        const updates: Partial<any> = {};
        if (options.title) updates.title = options.title;
        if (options.column) updates.column = options.column;
        if (options.description) updates.description = options.description;
        if (options.priority) {
          const priority = parseInt(options.priority, 10);
          if (!isNaN(priority)) {
            updates.priority = priority;
          }
        }

        if (Object.keys(updates).length === 0) {
          console.error('No updates specified. Use --title, --column, --description, or --priority');
          process.exit(1);
        }

        const board = TaskActions.updateTask(boardFile, id, updates);
        const task = board.tasks[id];
        if (!task) {
          console.error(`Task #${id} not found`);
          process.exit(1);
        }

        console.log(`Updated task #${task.id}: ${task.title}`);
        console.log(`Column: ${task.column}`);
      } catch (error) {
        console.error(`Failed to update task: ${error}`);
        process.exit(1);
      }
    });
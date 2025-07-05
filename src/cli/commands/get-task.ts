import { Command } from 'commander';
import * as TaskActions from '../../core/actions/task';
import { ensureBoardFile } from '../utils/board';

export const attachGetTask = (program: Command) =>
  program
    .command('get-task <id>')
    .description('Get details of a specific task')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (id: string, options: {
      file?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);
      const taskId = parseInt(id);

      if (isNaN(taskId)) {
        console.error('Task ID must be a number');
        process.exit(1);
      }

      try {
        const task = TaskActions.getTask(boardFile, taskId);

        if (!task) {
          console.error(`Task #${taskId} not found`);
          process.exit(1);
        }

        console.log(`Task #${task.id}: ${task.title}`);
        console.log(`Column: ${task.column}`);
        
        if (task.description) {
          console.log(`Description: ${task.description}`);
        }
        
        if (task.priority) {
          console.log(`Priority: ${task.priority}`);
        }
        
        if (task.sprint) {
          console.log(`Sprint: ${task.sprint}`);
        }
        
        if (task.labels && task.labels.length > 0) {
          console.log(`Labels: ${task.labels.join(', ')}`);
        }
        
        if (task.storyPoints) {
          console.log(`Story Points: ${task.storyPoints}`);
        }
        
        console.log(`Created: ${task.dates.created}`);
        console.log(`Updated: ${task.dates.updated}`);
        
        if (task.dates.moved) {
          console.log(`Last Moved: ${task.dates.moved}`);
        }
      } catch (error) {
        console.error(`Failed to get task: ${error}`);
        process.exit(1);
      }
    });
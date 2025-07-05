import { Command } from 'commander';
import * as TaskActions from '../../core/actions/task';
import { ensureBoardFile } from '../utils/board';

export const attachListTasks = (program: Command) =>
  program
    .command('list-tasks')
    .description('List tasks with optional filtering')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('-q, --query <query>', 'Search query to filter tasks')
    .option('-c, --column <column>', 'Filter by column')
    .option('-l, --label <label>', 'Filter by label')
    .option('-s, --sprint <sprint>', 'Filter by sprint')
    .option('-p, --priority <priority>', 'Filter by priority (number)')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (options: {
      file?: string;
      query?: string;
      column?: string;
      label?: string;
      sprint?: string;
      priority?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        let tasks = TaskActions.findTasks(boardFile, options.query || '');

        // Apply additional filters
        if (options.column) {
          tasks = tasks.filter(task => task.column === options.column);
        }
        if (options.label) {
          tasks = tasks.filter(task => task.labels?.includes(options.label!));
        }
        if (options.sprint) {
          tasks = tasks.filter(task => task.sprint === options.sprint);
        }
        if (options.priority) {
          const priority = parseInt(options.priority);
          if (!isNaN(priority)) {
            tasks = tasks.filter(task => task.priority === priority);
          }
        }

        if (tasks.length === 0) {
          console.log('No tasks found.');
          return;
        }

        console.log(`Found ${tasks.length} task(s):\n`);
        
        tasks.forEach(task => {
          console.log(`#${task.id}: ${task.title}`);
          console.log(`  Column: ${task.column}`);
          if (task.description) {
            console.log(`  Description: ${task.description}`);
          }
          if (task.priority) {
            console.log(`  Priority: ${task.priority}`);
          }
          if (task.sprint) {
            console.log(`  Sprint: ${task.sprint}`);
          }
          if (task.labels && task.labels.length > 0) {
            console.log(`  Labels: ${task.labels.join(', ')}`);
          }
          if (task.storyPoints) {
            console.log(`  Story Points: ${task.storyPoints}`);
          }
          console.log(`  Created: ${task.dates.created}`);
          console.log('');
        });
      } catch (error) {
        console.error(`Failed to list tasks: ${error}`);
        process.exit(1);
      }
    });
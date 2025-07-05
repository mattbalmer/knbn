import { Command } from 'commander';
import * as ColumnActions from '../../core/actions/column';
import { ensureBoardFile } from '../utils/board';

export const attachRemoveColumn = (program: Command) =>
  program
    .command('remove-column <name>')
    .description('Remove a column from the board')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        // Check if column exists first
        const existingColumn = ColumnActions.getColumn(boardFile, name);
        if (!existingColumn) {
          console.log(`Column "${name}" was not found`);
          return;
        }

        // Check if column has tasks before removing
        const taskCount = ColumnActions.getColumnTaskCount(boardFile, name);
        
        if (taskCount > 0) {
          console.error(`Cannot remove column "${name}" because it contains ${taskCount} task(s)`);
          console.error('Move or remove the tasks first, then try again.');
          process.exit(1);
        }

        ColumnActions.removeColumn(boardFile, name);
        console.log(`Removed column: ${name}`);
      } catch (error) {
        console.error(`Failed to remove column: ${error}`);
        process.exit(1);
      }
    });
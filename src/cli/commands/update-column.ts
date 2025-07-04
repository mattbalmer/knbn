import { Command } from 'commander';
import * as ColumnActions from '../../core/actions/column';
import { ensureBoardFile } from '../utils/board';

export const attachUpdateColumn = (program: Command) =>
  program
    .command('update-column <name>')
    .description('Update an existing column')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--name <newName>', 'New column name')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      name?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const updates: any = {};

        if (options.name) {
          updates.name = options.name;
        }

        if (Object.keys(updates).length === 0) {
          console.log('No updates specified. Use --help to see available options.');
          return;
        }

        // Check if column exists before updating
        const existingColumn = ColumnActions.getColumn(boardFile, name);
        if (!existingColumn) {
          console.error(`Column "${name}" not found`);
          process.exit(1);
        }

        const updatedBoard = ColumnActions.updateColumn(boardFile, name, updates);
        const updatedColumn = ColumnActions.getColumn(boardFile, updates.name || name);

        if (updatedColumn) {
          console.log(`Updated column: ${updatedColumn.name}`);
          if (updates.name && updates.name !== name) {
            console.log(`Renamed from: ${name}`);
          }
        }
      } catch (error) {
        console.error(`Failed to update column: ${error}`);
        process.exit(1);
      }
    });
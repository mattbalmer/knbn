import { Command } from 'commander';
import * as ColumnActions from '../../core/actions/column';
import { ensureBoardFile } from '../utils/board';

export const attachCreateColumn = (program: Command) =>
  program
    .command('create-column <name>')
    .description('Create a new column')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('-p, --position <position>', 'Position to insert the column (0-based index)')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      position?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const columnData = {
          name,
        };

        const position = options.position ? parseInt(options.position) : undefined;
        
        if (options.position && (isNaN(position!) || position! < 0)) {
          console.error('Position must be a non-negative number');
          process.exit(1);
        }

        const updatedBoard = ColumnActions.createColumn(boardFile, columnData, position);
        const createdColumn = updatedBoard.columns.find(col => col.name === name);

        if (createdColumn) {
          console.log(`Created column: ${createdColumn.name}`);
          if (position !== undefined) {
            console.log(`Position: ${position}`);
          }
        }
      } catch (error) {
        console.error(`Failed to create column: ${error}`);
        process.exit(1);
      }
    });
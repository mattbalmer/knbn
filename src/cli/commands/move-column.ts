import { Command } from 'commander';
import * as ColumnActions from '../../core/actions/column';
import { ensureBoardFile } from '../utils/board';

export const attachMoveColumn = (program: Command) =>
  program
    .command('move-column <name> <position>')
    .description('Move a column to a new position')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, position: string, options: {
      file?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);
      const newPosition = parseInt(position);

      if (isNaN(newPosition) || newPosition < 0) {
        console.error('Position must be a non-negative number');
        process.exit(1);
      }

      try {
        const updatedBoard = ColumnActions.moveColumn(boardFile, name, newPosition);
        const movedColumn = updatedBoard.columns[newPosition];

        if (movedColumn && movedColumn.name === name) {
          console.log(`Moved column "${name}" to position ${newPosition}`);
        } else {
          console.log(`Column "${name}" moved successfully`);
        }
      } catch (error) {
        console.error(`Failed to move column: ${error}`);
        process.exit(1);
      }
    });
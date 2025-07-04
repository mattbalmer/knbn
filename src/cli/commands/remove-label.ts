import { Command } from 'commander';
import * as LabelActions from '../../core/actions/label';
import { ensureBoardFile } from '../utils/board';

export const attachRemoveLabel = (program: Command) =>
  program
    .command('remove-label <name>')
    .description('Remove a label from the board')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        // Check if label exists before removing
        const existingLabel = LabelActions.getLabel(boardFile, name);
        if (!existingLabel) {
          console.error(`Label "${name}" not found`);
          process.exit(1);
        }

        const updatedBoard = LabelActions.removeLabel(boardFile, name);
        const labelStillExists = updatedBoard.labels?.some(label => 
          label.name.toLowerCase() === name.toLowerCase()
        );

        if (!labelStillExists) {
          console.log(`Removed label: ${name}`);
        } else {
          console.log(`Label "${name}" was not found`);
        }
      } catch (error) {
        console.error(`Failed to remove label: ${error}`);
        process.exit(1);
      }
    });
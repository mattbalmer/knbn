import { Command } from 'commander';
import * as LabelActions from '../../core/actions/label';
import { ensureBoardFile } from '../utils/board';

export const attachAddLabel = (program: Command) =>
  program
    .command('add-label <name>')
    .description('Create a new label')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('-c, --color <color>', 'Label color (hex, rgb, or hsl format)')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      color?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const labelData = {
          name,
          color: options.color,
        };

        const updatedBoard = LabelActions.addLabel(boardFile, labelData);
        const createdLabel = updatedBoard.labels?.find(label => label.name === name);

        if (createdLabel) {
          console.log(`Created label: ${createdLabel.name}`);
          if (createdLabel.color) {
            console.log(`Color: ${createdLabel.color}`);
          }
        }
      } catch (error) {
        console.error(`Failed to create label: ${error}`);
        process.exit(1);
      }
    });
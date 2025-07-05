import { Command } from 'commander';
import * as LabelActions from '../../core/actions/label';
import { ensureBoardFile } from '../utils/board';

export const attachUpdateLabel = (program: Command) =>
  program
    .command('update-label <name>')
    .description('Update an existing label')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--name <newName>', 'New label name')
    .option('-c, --color <color>', 'Label color (hex, rgb, or hsl format)')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      name?: string;
      color?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const updates: any = {};

        if (options.name) {
          updates.name = options.name;
        }

        if (options.color !== undefined) {
          updates.color = options.color;
        }

        if (Object.keys(updates).length === 0) {
          console.log('No updates specified. Use --help to see available options.');
          return;
        }

        // Check if label exists before updating
        const existingLabel = LabelActions.getLabel(boardFile, name);
        if (!existingLabel) {
          console.error(`Label "${name}" not found`);
          process.exit(1);
        }

        const updatedBoard = LabelActions.updateLabel(boardFile, name, updates);
        const updatedLabel = updatedBoard.labels?.find(label => 
          label.name === (updates.name || name)
        );

        if (updatedLabel) {
          console.log(`Updated label: ${updatedLabel.name}`);
          if (updates.name && updates.name !== name) {
            console.log(`Renamed from: ${name}`);
          }
          if (updatedLabel.color) {
            console.log(`Color: ${updatedLabel.color}`);
          }
        }
      } catch (error) {
        console.error(`Failed to update label: ${error}`);
        process.exit(1);
      }
    });
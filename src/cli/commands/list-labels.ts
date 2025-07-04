import { Command } from 'commander';
import * as LabelActions from '../../core/actions/label';
import { ensureBoardFile } from '../utils/board';

export const attachListLabels = (program: Command) =>
  program
    .command('list-labels')
    .description('List all labels in the board')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (options: {
      file?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const labels = LabelActions.listLabels(boardFile);

        if (labels.length === 0) {
          console.log('No labels found.');
          return;
        }

        console.log(`Found ${labels.length} label(s):\n`);

        labels.forEach((label, index) => {
          console.log(`${index + 1}. ${label.name}`);
          
          if (label.color) {
            console.log(`   Color: ${label.color}`);
          }
          
          console.log('');
        });
      } catch (error) {
        console.error(`Failed to list labels: ${error}`);
        process.exit(1);
      }
    });
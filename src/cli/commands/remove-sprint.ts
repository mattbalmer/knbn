import { Command } from 'commander';
import * as SprintActions from '../../core/actions/sprint';
import { ensureBoardFile } from '../utils/board';

export const attachRemoveSprint = (program: Command) =>
  program
    .command('remove-sprint <name>')
    .description('Remove a sprint from the board')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        // Check if sprint exists before removing
        try {
          SprintActions.getSprint(boardFile, name);
        } catch (error) {
          console.error(`Sprint "${name}" not found`);
          process.exit(1);
        }

        SprintActions.removeSprint(boardFile, name);
        console.log(`Removed sprint: ${name}`);
      } catch (error) {
        console.error(`Failed to remove sprint: ${error}`);
        process.exit(1);
      }
    });
import { Command } from 'commander';
import { promptForBoardCreation } from '../utils/board';
import { extractFilenameFromPath, pcwd } from '../../core/utils/files';
import { findBoardFiles } from '../../core/actions/board';
import { loadBoardFields } from '../../core/utils/board-files';

const listBoards = async (options: {
  skipPrompt?: boolean;
}) => {
  const cwd = pcwd();
  const files = findBoardFiles(cwd);

  if (files.length > 0) {
    console.log(`Found ${files.length} .knbn board files:`);
    files
      .map(filepath => [
        extractFilenameFromPath(filepath),
        loadBoardFields(filepath, ['name']),
      ] as const)
      .forEach(([filename, { name }]) => {
        console.log(`  ${filename}: ${name}`);
      });
  } else {
    console.log('No .knbn board files found in current directory.');
    await promptForBoardCreation(options.skipPrompt);
  }

  console.log('\nUse -h for help and available commands.');
}

export const attachListBoards = (program: Command) =>
  program
    .command('list')
    .description('List board files')
    .option('--skip-prompt', 'Skip prompts for board creation')
    .action(async (options: {
      skipPrompt?: boolean;
    }) => {
      console.error('wtf', options);
      await listBoards(options);
    });

export const attachDefault = (program: Command) =>
  program
    .action(async () => {
      await listBoards({
        skipPrompt: true,
      });
      console.log('\nUse -h for help and available commands.');
    });
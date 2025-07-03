import * as readline from 'readline';
import { findBoardFiles, createBoard } from '../../core/actions/board';
import { ensureAbsolutePath, getFilenameFromBoardName, getFilepathForBoardFile, pcwd } from '../../core/utils/files';
import { Filepath } from '../../core/types';
import path from 'path';

export async function promptForBoardCreation(skipPrompt: boolean = false): Promise<Filepath<'abs'> | undefined> {
  if (skipPrompt) {
    console.log('Skipping prompt for board creation, as per --skip-prompt flag');
    return undefined;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const shouldCreate = await new Promise<string>((resolve) => {
      rl.question('Would you like to create a new board? (y/n): ', resolve);
    });

    if (shouldCreate.toLowerCase() === 'y' || shouldCreate.toLowerCase() === 'yes') {
      const boardName = await new Promise<string>((resolve) => {
        rl.question('Enter board name (optional, press Enter for default): ', resolve);
      });

      return createBoardFile(boardName);
    } else {
      console.log('Create a new board anytime with: knbn create-board [name]');
    }
  } catch (error) {
    console.error(`Failed to create board: ${error}`);
  } finally {
    rl.close();
  }
}

export async function ensureBoardFile(providedFile?: string, skipPrompt: boolean = false): Promise<Filepath<'abs'>> {
  let boardFile = providedFile ? ensureAbsolutePath(providedFile) : findBoardFiles(pcwd())[0];
  if (!boardFile) {
    console.log('No .knbn board file found in current directory');
    const createdFile = await promptForBoardCreation(skipPrompt);
    if (!createdFile) {
      console.error('Cannot continue without a .knbn file');
      process.exit(1);
    }
    boardFile = createdFile;
  }
  return boardFile;
}

export const createBoardFile = (name: string): Filepath<'abs'> => {
  try {
    const filepath = getFilepathForBoardFile(getFilenameFromBoardName(name));
    createBoard(filepath, { name });
    const filename = path.basename(filepath);
    console.log(`Created board file: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`Failed to create board: ${error}`);
    process.exit(1);
  }
}
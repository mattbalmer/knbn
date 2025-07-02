import * as fs from 'fs';
import * as readline from 'readline';
import { findBoardFiles, createBoard } from '../../core/actions/board';
import { ensureAbsolutePath, getFilenameFromBoardName, getFilepathForBoardFile, pcwd } from '../../core/utils/files';
import { Filepath } from '../../core/types';

export async function promptForBoardCreation(noPrompt: boolean = false): Promise<Filepath<'abs'> | undefined> {
  if (noPrompt) {
    console.log('Skipping prompt for board creation, as per --no-prompt flag');
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

      const name = boardName.trim() || 'My Board';
      const filePath = getFilepathForBoardFile(name);
      createBoard(filePath, { name });
      const fileName = getFilenameFromBoardName(filePath);
      console.log(`Created board file: ${fileName}`);
      return filePath;
    } else {
      console.log('Create a new board anytime with: knbn create-board [name]');
    }
  } catch (error) {
    console.error(`Failed to create board: ${error}`);
  } finally {
    rl.close();
  }
}

export async function ensureBoardFile(providedFile?: string, noPrompt: boolean = false): Promise<Filepath<'abs'>> {
  let boardFile = providedFile ? ensureAbsolutePath(providedFile) : findBoardFiles(pcwd())[0];
  if (!boardFile) {
    console.log('No .knbn board file found in current directory');
    const createdFile = await promptForBoardCreation(noPrompt);
    if (!createdFile) {
      console.error('Cannot continue without a .knbn file');
      process.exit(1);
    }
    boardFile = createdFile;
  }
  return boardFile;
}
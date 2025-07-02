import * as fs from 'fs';
import * as readline from 'readline';
import { findBoardFiles, createBoard } from '../../core/actions/board';

export async function promptForBoardCreation(noPrompt: boolean = false): Promise<string | undefined> {
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
      const filePath = `${name.toLowerCase().replace(/\s+/g, '-')}.knbn`;
      createBoard(filePath, { name });
      const fileName = filePath;
      console.log(`Created board file: ${fileName}`);
      return fileName;
    } else {
      console.log('Create a new board anytime with: knbn create-board [name]');
    }
  } catch (error) {
    console.error(`Failed to create board: ${error}`);
  } finally {
    rl.close();
  }
}

export async function listBoardFiles(noPrompt: boolean = false): Promise<void> {
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd).filter(file => file.endsWith('.knbn'));
  
  if (files.length === 0) {
    console.log('No .knbn board files found in current directory.');
    await promptForBoardCreation(noPrompt);
  } else {
    console.log('Found .knbn board files:');
    files.forEach(file => {
      console.log(`  ${file}`);
    });
  }
  
  console.log('\nUse -h for help and available commands.');
}

export async function ensureBoardFile(providedFile?: string, noPrompt: boolean = false): Promise<string> {
  let boardFile = providedFile || findBoardFiles(process.cwd())[0];
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
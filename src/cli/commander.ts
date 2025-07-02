import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { findBoardFiles, createBoard } from '../core/actions/board';
import * as TaskActions from '../core/actions/task';
import { attachServe } from './commands/serve';

const program = new Command();

async function promptForBoardCreation(noPrompt: boolean = false): Promise<string | undefined> {
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

async function listBoardFiles(noPrompt: boolean = false): Promise<void> {
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

async function createTaskAction(title: string, options: { file?: string, 'no-prompt'?: boolean }): Promise<void> {
  let boardFile = options.file || findBoardFiles(process.cwd())[0];
  if (!boardFile) {
    console.log('No .knbn board file found in current directory');
    const createdFile = await promptForBoardCreation(options['no-prompt']);
    if (!createdFile) {
      console.error('Cannot continue without a .knbn file');
      process.exit(1);
    }
    boardFile = createdFile;
  }

  try {
    const taskTitle = title || 'New Task';
    const { board, task } = TaskActions.createTask(boardFile, { title: taskTitle });

    if (task) {
      console.log(`Created task #${task.id}: ${task.title}`);
      console.log(`Column: ${task.column}`);
    }
  } catch (error) {
    console.error(`Failed to create task: ${error}`);
    process.exit(1);
  }
}

async function updateTaskAction(taskId: string, options: { file?: string, title?: string, column?: string, description?: string, priority?: string, 'no-prompt'?: boolean }): Promise<void> {
  let boardFile = options.file || findBoardFiles(process.cwd())[0];
  if (!boardFile) {
    console.log('No .knbn board file found in current directory');
    const createdFile = await promptForBoardCreation(options['no-prompt']);
    if (!createdFile) {
      console.error('Cannot continue without a .knbn file');
      process.exit(1);
    }
    boardFile = createdFile;
  }

  const id = parseInt(taskId, 10);
  if (isNaN(id)) {
    console.error('Task ID must be a number');
    process.exit(1);
  }

  try {
    const updates: Partial<any> = {};
    if (options.title) updates.title = options.title;
    if (options.column) updates.column = options.column;
    if (options.description) updates.description = options.description;
    if (options.priority) {
      const priority = parseInt(options.priority, 10);
      if (!isNaN(priority)) {
        updates.priority = priority;
      }
    }

    if (Object.keys(updates).length === 0) {
      console.error('No updates specified. Use --title, --column, --description, or --priority');
      process.exit(1);
    }

    const board = TaskActions.updateTask(boardFile, id, updates);
    const task = board.tasks[id];
    if (!task) {
      console.error(`Task #${id} not found`);
      process.exit(1);
    }

    console.log(`Updated task #${task.id}: ${task.title}`);
    console.log(`Column: ${task.column}`);
  } catch (error) {
    console.error(`Failed to update task: ${error}`);
    process.exit(1);
  }
}

function createBoardAction(name?: string): void {
  try {
    const boardName = name || 'My Board';
    const filePath = `${boardName.toLowerCase().replace(/\s+/g, '-')}.knbn`;
    createBoard(filePath, { name: boardName });
    const fileName = filePath;
    console.log(`Created board file: ${fileName}`);
  } catch (error) {
    console.error(`Failed to create board: ${error}`);
    process.exit(1);
  }
}

export function setupCommander(): Command {
  program
    .name('knbn')
    .description('KnBn - Kanban CLI Tool')
    .version('0.2.3');

  attachServe(program);

  program
    .command('create-board [name]')
    .description('Create a new board file')
    .action((name) => {
      createBoardAction(name);
    });

  program
    .command('create-task <title>')
    .description('Create a new task')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--no-prompt', 'Skip prompts for board creation')
    .action(async (title, options) => {
      await createTaskAction(title, options);
    });

  program
    .command('update-task <id>')
    .description('Update an existing task')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--title <text>', 'Update the task title')
    .option('--column <column>', 'Update the task column')
    .option('--description <text>', 'Update the task description')
    .option('--priority <number>', 'Update the task priority')
    .option('--no-prompt', 'Skip prompts for board creation')
    .action(async (id, options) => {
      await updateTaskAction(id, options);
    });

  program.action(async (options) => {
    await listBoardFiles(options['no-prompt']);
  });

  return program;
}
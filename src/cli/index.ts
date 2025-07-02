#!/usr/bin/env node

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as readline from 'readline';
import { findBoardFiles, createBoard } from '../core/actions/board';
import * as TaskActions from '../core/actions/task';

function startWebServer(port: number): void {
  console.log(`Starting knbn-web server on port ${port}...`);
  
  const args = ['--port', port.toString()];
  const child = spawn('knbn-web', args, {
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error('Failed to start knbn-web server:', error.message);
    console.error('Make sure knbn-web is installed and available in your PATH');
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`knbn-web server exited with code ${code}`);
      process.exit(code || 1);
    }
  });
}

async function promptForBoardCreation(args: string[]): Promise<string | undefined> {
  if (args.includes('--no-prompt')) {
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

async function listBoardFiles(args: string[]): Promise<void> {
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd).filter(file => file.endsWith('.knbn'));
  
  if (files.length === 0) {
    console.log('No .knbn board files found in current directory.');

    await promptForBoardCreation(args);
  } else {
    console.log('Found .knbn board files:');
    files.forEach(file => {
      console.log(`  ${file}`);
    });
  }
  
  console.log('\nUse -h for help and available commands.');
}

function parseArgs(): { port: number; command?: string; args: string[]; boardFile?: string } {
  const args = process.argv.slice(2);
  let port = 9000; // default port
  let command: string | undefined;
  let boardFile: string | undefined;
  const remainingArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' && i + 1 < args.length) {
      const portArg = parseInt(args[i + 1], 10);
      if (isNaN(portArg) || portArg < 1 || portArg > 65535) {
        console.error('Error: Port must be a number between 1 and 65535');
        process.exit(1);
      }
      port = portArg;
      i++; // skip the port value
    } else if ((args[i] === '-f' || args[i] === '--file') && i + 1 < args.length) {
      boardFile = args[i + 1];
      i++; // skip the file value
    } else if (args[i] === '--help' || args[i] === '-h') {
      command = 'help';
    } else if (!command && !args[i].startsWith('-')) {
      command = args[i];
    } else if (!command && args[i].startsWith('-')) {
      remainingArgs.push(args[i]);
    } else if (command) {
      remainingArgs.push(args[i]);
    }
  }

  return { port, command, args: remainingArgs, boardFile };
}

async function createTask(args: string[], providedBoardFile?: string): Promise<void> {
  let boardFile = providedBoardFile || findBoardFiles(process.cwd())[0];
  if (!boardFile) {
    console.log('No .knbn board file found in current directory');
    const createdFile = await promptForBoardCreation(args);
    if (!createdFile) {
      console.error('Cannot continue without a .knbn file');
      process.exit(1);
    }
    boardFile = createdFile;
  }

  try {
    // Parse task arguments
    const title = args.join(' ') || 'New Task';
    
    const { board, task } = TaskActions.createTask(boardFile, { title });

    if (task) {
      console.log(`Created task #${task.id}: ${task.title}`);
      console.log(`Column: ${task.column}`);
    }
  } catch (error) {
    console.error(`Failed to create task: ${error}`);
    process.exit(1);
  }
}

async function updateTask(args: string[], providedBoardFile?: string): Promise<void> {
  let boardFile = providedBoardFile || findBoardFiles(process.cwd())[0];
  if (!boardFile) {
    console.log('No .knbn board file found in current directory');
    const createdFile = await promptForBoardCreation(args);
    if (!createdFile) {
      console.error('Cannot continue without a .knbn file');
      process.exit(1);
    }
    boardFile = createdFile;
  }

  if (args.length < 1) {
    console.error('Usage: knbn update-task <id> [--title "New Title"] [--column "new-column"] [--description "New description"] [--priority <number>]');
    process.exit(1);
  }

  const taskId = parseInt(args[0], 10);
  if (isNaN(taskId)) {
    console.error('Task ID must be a number');
    process.exit(1);
  }

  try {
    // Parse update arguments
    const updates: Partial<any> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--title' && i + 1 < args.length) {
        updates.title = args[i + 1];
        i++;
      } else if (args[i] === '--column' && i + 1 < args.length) {
        updates.column = args[i + 1];
        i++;
      } else if (args[i] === '--description' && i + 1 < args.length) {
        updates.description = args[i + 1];
        i++;
      } else if (args[i] === '--priority' && i + 1 < args.length) {
        const priority = parseInt(args[i + 1], 10);
        if (!isNaN(priority)) {
          updates.priority = priority;
        }
        i++;
      }
    }

    if (Object.keys(updates).length === 0) {
      console.error('No updates specified. Use --title, --column, --description, or --priority');
      process.exit(1);
    }

    const board = TaskActions.updateTask(boardFile, taskId, updates);
    const task = board.tasks[taskId];
    if (!task) {
      console.error(`Task #${taskId} not found`);
      process.exit(1);
    }

    console.log(`Updated task #${task.id}: ${task.title}`);
    console.log(`Column: ${task.column}`);
  } catch (error) {
    console.error(`Failed to update task: ${error}`);
    process.exit(1);
  }
}

function createBoardCommand(args: string[]): void {
  try {
    const name = args.length > 0 ? args[0] : 'My Board';
    const filePath = `${name.toLowerCase().replace(/\s+/g, '-')}.knbn`;
    createBoard(filePath, { name });
    const fileName = filePath;
    console.log(`Created board file: ${fileName}`);
  } catch (error) {
    console.error(`Failed to create board: ${error}`);
    process.exit(1);
  }
}

function displayHelp(): void {
  console.log(`
KnBn - Kanban CLI Tool

Usage: knbn [command] [options]

Commands:
  serve                 Start the web server
  create-board [name]   Create a new board file
  create-task <title>   Create a new task
  update-task <id>      Update an existing task
  help                  Show this help message

Options:
  -p <port>             Set the server port (default: 9000)
  -f, --file <path>     Specify a board file to use

Update Task Options:
  --title <text>        Update the task title
  --column <column>     Update the task column
  --description <text>  Update the task description
  --assignee <person>   Update the task assignee

Examples:
  knbn serve                                 # Start server on port 9000
  knbn serve -p 3000                         # Start server on port 3000
  knbn create-board                          # Create .knbn file in current directory
  knbn create-board my-project               # Create my-project.knbn file
  knbn create-task "Fix bug"                 # Create a new task
  knbn update-task 1 --column "done"         # Mark task #1 as done
  knbn update-task 2 --title "New title"     # Update task #2 title
  knbn -f my-board.knbn create-task "Bug"    # Create task in specific board
      `);
}

async function main() {
  const { port, command, args, boardFile } = parseArgs();
  
  // Default action is to list board files
  if (!command) {
    await listBoardFiles(args);
    return;
  }
  
  // Handle other commands here in the future
  switch (command) {
    case 'serve':
      startWebServer(port);
      break;
    case 'create-board':
      createBoardCommand(args);
      break;
    case 'create-task':
      await createTask(args, boardFile);
      break;
    case 'update-task':
      await updateTask(args, boardFile);
      break;
    case 'help':
      displayHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "knbn help" for usage information');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
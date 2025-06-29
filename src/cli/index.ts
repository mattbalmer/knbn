#!/usr/bin/env node

import { spawn } from 'child_process';
import { findBoardFile, loadBoard, saveBoard, addTaskToBoard, updateTaskInBoard } from '../core/boardUtils';

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
    } else if (command) {
      remainingArgs.push(args[i]);
    }
  }
  
  return { port, command, args: remainingArgs, boardFile };
}

function createTask(args: string[], providedBoardFile?: string): void {
  const boardFile = providedBoardFile || findBoardFile();
  if (!boardFile) {
    console.error('No .knbn board file found in current directory');
    process.exit(1);
  }

  try {
    const board = loadBoard(boardFile);
    
    // Parse task arguments
    const title = args.join(' ') || 'New Task';
    
    const newTask = addTaskToBoard(board, { title });
    saveBoard(boardFile, board);
    
    console.log(`Created task #${newTask.id}: ${newTask.title}`);
    console.log(`Column: ${newTask.column}`);
  } catch (error) {
    console.error(`Failed to create task: ${error}`);
    process.exit(1);
  }
}

function updateTask(args: string[], providedBoardFile?: string): void {
  const boardFile = providedBoardFile || findBoardFile();
  if (!boardFile) {
    console.error('No .knbn board file found in current directory');
    process.exit(1);
  }

  if (args.length < 1) {
    console.error('Usage: knbn update-task <id> [--title "New Title"] [--column "new-column"] [--description "New description"] [--assignee "person"]');
    process.exit(1);
  }

  const taskId = parseInt(args[0], 10);
  if (isNaN(taskId)) {
    console.error('Task ID must be a number');
    process.exit(1);
  }

  try {
    const board = loadBoard(boardFile);
    
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
      } else if (args[i] === '--assignee' && i + 1 < args.length) {
        updates.assignee = args[i + 1];
        i++;
      }
    }

    if (Object.keys(updates).length === 0) {
      console.error('No updates specified. Use --title, --column, --description, or --assignee');
      process.exit(1);
    }

    const updatedTask = updateTaskInBoard(board, taskId, updates);
    if (!updatedTask) {
      console.error(`Task #${taskId} not found`);
      process.exit(1);
    }

    saveBoard(boardFile, board);
    
    console.log(`Updated task #${updatedTask.id}: ${updatedTask.title}`);
    console.log(`Column: ${updatedTask.column}`);
    if (updatedTask.assignee) {
      console.log(`Assignee: ${updatedTask.assignee}`);
    }
  } catch (error) {
    console.error(`Failed to update task: ${error}`);
    process.exit(1);
  }
}

function main() {
  const { port, command, args, boardFile } = parseArgs();
  
  // Default action is to start the web server
  if (!command) {
    startWebServer(port);
    return;
  }
  
  // Handle other commands here in the future
  switch (command) {
    case 'server':
      startWebServer(port);
      break;
    case 'create-task':
      createTask(args, boardFile);
      break;
    case 'update-task':
      updateTask(args, boardFile);
      break;
    case 'help':
      console.log(`
KnBn - Kanban CLI Tool

Usage: knbn [command] [options]

Commands:
  server                Start the web server (default)
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
  knbn                                        # Start server on port 9000
  knbn -p 8080                                # Start server on port 8080
  knbn server -p 3000                         # Start server on port 3000
  knbn create-task "Fix bug"                  # Create a new task
  knbn update-task 1 --column "done"         # Mark task #1 as done
  knbn update-task 2 --title "New title"     # Update task #2 title
  knbn -f my-board.knbn create-task "Bug"    # Create task in specific board
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "knbn help" for usage information');
      process.exit(1);
  }
}

main();
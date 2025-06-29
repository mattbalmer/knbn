#!/usr/bin/env node

import { startServer } from '../server';

function parseArgs(): { port: number; command?: string } {
  const args = process.argv.slice(2);
  let port = 9000; // default port
  let command: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' && i + 1 < args.length) {
      const portArg = parseInt(args[i + 1], 10);
      if (isNaN(portArg) || portArg < 1 || portArg > 65535) {
        console.error('Error: Port must be a number between 1 and 65535');
        process.exit(1);
      }
      port = portArg;
      i++; // skip the port value
    } else if (args[i] === '--help' || args[i] === '-h') {
      command = 'help';
    } else if (!args[i].startsWith('-')) {
      command = args[i];
    }
  }
  
  return { port, command };
}

function main() {
  const { port, command } = parseArgs();
  
  // Default action is to start the web server
  if (!command) {
    startServer(port);
    return;
  }
  
  // Handle other commands here in the future
  switch (command) {
    case 'server':
      startServer(port);
      break;
    case 'help':
      console.log(`
KnBn - Kanban CLI Tool

Usage: knbn [command] [options]

Commands:
  server    Start the web server (default)
  help      Show this help message

Options:
  -p <port> Set the server port (default: 9000)

Examples:
  knbn              # Start server on port 9000
  knbn -p 8080      # Start server on port 8080
  knbn server -p 3000  # Start server on port 3000
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "knbn help" for usage information');
      process.exit(1);
  }
}

main();
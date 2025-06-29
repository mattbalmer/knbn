#!/usr/bin/env node

import express from 'express';
import path from 'path';

function parseArgs(): { port: number } {
  const args = process.argv.slice(2);
  let port = 9000; // default port
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' && i + 1 < args.length) {
      const portArg = parseInt(args[i + 1], 10);
      if (isNaN(portArg) || portArg < 1 || portArg > 65535) {
        console.error('Error: Port must be a number between 1 and 65535');
        process.exit(1);
      }
      port = portArg;
      break;
    }
  }
  
  return { port };
}

const { port: PORT } = parseArgs();
const app = express();

const currentWorkingDirectory = process.cwd();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>KnBn</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .cwd { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>KnBn</h1>
        <div class="cwd">
            <h2>Current Working Directory:</h2>
            <p><code>${currentWorkingDirectory}</code></p>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`KnBn server running at http://localhost:${PORT}`);
  console.log(`Working directory: ${currentWorkingDirectory}`);
});
#!/usr/bin/env node

import express from 'express';
import path from 'path';

const app = express();
const PORT = 9000;

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
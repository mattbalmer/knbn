import express from 'express';

export function startServer(port: number = 9000): void {
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

  app.listen(port, () => {
    console.log(`KnBn server running at http://localhost:${port}`);
    console.log(`Working directory: ${currentWorkingDirectory}`);
  });
}
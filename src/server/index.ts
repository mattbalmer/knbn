import express from 'express';

export function startServer(port: number = 9000): void {
  const app = express();

  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>KnBn</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333; }
          </style>
      </head>
      <body>
          <h1>KnBn</h1>
      </body>
      </html>
    `);
  });

  app.listen(port, () => {
    console.log(`KnBn server running at http://localhost:${port}`);
  });
}
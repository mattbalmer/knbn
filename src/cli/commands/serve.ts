import { spawn } from 'child_process';
import { Command } from 'commander';

export const attachServe = (program: Command) =>
  program
    .command('serve')
    .description('Start the web server')
    .option('-p, --port <port>', 'Set the server port', '9000')
    .action((options) => {
      const port = parseInt(options.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error('Error: Port must be a number between 1 and 65535');
        process.exit(1);
      }

      console.log(`Starting knbn-web server on port ${port}...`);

      const args = ['--port', port.toString()];
      const child = spawn('knbn-web', args, {
        stdio: 'inherit',
        shell: true
      });

      child.on('error', (error) => {
        console.error('Failed to start knbn-web server:', error?.message);
        console.error('Make sure knbn-web is installed and available in your PATH');
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code !== 0) {
          console.error(`knbn-web server exited with code ${code}`);
          process.exit(code || 1);
        }
      });
    });
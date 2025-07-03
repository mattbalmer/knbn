import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { loadBoard } from '../../src/core/utils/board-files';
import { Filepath } from '../../src/core/types/ts';
// @ts-ignore
import { createTempDir, rmTempDir } from '../test-utils';

describe('CLI Integration Tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let cliPath: string;

  beforeAll(() => {
    // Build the project first
    try {
      execSync('yarn build', { cwd: path.join(__dirname, '../..'), stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build project for tests');
      throw error;
    }
    cliPath = path.join(__dirname, '../../dist/cli/index.js');
  });

  beforeEach(() => {
    tempDir = createTempDir('knbn-cli');
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmTempDir('knbn-cli');
  });

  const runCLI = (args: string[]): { stdout: string; stderr: string; exitCode: number } => {
    try {
      // Properly escape arguments for shell execution
      const escapedArgs = args.map(arg => {
        if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
      });

      const command = `node "${cliPath}" ${escapedArgs.join(' ')}`;
      console.log(`Running command: `, command);
      const stdout = execSync(command, {
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 10000
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        exitCode: error.status || 1
      };
    }
  };

  describe('help and version commands', () => {
    it('should display help information', () => {
      const result = runCLI(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KnBn - Kanban CLI Tool');
      expect(result.stdout).toContain('Usage: knbn [options] [command]');
      expect(result.stdout).toContain('create-task');
      expect(result.stdout).toContain('update-task');
      expect(result.stdout).toContain('create-board');
      expect(result.stdout).toContain('list');
    });

    it('should display version information', () => {
      const result = runCLI(['--version']);
      const expectedVersion = require('../../package.json').version;
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(expectedVersion); // Should contain version number
    });
  });

  describe('create-board command', () => {
    it('should create a board file when no name is provided', () => {
      const result = runCLI(['create-board']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created board file:');
      expect(result.stdout).toContain('.knbn');
      
      // Verify file was created
      const boardPath = path.join(tempDir, '.knbn') as Filepath;
      expect(fs.existsSync(boardPath)).toBe(true);
      
      // Verify board structure
      const board = loadBoard(boardPath);
      expect(board.name).toBe('My Board');
      expect(board.description).toBe('My local kanban board');
      expect(board.columns).toHaveLength(4);
      expect(board.columns[0].name).toBe('backlog');
      expect(board.columns[1].name).toBe('todo');
      expect(board.columns[2].name).toBe('working');
      expect(board.columns[3].name).toBe('done');
      expect(board.metadata.nextId).toBe(1);
      expect(Object.keys(board.tasks)).toHaveLength(0);
    });

    it('should create a named board file when name is provided', () => {
      const result = runCLI(['create-board', 'test-project']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-project.knbn');
      
      // Verify file was created
      const boardPath = path.join(tempDir, 'test-project.knbn') as Filepath;
      expect(fs.existsSync(boardPath)).toBe(true);
      
      // Verify board structure
      const board = loadBoard(boardPath);
      expect(board.name).toBe('test-project');
      expect(board.description).toBe('My local kanban board');
      expect(board.metadata.nextId).toBe(1);
    });

    it('should create board with multi-word name', () => {
      const result = runCLI(['create-board', 'My Awesome Project']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('my-awesome-project.knbn');
      
      // Verify file was created
      const boardPath = path.join(tempDir, 'my-awesome-project.knbn') as Filepath;
      expect(fs.existsSync(boardPath)).toBe(true);
      
      // Verify board name
      const board = loadBoard(boardPath);
      expect(board.name).toBe('My Awesome Project');
    });

    it('should fail when board file already exists', () => {
      // Create existing board file with same name
      fs.writeFileSync(path.join(tempDir, '.knbn'), 'existing content');
      
      const result = runCLI(['create-board']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create board');
    });

    it('should fail when named board file already exists', () => {
      // Create existing named file
      fs.writeFileSync(path.join(tempDir, 'existing.knbn'), 'existing content');
      
      const result = runCLI(['create-board', 'existing']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create board');
    });
  });

  describe('create-task command', () => {
    beforeEach(() => {
      // Create a test board for task operations
      runCLI(['create-board', 'test-board']);
    });

    it('should create a task with specified title', () => {
      const result = runCLI(['create-task', 'My Test Task', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: My Test Task');
      expect(result.stdout).toContain('Column: backlog');
      
      // Verify task was actually created in the board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1]).toBeDefined();
      expect(board.tasks[1].title).toBe('My Test Task');
      expect(board.tasks[1].column).toBe('backlog');
      expect(board.metadata.nextId).toBe(2);
    });

    it('should create a task with multi-word title', () => {
      const result = runCLI(['create-task', 'This is a long task title', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: This is a long task title');
      
      // Verify in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('This is a long task title');
    });

    it('should create a task with default title when title is provided', () => {
      const result = runCLI(['create-task', 'New Task', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: New Task');
      
      // Verify in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('New Task');
    });

    it('should auto-detect board file when no -f flag is provided', () => {
      // Rename to discoverable name
      fs.renameSync(path.join(tempDir, 'test-board.knbn'), path.join(tempDir, '.knbn'));
      
      const result = runCLI(['create-task', 'Auto-detected task']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Auto-detected task');
      
      // Verify task was created in the auto-detected file
      const board = loadBoard(path.join(tempDir, '.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('Auto-detected task');
    });

    it('should detect when no board file is found', () => {
      // Remove board files
      if (fs.existsSync(path.join(tempDir, 'test-board.knbn'))) {
        fs.unlinkSync(path.join(tempDir, 'test-board.knbn'));
      }
      
      const result = runCLI(['create-task', 'Task without board']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No .knbn board file found in current directory');
      expect(result.stdout).toContain('Would you like to create a new board?');
    });

    it('should skip prompts when no board file is found and --skip-prompt is provided', () => {
      // Remove board files
      fs.unlinkSync(path.join(tempDir, 'test-board.knbn'));

      const result = runCLI(['create-task', 'Task without board', '--skip-prompt']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Cannot continue without a .knbn file');
    });

    it('should fail with non-existent specific board file', () => {
      const result = runCLI(['create-task', 'Task', '-f', 'nonexistent.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toEqual('');
      expect(result.stderr).toContain('Failed to create task');
    });
  });

  describe('update-task command', () => {
    beforeEach(() => {
      // Create a test board and task
      runCLI(['create-board', 'test-board']);
      runCLI(['create-task', 'Task to update', '-f', 'test-board.knbn']);
    });

    it('should update task title', () => {
      const result = runCLI(['update-task', '1', '--title', 'Updated title', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated task #1: Updated title');
      expect(result.stdout).toContain('Column: backlog');
      
      // Verify update in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('Updated title');
      expect(new Date(board.tasks[1].dates.updated).getTime()).toBeGreaterThan(
        new Date(board.tasks[1].dates.created).getTime()
      );
    });

    it('should update task column', () => {
      const result = runCLI(['update-task', '1', '--column', 'working', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated task #1');
      expect(result.stdout).toContain('Column: working');
      
      // Verify update in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].column).toBe('working');
      expect(board.tasks[1].dates.moved).toBeDefined();
    });

    it('should update task description', () => {
      const result = runCLI(['update-task', '1', '--description', 'New description', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated task #1');
      
      // Verify update in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].description).toBe('New description');
    });

    it('should update task priority', () => {
      const result = runCLI(['update-task', '1', '--priority', '5', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated task #1');
      
      // Verify update in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].priority).toBe(5);
    });

    it('should update multiple fields at once', () => {
      const result = runCLI([
        'update-task', '1',
        '--title', 'Multi-update task',
        '--column', 'done',
        '--description', 'Updated description',
        '--priority', '3',
        '-f', 'test-board.knbn'
      ]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated task #1: Multi-update task');
      expect(result.stdout).toContain('Column: done');
      
      // Verify all updates in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      const task = board.tasks[1];
      expect(task.title).toBe('Multi-update task');
      expect(task.column).toBe('done');
      expect(task.description).toBe('Updated description');
      expect(task.priority).toBe(3);
      expect(task.dates.moved).toBeDefined(); // Should be set when column changes
    });

    it('should fail with non-existent task ID', () => {
      const result = runCLI(['update-task', '999', '--title', 'Non-existent', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task with ID 999 not found');
    });

    it('should fail with invalid task ID', () => {
      const result = runCLI(['update-task', 'invalid', '--title', 'Test', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task ID must be a number');
    });

    it('should fail with no updates specified', () => {
      const result = runCLI(['update-task', '1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No updates specified');
    });

    it('should fail with missing task ID', () => {
      const result = runCLI(['update-task', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error: missing required argument \'id\'');
    });
  });

  describe('list command', () => {
    it('should list board files when they exist', () => {
      // Create multiple board files
      runCLI(['create-board', 'project1']);
      runCLI(['create-board', 'project2']);
      
      const result = runCLI(['list', '--skip-prompt']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 2 .knbn board files:');
      expect(result.stdout).toContain('project1: project1');
      expect(result.stdout).toContain('project2: project2');
      expect(result.stdout).toContain('Use -h for help and available commands.');
    });

    it('should handle no board files found', () => {
      const result = runCLI(['list']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No .knbn board files found in current directory.');
      expect(result.stdout).toContain('Would you like to create a new board?');
    });

    it('should skip prompts when no board files are found and --skip-prompt is provided', () => {
      const result = runCLI(['list', '--skip-prompt']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No .knbn board files found in current directory');
    });

    it('should work as default command when no command is specified', () => {
      // Create a board file
      runCLI(['create-board', 'default-test']);
      
      const result = runCLI([]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 1 .knbn board files:');
      expect(result.stdout).toContain('default-test: default-test');
      expect(result.stdout).toContain('Use -h for help and available commands.');
    });
  });

  describe('error handling', () => {
    it('should handle corrupted board file gracefully', () => {
      fs.writeFileSync(path.join(tempDir, 'corrupted.knbn'), 'invalid: yaml: [content');
      
      const result = runCLI(['create-task', 'Test', '-f', 'corrupted.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create task');
    });

    it('should handle permission errors gracefully', () => {
      // Create a board file first
      runCLI(['create-board', 'readonly']);
      const readOnlyPath = path.join(tempDir, 'readonly.knbn');
      
      try {
        fs.chmodSync(readOnlyPath, 0o444); // Read-only
        
        const result = runCLI(['create-task', 'Test', '-f', 'readonly.knbn']);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Failed to create task');
      } catch (error) {
        // Skip test if chmod is not supported (e.g., on some Windows systems)
        console.log('Skipping permission test due to chmod failure');
      }
    });
  });

  describe('board file persistence', () => {
    beforeEach(() => {
      runCLI(['create-board', 'persistence-test']);
    });

    it('should persist task creation across multiple commands', () => {
      // Create multiple tasks
      runCLI(['create-task', 'First task', '-f', 'persistence-test.knbn']);
      runCLI(['create-task', 'Second task', '-f', 'persistence-test.knbn']);
      runCLI(['create-task', 'Third task', '-f', 'persistence-test.knbn']);
      
      // Verify all tasks were persisted
      const board = loadBoard(path.join(tempDir, 'persistence-test.knbn') as Filepath);
      expect(Object.keys(board.tasks)).toHaveLength(3);
      expect(board.tasks[1].title).toBe('First task');
      expect(board.tasks[2].title).toBe('Second task');
      expect(board.tasks[3].title).toBe('Third task');
      expect(board.metadata.nextId).toBe(4);
    });

    it('should persist task updates correctly', () => {
      // Create and then update a task
      runCLI(['create-task', 'Task for updating', '-f', 'persistence-test.knbn']);
      runCLI(['update-task', '1', '--title', 'Updated task', '--column', 'working', '-f', 'persistence-test.knbn']);
      
      // Verify persistence
      const board = loadBoard(path.join(tempDir, 'persistence-test.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('Updated task');
      expect(board.tasks[1].column).toBe('working');
      expect(board.tasks[1].dates.moved).toBeDefined();
      expect(new Date(board.tasks[1].dates.updated).getTime()).toBeGreaterThan(
        new Date(board.tasks[1].dates.created).getTime()
      );
    });

    it('should maintain board metadata correctly', () => {
      const initialBoard = loadBoard(path.join(tempDir, 'persistence-test.knbn') as Filepath);
      const initialModified = initialBoard.dates.updated;
      
      // Create a task
      runCLI(['create-task', 'Metadata test', '-f', 'persistence-test.knbn']);
      
      // Verify metadata was updated
      const updatedBoard = loadBoard(path.join(tempDir, 'persistence-test.knbn') as Filepath);
      expect(updatedBoard.metadata.nextId).toBe(initialBoard.metadata.nextId + 1);
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(initialModified).getTime()
      );
      expect(new Date(updatedBoard.dates.saved).getTime()).toBeGreaterThan(
        new Date(initialModified).getTime()
      );
    });
  });
});
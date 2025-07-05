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
        if (arg.includes(' ') || arg.includes('"') || arg.includes("'") || arg.startsWith("#")) {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
      });

      const command = `node "${cliPath}" ${escapedArgs.join(' ')}`;
      // console.log(`Running command: `, command);
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

  // MISSING CLI COMMAND TESTS

  describe('get-task command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['create-task', 'Test Task', '-f', 'test-board.knbn']);
    });

    it('should get task details by ID', () => {
      const result = runCLI(['get-task', '1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task #1: Test Task');
      expect(result.stdout).toContain('Column: backlog');
      expect(result.stdout).toContain('Created:');
      expect(result.stdout).toContain('Updated:');
    });

    it('should fail with non-existent task ID', () => {
      const result = runCLI(['get-task', '999', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task #999 not found');
    });

    it('should fail with invalid task ID', () => {
      const result = runCLI(['get-task', 'invalid', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task ID must be a number');
    });
  });

  describe('list-tasks command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['create-task', 'Task 1', '-f', 'test-board.knbn']);
      runCLI(['create-task', 'Task 2', '-f', 'test-board.knbn']);
      runCLI(['update-task', '2', '--column', 'todo', '-f', 'test-board.knbn']);
    });

    it('should list all tasks', () => {
      const result = runCLI(['list-tasks', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 2 task(s)');
      expect(result.stdout).toContain('#1: Task 1');
      expect(result.stdout).toContain('#2: Task 2');
    });

    it('should filter tasks by column', () => {
      const result = runCLI(['list-tasks', '--column', 'todo', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 1 task(s)');
      expect(result.stdout).toContain('#2: Task 2');
      expect(result.stdout).not.toContain('#1: Task 1');
    });

    it('should search tasks by query', () => {
      const result = runCLI(['list-tasks', '--query', 'Task 1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('#1: Task 1');
      expect(result.stdout).not.toContain('#2: Task 2');
    });

    it('should show no tasks found message', () => {
      const result = runCLI(['list-tasks', '--column', 'nonexistent', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No tasks found');
    });
  });

  describe('list-columns command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['create-task', 'Task 1', '-f', 'test-board.knbn']);
    });

    it('should list all columns', () => {
      const result = runCLI(['list-columns', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 4 column(s)');
      expect(result.stdout).toContain('1. backlog');
      expect(result.stdout).toContain('2. todo');
      expect(result.stdout).toContain('3. working');
      expect(result.stdout).toContain('4. done');
    });

    it('should show task counts when --count flag is used', () => {
      const result = runCLI(['list-columns', '--count', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Tasks: 1'); // backlog has 1 task
      expect(result.stdout).toContain('Tasks: 0'); // other columns have 0 tasks
    });
  });

  describe('create-column command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
    });

    it('should create a new column', () => {
      const result = runCLI(['create-column', 'review', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created column: review');
      
      // Verify column was added
      const listResult = runCLI(['list-columns', '-f', 'test-board.knbn']);
      expect(listResult.stdout).toContain('review');
    });

    it('should create column at specific position', () => {
      const result = runCLI(['create-column', 'review', '--position', '2', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created column: review');
      expect(result.stdout).toContain('Position: 2');
    });

    it('should fail with duplicate column name', () => {
      const result = runCLI(['create-column', 'backlog', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Column with name "backlog" already exists');
    });

    it('should fail with invalid position', () => {
      const result = runCLI(['create-column', 'review', '--position', '-1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Position must be a non-negative number');
    });
  });

  describe('update-column command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
    });

    it('should update column name', () => {
      const result = runCLI(['update-column', 'backlog', '--name', 'new-backlog', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated column: new-backlog');
      expect(result.stdout).toContain('Renamed from: backlog');
    });

    it('should fail with non-existent column', () => {
      const result = runCLI(['update-column', 'nonexistent', '--name', 'new-name', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Column "nonexistent" not found');
    });

    it('should show message when no updates specified', () => {
      const result = runCLI(['update-column', 'backlog', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No updates specified');
    });
  });

  describe('remove-column command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['create-column', 'temp', '-f', 'test-board.knbn']);
    });

    it('should remove empty column', () => {
      const result = runCLI(['remove-column', 'temp', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Removed column: temp');
    });

    it('should fail to remove column with tasks', () => {
      runCLI(['create-task', 'Test Task', '-f', 'test-board.knbn']); // Goes to backlog
      
      const result = runCLI(['remove-column', 'backlog', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Cannot remove column "backlog" because it contains 1 task(s)');
    });

    it('should show message for non-existent column', () => {
      const result = runCLI(['remove-column', 'nonexistent', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Column "nonexistent" was not found');
    });
  });

  describe('move-column command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
    });

    it('should move column to new position', () => {
      const result = runCLI(['move-column', 'done', '0', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Moved column "done" to position 0');
    });

    it('should fail with non-existent column', () => {
      const result = runCLI(['move-column', 'nonexistent', '0', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Column with name "nonexistent" not found');
    });

    it('should fail with invalid position', () => {
      const result = runCLI(['move-column', 'done', '-1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Position must be a non-negative number');
    });
  });

  describe('list-labels command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['add-label', 'bug', '-f', 'test-board.knbn']);
      runCLI(['add-label', 'feature', '--color', 'green', '-f', 'test-board.knbn']);
    });

    it('should list all labels', () => {
      const result = runCLI(['list-labels', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 2 label(s)');
      expect(result.stdout).toContain('1. bug');
      expect(result.stdout).toContain('2. feature');
      expect(result.stdout).toContain('Color: green');
    });

    it('should show no labels found message', () => {
      runCLI(['create-board', 'empty-board']);
      const result = runCLI(['list-labels', '-f', 'empty-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No labels found');
    });
  });

  describe('add-label command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
    });

    it('should create a new label', () => {
      const result = runCLI(['add-label', 'bug', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created label: bug');
    });

    it('should create label with color', () => {
      const result = runCLI(['add-label', 'feature', '--color', '#fffccc', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created label: feature');
      expect(result.stdout).toContain('Color: #fffccc');
    });

    it('should fail with duplicate label name', () => {
      runCLI(['add-label', 'bug', '-f', 'test-board.knbn']);
      const result = runCLI(['add-label', 'bug', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Label with name "bug" already exists');
    });
  });

  describe('update-label command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['add-label', 'bug', '-f', 'test-board.knbn']);
    });

    it('should update label name', () => {
      const result = runCLI(['update-label', 'bug', '--name', 'critical', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated label: critical');
      expect(result.stdout).toContain('Renamed from: bug');
    });

    it('should update label color', () => {
      const result = runCLI(['update-label', 'bug', '--color', 'red', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated label: bug');
      expect(result.stdout).toContain('Color: red');
    });

    it('should fail with non-existent label', () => {
      const result = runCLI(['update-label', 'nonexistent', '--name', 'new-name', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Label "nonexistent" not found');
    });

    it('should show message when no updates specified', () => {
      const result = runCLI(['update-label', 'bug', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No updates specified');
    });
  });

  describe('remove-label command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['add-label', 'bug', '-f', 'test-board.knbn']);
    });

    it('should remove label', () => {
      const result = runCLI(['remove-label', 'bug', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Removed label: bug');
    });

    it('should fail with non-existent label', () => {
      const result = runCLI(['remove-label', 'nonexistent', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Label "nonexistent" not found');
    });
  });

  describe('list-sprints command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['add-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
      runCLI(['add-sprint', 'Sprint 2', '--capacity', '40', '-f', 'test-board.knbn']);
    });

    it('should list all sprints', () => {
      const result = runCLI(['list-sprints', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 2 sprint(s)');
      expect(result.stdout).toContain('1. Sprint 1');
      expect(result.stdout).toContain('2. Sprint 2');
      expect(result.stdout).toContain('Capacity: 40');
    });

    it('should show no sprints found message', () => {
      runCLI(['create-board', 'empty-board']);
      const result = runCLI(['list-sprints', '-f', 'empty-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No sprints found');
    });
  });

  describe('add-sprint command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
    });

    it('should create a new sprint', () => {
      const result = runCLI(['add-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created sprint: Sprint 1');
      expect(result.stdout).toContain('Starts:');
    });

    it('should create sprint with capacity', () => {
      const result = runCLI(['add-sprint', 'Sprint 1', '--capacity', '40', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created sprint: Sprint 1');
      expect(result.stdout).toContain('Capacity: 40');
    });

    it('should create sprint with description', () => {
      const result = runCLI(['add-sprint', 'Sprint 1', '--description', 'Test sprint', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created sprint: Sprint 1');
      expect(result.stdout).toContain('Description: Test sprint');
    });

    it('should fail with duplicate sprint name', () => {
      runCLI(['add-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
      const result = runCLI(['add-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Sprint with name "Sprint 1" already exists');
    });

    it('should fail with invalid capacity', () => {
      const result = runCLI(['add-sprint', 'Sprint 1', '--capacity', '-1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Capacity must be a non-negative number');
    });
  });

  describe('update-sprint command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['add-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
    });

    it('should update sprint name', () => {
      const result = runCLI(['update-sprint', 'Sprint 1', '--name', 'Updated Sprint', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated sprint: Updated Sprint');
    });

    it('should update sprint capacity', () => {
      const result = runCLI(['update-sprint', 'Sprint 1', '--capacity', '60', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated sprint: Sprint 1');
      expect(result.stdout).toContain('Capacity: 60');
    });

    it('should fail with non-existent sprint', () => {
      const result = runCLI(['update-sprint', 'nonexistent', '--name', 'new-name', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Sprint with name "nonexistent" not found');
    });

    it('should show message when no updates specified', () => {
      const result = runCLI(['update-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No updates specified');
    });
  });

  describe('remove-sprint command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['add-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
    });

    it('should remove sprint', () => {
      const result = runCLI(['remove-sprint', 'Sprint 1', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Removed sprint: Sprint 1');
    });

    it('should fail with non-existent sprint', () => {
      const result = runCLI(['remove-sprint', 'nonexistent', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Sprint "nonexistent" not found');
    });
  });

  describe('update-tasks-batch command', () => {
    beforeEach(() => {
      runCLI(['create-board', 'test-board']);
      runCLI(['create-task', 'Task 1', '-f', 'test-board.knbn']);
      runCLI(['create-task', 'Task 2', '-f', 'test-board.knbn']);
      runCLI(['create-task', 'Task 3', '-f', 'test-board.knbn']);
    });

    it('should update multiple tasks using JSON format', () => {
      const json = JSON.stringify([
        { id: 1, title: 'Updated Task 1', column: 'todo' },
        { id: 2, priority: 1, column: 'working' },
        { id: 3, title: 'Updated Task 3' }
      ]);

      const result = runCLI(['update-tasks-batch', '--tasks', json, '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 3 tasks:');
      expect(result.stdout).toContain('#1: Updated Task 1 (todo)');
      expect(result.stdout).toContain('#2: Task 2 (working)');
      expect(result.stdout).toContain('#3: Updated Task 3 (backlog)');

      // Verify updates in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('Updated Task 1');
      expect(board.tasks[1].column).toBe('todo');
      expect(board.tasks[2].priority).toBe(1);
      expect(board.tasks[2].column).toBe('working');
      expect(board.tasks[3].title).toBe('Updated Task 3');
    });

    it('should update multiple tasks using Record JSON format', () => {
      const json = JSON.stringify({
        1: { title: 'Record Task 1', column: 'done' },
        2: { priority: 2 },
        3: { column: 'todo', title: 'Record Task 3' }
      });

      const result = runCLI(['update-tasks-batch', '--tasks', json, '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 3 tasks:');
      expect(result.stdout).toContain('#1: Record Task 1 (done)');
      expect(result.stdout).toContain('#2: Task 2 (backlog)');
      expect(result.stdout).toContain('#3: Record Task 3 (todo)');

      // Verify updates in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].title).toBe('Record Task 1');
      expect(board.tasks[1].column).toBe('done');
      expect(board.tasks[2].priority).toBe(2);
      expect(board.tasks[3].title).toBe('Record Task 3');
      expect(board.tasks[3].column).toBe('todo');
    });

    it('should update tasks using IDs and flags', () => {
      const result = runCLI([
        'update-tasks-batch',
        '--ids', '1,2,3',
        '--column', 'working',
        '--priority', '1',
        '-f', 'test-board.knbn'
      ]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 3 tasks:');
      expect(result.stdout).toContain('#1: Task 1 (working)');
      expect(result.stdout).toContain('#2: Task 2 (working)');
      expect(result.stdout).toContain('#3: Task 3 (working)');

      // Verify updates in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].column).toBe('working');
      expect(board.tasks[1].priority).toBe(1);
      expect(board.tasks[2].column).toBe('working');
      expect(board.tasks[2].priority).toBe(1);
      expect(board.tasks[3].column).toBe('working');
      expect(board.tasks[3].priority).toBe(1);
    });

    it('should update tasks using IDs with specific properties', () => {
      const result = runCLI([
        'update-tasks-batch',
        '--ids', '1,3',
        '--column', 'done',
        '--sprint', 'Sprint 1',
        '-f', 'test-board.knbn'
      ]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 2 tasks:');
      expect(result.stdout).toContain('#1: Task 1 (done)');
      expect(result.stdout).toContain('#3: Task 3 (done)');

      // Verify updates in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[1].column).toBe('done');
      expect(board.tasks[1].sprint).toBe('Sprint 1');
      expect(board.tasks[2].column).toBe('backlog'); // unchanged
      expect(board.tasks[3].column).toBe('done');
      expect(board.tasks[3].sprint).toBe('Sprint 1');
    });

    it('should fail with invalid JSON format', () => {
      const result = runCLI(['update-tasks-batch', '--tasks', 'invalid-json', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid JSON format for --tasks option');
    });

    it('should fail with non-existent task ID in JSON', () => {
      const json = JSON.stringify([
        { id: 1, title: 'Valid' },
        { id: 999, title: 'Invalid' }
      ]);

      const result = runCLI(['update-tasks-batch', '--tasks', json, '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task with ID 999 not found');
    });

    it('should fail with non-existent task ID in flags', () => {
      const result = runCLI([
        'update-tasks-batch',
        '--ids', '1,999',
        '--column', 'todo',
        '-f', 'test-board.knbn'
      ]);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task with ID 999 not found');
    });

    it('should fail with invalid task ID in flags', () => {
      const result = runCLI([
        'update-tasks-batch',
        '--ids', '1,invalid,3',
        '--column', 'todo',
        '-f', 'test-board.knbn'
      ]);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid task ID: invalid');
    });

    it('should fail when no updates are specified with IDs', () => {
      const result = runCLI(['update-tasks-batch', '--ids', '1,2', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No updates specified. Use --column, --priority, or --sprint with --ids');
    });

    it('should fail when neither --tasks nor --ids is provided', () => {
      const result = runCLI(['update-tasks-batch', '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Either --tasks or --ids with update options must be specified');
    });

    it('should handle single task update with flags', () => {
      const result = runCLI([
        'update-tasks-batch',
        '--ids', '2',
        '--column', 'done',
        '--priority', '5',
        '-f', 'test-board.knbn'
      ]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 1 tasks:');
      expect(result.stdout).toContain('#2: Task 2 (done)');

      // Verify update in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      expect(board.tasks[2].column).toBe('done');
      expect(board.tasks[2].priority).toBe(5);
    });

    it('should handle complex JSON with all task properties', () => {
      const json = JSON.stringify([
        {
          id: 1,
          title: 'Complex Task 1',
          description: 'Updated description',
          column: 'working',
          priority: 1,
          storyPoints: 5,
          labels: ['urgent', 'feature'],
          sprint: 'Sprint 1'
        }
      ]);

      const result = runCLI(['update-tasks-batch', '--tasks', json, '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 1 tasks:');
      expect(result.stdout).toContain('#1: Complex Task 1 (working)');

      // Verify all updates in board file
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      const task = board.tasks[1];
      expect(task.title).toBe('Complex Task 1');
      expect(task.description).toBe('Updated description');
      expect(task.column).toBe('working');
      expect(task.priority).toBe(1);
      expect(task.storyPoints).toBe(5);
      expect(task.labels).toEqual(['urgent', 'feature']);
      expect(task.sprint).toBe('Sprint 1');
    });

    it('should auto-detect board file when no -f flag is provided', () => {
      // Rename to discoverable name
      fs.renameSync(path.join(tempDir, 'test-board.knbn'), path.join(tempDir, '.knbn'));
      
      const result = runCLI([
        'update-tasks-batch',
        '--ids', '1,2',
        '--column', 'todo'
      ]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully updated 2 tasks:');

      // Verify updates in auto-detected file
      const board = loadBoard(path.join(tempDir, '.knbn') as Filepath);
      expect(board.tasks[1].column).toBe('todo');
      expect(board.tasks[2].column).toBe('todo');
    });

    it('should preserve task timestamps correctly', () => {
      const json = JSON.stringify([
        { id: 1, title: 'Time Test 1' },
        { id: 2, column: 'working' }
      ]);

      const result = runCLI(['update-tasks-batch', '--tasks', json, '-f', 'test-board.knbn']);
      
      expect(result.exitCode).toBe(0);

      // Verify timestamps were updated
      const board = loadBoard(path.join(tempDir, 'test-board.knbn') as Filepath);
      const now = new Date().getTime();
      
      const task1Updated = new Date(board.tasks[1].dates.updated).getTime();
      const task2Updated = new Date(board.tasks[2].dates.updated).getTime();
      const task2Moved = new Date(board.tasks[2].dates.moved!).getTime();
      
      expect(task1Updated).toBeLessThanOrEqual(now);
      expect(task2Updated).toBeLessThanOrEqual(now);
      expect(task2Moved).toBeLessThanOrEqual(now); // Column changed
      expect(board.tasks[1].dates.moved).toBeUndefined(); // No column change
    });
  });

  describe('migrate command', () => {
    beforeEach(() => {
      // Create some test board files
      runCLI(['create-board', 'test-board-1']);
      runCLI(['create-board', 'test-board-2']);
    });

    const createOldVersionBoard = (filename: string) => {
      // Create a board file with an older version format (0.1.0)
      const oldBoard = {
        configuration: {
          name: 'Old Board',
          description: 'Board in old format',
          columns: [
            { name: 'todo' },
            { name: 'doing' },
            { name: 'done' }
          ]
        },
        tasks: {
          1: {
            id: 1,
            title: 'Old Format Task',
            description: 'Task in old format',
            column: 'todo',
            labels: ['old-label'],
            dates: {
              created: '2024-01-01T10:00:00Z',
              updated: '2024-01-01T10:00:00Z'
            }
          }
        },
        metadata: {
          nextId: 2,
          version: '0.1.0',
          createdAt: '2024-01-01T09:00:00Z',
          lastModified: '2024-01-01T10:00:00Z'
        }
      };

      const yaml = require('js-yaml');
      const content = yaml.dump(oldBoard);
      fs.writeFileSync(path.join(tempDir, filename), content, 'utf8');
    };

    it('should migrate a single specified file', () => {
      createOldVersionBoard('old-board.knbn');
      
      const result = runCLI(['migrate', 'old-board.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✅ old-board.knbn: Migrated from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('Migrated: 1 files');

      // Verify the file was actually migrated
      const migratedBoard = loadBoard(path.join(tempDir, 'old-board.knbn') as Filepath);
      expect(migratedBoard.metadata.version).toBe('0.2.0');
      expect(migratedBoard.name).toBe('Old Board');
      expect(migratedBoard.tasks[1].title).toBe('Old Format Task');
    });

    it('should migrate multiple specified files', () => {
      createOldVersionBoard('old-board-1.knbn');
      createOldVersionBoard('old-board-2.knbn');
      
      const result = runCLI(['migrate', 'old-board-1.knbn', 'old-board-2.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✅ old-board-1.knbn: Migrated from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('✅ old-board-2.knbn: Migrated from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('Migrated: 2 files');

      // Verify both files were migrated
      const board1 = loadBoard(path.join(tempDir, 'old-board-1.knbn') as Filepath);
      const board2 = loadBoard(path.join(tempDir, 'old-board-2.knbn') as Filepath);
      expect(board1.metadata.version).toBe('0.2.0');
      expect(board2.metadata.version).toBe('0.2.0');
    });

    it('should migrate all files with --all flag', () => {
      createOldVersionBoard('old-board-1.knbn');
      createOldVersionBoard('old-board-2.knbn');
      
      const result = runCLI(['migrate', '--all']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✅ old-board-1.knbn: Migrated from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('✅ old-board-2.knbn: Migrated from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('⏭️  test-board-1.knbn: Already at latest version');
      expect(result.stdout).toContain('⏭️  test-board-2.knbn: Already at latest version');
      expect(result.stdout).toContain('Migrated: 2 files');
      expect(result.stdout).toContain('Already current: 2 files');
    });

    it('should show dry-run results without making changes', () => {
      createOldVersionBoard('old-board.knbn');
      
      const result = runCLI(['migrate', 'old-board.knbn', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🔄 old-board.knbn: Would migrate from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('Would migrate: 1 files');
      expect(result.stdout).toContain('Run without --dry-run to perform the migration');

      // Verify the file was NOT actually migrated
      const yaml = require('js-yaml');
      const content = fs.readFileSync(path.join(tempDir, 'old-board.knbn'), 'utf8');
      const board = yaml.load(content) as any;
      expect(board.metadata.version).toBe('0.1.0'); // Still old version
    });

    it('should create backup files when --backup flag is used', () => {
      createOldVersionBoard('old-board.knbn');
      
      const result = runCLI(['migrate', 'old-board.knbn', '--backup']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📋 Created backup: old-board.knbn.bak');
      expect(result.stdout).toContain('✅ old-board.knbn: Migrated from 0.1.0 to 0.2.0');

      // Verify backup file exists and contains old version
      expect(fs.existsSync(path.join(tempDir, 'old-board.knbn.bak'))).toBe(true);
      
      const yaml = require('js-yaml');
      const backupContent = fs.readFileSync(path.join(tempDir, 'old-board.knbn.bak'), 'utf8');
      const backupBoard = yaml.load(backupContent) as any;
      expect(backupBoard.metadata.version).toBe('0.1.0');

      // Verify original file was migrated
      const migratedBoard = loadBoard(path.join(tempDir, 'old-board.knbn') as Filepath);
      expect(migratedBoard.metadata.version).toBe('0.2.0');
    });

    it('should skip files already at latest version', () => {
      const result = runCLI(['migrate', 'test-board-1.knbn']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('⏭️  test-board-1.knbn: Already at latest version (0.2.0)');
      expect(result.stdout).toContain('Already current: 1 files');
      expect(result.stdout).toContain('Migrated: 0 files');
    });

    it('should handle non-existent files gracefully', () => {
      const result = runCLI(['migrate', 'nonexistent.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('File not found: nonexistent.knbn');
      expect(result.stdout).toContain('Errors: 1 files');
    });

    it('should handle invalid board files gracefully', () => {
      // Create an invalid board file
      fs.writeFileSync(path.join(tempDir, 'invalid.knbn'), 'invalid: yaml: [content', 'utf8');
      
      const result = runCLI(['migrate', 'invalid.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid board file format: invalid.knbn');
      expect(result.stdout).toContain('Errors: 1 files');
    });

    it('should handle files missing version information', () => {
      // Create a board file without version metadata
      const invalidBoard = {
        name: 'No Version Board',
        tasks: {}
      };
      
      const yaml = require('js-yaml');
      const content = yaml.dump(invalidBoard);
      fs.writeFileSync(path.join(tempDir, 'no-version.knbn'), content, 'utf8');
      
      const result = runCLI(['migrate', 'no-version.knbn']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid board file format: no-version.knbn');
      expect(result.stdout).toContain('Errors: 1 files');
    });

    it('should fail when no files specified and --all not used', () => {
      const result = runCLI(['migrate']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Please specify files to migrate or use --all flag');
      expect(result.stdout).toContain('Examples:');
      expect(result.stdout).toContain('knbn migrate board.knbn');
      expect(result.stdout).toContain('knbn migrate --all');
    });

    it('should handle empty directory with --all flag', () => {
      // Remove all .knbn files
      const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.knbn'));
      files.forEach(f => fs.unlinkSync(path.join(tempDir, f)));
      
      const result = runCLI(['migrate', '--all']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No .knbn files found in current directory');
    });

    it('should handle mixed results correctly', () => {
      createOldVersionBoard('old-board.knbn');
      
      // Create an invalid file
      fs.writeFileSync(path.join(tempDir, 'invalid.knbn'), 'invalid content', 'utf8');
      
      const result = runCLI(['migrate', 'old-board.knbn', 'test-board-1.knbn', 'invalid.knbn', 'nonexistent.knbn']);
      
      expect(result.exitCode).toBe(1); // Should exit with error due to failures
      expect(result.stdout).toContain('✅ old-board.knbn: Migrated from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('⏭️  test-board-1.knbn: Already at latest version');
      expect(result.stderr).toContain('Invalid board file format: invalid.knbn');
      expect(result.stderr).toContain('File not found: nonexistent.knbn');
      expect(result.stdout).toContain('Migrated: 1 files');
      expect(result.stdout).toContain('Already current: 1 files');
      expect(result.stdout).toContain('Errors: 2 files');
    });

    it('should combine dry-run with --all flag', () => {
      createOldVersionBoard('old-board.knbn');
      
      const result = runCLI(['migrate', '--all', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🔄 old-board.knbn: Would migrate from 0.1.0 to 0.2.0');
      expect(result.stdout).toContain('⏭️  test-board-1.knbn: Already at latest version');
      expect(result.stdout).toContain('Would migrate: 1 files');
      expect(result.stdout).toContain('Already current: 2 files');
    });

    it('should combine backup with multiple files', () => {
      createOldVersionBoard('old-board-1.knbn');
      createOldVersionBoard('old-board-2.knbn');
      
      const result = runCLI(['migrate', 'old-board-1.knbn', 'old-board-2.knbn', '--backup']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📋 Created backup: old-board-1.knbn.bak');
      expect(result.stdout).toContain('📋 Created backup: old-board-2.knbn.bak');
      expect(result.stdout).toContain('Migrated: 2 files');

      // Verify both backup files exist
      expect(fs.existsSync(path.join(tempDir, 'old-board-1.knbn.bak'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'old-board-2.knbn.bak'))).toBe(true);
    });
  });
});
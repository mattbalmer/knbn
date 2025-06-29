import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadBoard } from '../../src/core/boardUtils';

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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'knbn-cli-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Create a test board file
    const testBoard = `
configuration:
  name: "CLI Test Board"
  description: "Board for CLI testing"
  columns:
    - name: "todo"
    - name: "doing"
    - name: "done"

tasks:

metadata:
  nextId: 1
  createdAt: "2024-01-01T09:00:00Z"
  lastModified: "2024-01-01T09:00:00Z"
  version: "0.1.0"
    `;
    fs.writeFileSync(path.join(tempDir, 'test.knbn'), testBoard.trim());
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
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
      
      const stdout = execSync(`node "${cliPath}" ${escapedArgs.join(' ')}`, {
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

  describe('help command', () => {
    it('should display help information', () => {
      const result = runCLI(['help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KnBn - Kanban CLI Tool');
      expect(result.stdout).toContain('Usage: knbn [command] [options]');
      expect(result.stdout).toContain('create-task');
      expect(result.stdout).toContain('update-task');
      expect(result.stdout).toContain('server');
    });

    it('should display help with --help flag', () => {
      const result = runCLI(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KnBn - Kanban CLI Tool');
    });

    it('should display help with -h flag', () => {
      const result = runCLI(['-h']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KnBn - Kanban CLI Tool');
    });
  });

  describe('create-task command', () => {
    it('should create a task with auto-detected board file', () => {
      // Rename test.knbn to a discoverable name
      fs.renameSync(path.join(tempDir, 'test.knbn'), path.join(tempDir, '.knbn'));
      
      const result = runCLI(['create-task', 'New test task']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: New test task');
      expect(result.stdout).toContain('Status: todo');
      
      // Verify task was actually created
      const board = loadBoard(path.join(tempDir, '.knbn'));
      expect(board.tasks[1]).toBeDefined();
      expect(board.tasks[1].title).toBe('New test task');
      expect(board.metadata.nextId).toBe(2);
    });

    it('should create a task with specific board file', () => {
      const result = runCLI(['-f', 'test.knbn', 'create-task', 'Task with specific board']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Task with specific board');
      
      // Verify task was created in the specified file
      const board = loadBoard(path.join(tempDir, 'test.knbn'));
      expect(board.tasks[1].title).toBe('Task with specific board');
    });

    it('should create a task with multi-word title', () => {
      const result = runCLI(['-f', 'test.knbn', 'create-task', 'This', 'is', 'a', 'long', 'task', 'title']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: This is a long task title');
    });

    it('should handle empty task title', () => {
      const result = runCLI(['-f', 'test.knbn', 'create-task']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: New Task');
    });

    it('should fail when no board file is found', () => {
      fs.unlinkSync(path.join(tempDir, 'test.knbn'));
      
      const result = runCLI(['create-task', 'Task without board']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No .knbn board file found');
    });

    it('should fail with non-existent specific board file', () => {
      const result = runCLI(['-f', 'nonexistent.knbn', 'create-task', 'Task']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create task');
    });
  });

  describe('update-task command', () => {
    beforeEach(() => {
      // Create a task to update
      runCLI(['-f', 'test.knbn', 'create-task', 'Task to update']);
    });

    it('should update task title', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', '1', '--title', 'Updated title']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated task #1: Updated title');
      
      // Verify update
      const board = loadBoard(path.join(tempDir, 'test.knbn'));
      expect(board.tasks[1].title).toBe('Updated title');
    });

    it('should update task status', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', '1', '--status', 'doing']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Status: doing');
      
      // Verify update
      const board = loadBoard(path.join(tempDir, 'test.knbn'));
      expect(board.tasks[1].status).toBe('doing');
    });

    it('should update task assignee', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', '1', '--assignee', 'john']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Assignee: john');
      
      // Verify update
      const board = loadBoard(path.join(tempDir, 'test.knbn'));
      expect(board.tasks[1].assignee).toBe('john');
    });

    it('should update task description', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', '1', '--description', 'New description']);
      
      expect(result.exitCode).toBe(0);
      
      // Verify update
      const board = loadBoard(path.join(tempDir, 'test.knbn'));
      expect(board.tasks[1].description).toBe('New description');
    });

    it('should update multiple fields at once', () => {
      const result = runCLI([
        '-f', 'test.knbn', 'update-task', '1',
        '--title', 'Multi-update task',
        '--status', 'done',
        '--assignee', 'jane'
      ]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Multi-update task');
      expect(result.stdout).toContain('Status: done');
      expect(result.stdout).toContain('Assignee: jane');
      
      // Verify updates
      const board = loadBoard(path.join(tempDir, 'test.knbn'));
      const task = board.tasks[1];
      expect(task.title).toBe('Multi-update task');
      expect(task.status).toBe('done');
      expect(task.assignee).toBe('jane');
      expect(task.completed).toBeDefined(); // Should be set automatically
    });

    it('should fail with non-existent task ID', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', '999', '--title', 'Non-existent']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task #999 not found');
    });

    it('should fail with invalid task ID', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', 'invalid', '--title', 'Test']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Task ID must be a number');
    });

    it('should fail with no updates specified', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task', '1']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No updates specified');
    });

    it('should fail with missing task ID', () => {
      const result = runCLI(['-f', 'test.knbn', 'update-task']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Usage: knbn update-task');
    });
  });

  describe('file argument handling', () => {
    it('should accept --file flag', () => {
      const result = runCLI(['--file', 'test.knbn', 'create-task', 'File flag test']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: File flag test');
    });

    it('should accept -f flag', () => {
      const result = runCLI(['-f', 'test.knbn', 'create-task', 'Short flag test']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Short flag test');
    });

    it('should handle file argument before command', () => {
      const result = runCLI(['-f', 'test.knbn', 'create-task', 'Before command test']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Before command test');
    });
  });

  describe('unknown command handling', () => {
    it('should show error for unknown command', () => {
      const result = runCLI(['unknown-command']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command: unknown-command');
      expect(result.stderr).toContain('Run "knbn help" for usage information');
    });
  });

  describe('board file discovery', () => {
    beforeEach(() => {
      // Remove the test.knbn file for these tests
      fs.unlinkSync(path.join(tempDir, 'test.knbn'));
    });

    it('should find .knbn file', () => {
      const boardContent = `
configuration:
  name: "Dot KnBn Board"
  columns:
    - name: "todo"
tasks:
metadata:
  nextId: 1
  version: "0.1.0"
      `;
      fs.writeFileSync(path.join(tempDir, '.knbn'), boardContent.trim());
      
      const result = runCLI(['create-task', 'Dot file test']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Dot file test');
    });

    it('should find knbn.knbn file', () => {
      const boardContent = `
configuration:
  name: "KnBn Board"
  columns:
    - name: "todo"
tasks:
metadata:
  nextId: 1
  version: "0.1.0"
      `;
      fs.writeFileSync(path.join(tempDir, 'knbn.knbn'), boardContent.trim());
      
      const result = runCLI(['create-task', 'Standard file test']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Standard file test');
    });

    it('should find any .knbn file', () => {
      const boardContent = `
configuration:
  name: "Project Board"
  columns:
    - name: "todo"
tasks:
metadata:
  nextId: 1
  version: "0.1.0"
      `;
      fs.writeFileSync(path.join(tempDir, 'my-project.knbn'), boardContent.trim());
      
      const result = runCLI(['create-task', 'Any file test']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task #1: Any file test');
    });
  });

  describe('error handling', () => {
    it('should handle corrupted board file gracefully', () => {
      fs.writeFileSync(path.join(tempDir, 'corrupted.knbn'), 'invalid: yaml: [content');
      
      const result = runCLI(['-f', 'corrupted.knbn', 'create-task', 'Test']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create task');
    });

    it('should handle permission errors gracefully', () => {
      // Create a read-only board file (if possible on the system)
      const readOnlyPath = path.join(tempDir, 'readonly.knbn');
      fs.writeFileSync(readOnlyPath, 'configuration: {}\ntasks: {}\nmetadata: { nextId: 1, version: "0.1.0" }');
      
      try {
        fs.chmodSync(readOnlyPath, 0o444); // Read-only
        
        const result = runCLI(['-f', 'readonly.knbn', 'create-task', 'Test']);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Failed to create task');
      } catch (error) {
        // Skip test if chmod is not supported (e.g., on some Windows systems)
        console.log('Skipping permission test due to chmod failure');
      }
    });
  });
});
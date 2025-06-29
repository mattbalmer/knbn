import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  findBoardFile,
  loadBoard,
  saveBoard,
  addTaskToBoard,
  updateTaskInBoard
} from '../../src/core/boardUtils';
import { Board, Task } from '../../src/core/types';

describe('boardUtils', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'knbn-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Restore original working directory and cleanup
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('findBoardFile', () => {
    it('should find .knbn file when it exists', () => {
      fs.writeFileSync(path.join(tempDir, '.knbn'), 'test content');
      
      const result = findBoardFile();
      
      expect(result).toBe(fs.realpathSync(path.join(tempDir, '.knbn')));
    });

    it('should find knbn.knbn file when it exists', () => {
      fs.writeFileSync(path.join(tempDir, 'knbn.knbn'), 'test content');
      
      const result = findBoardFile();
      
      expect(result).toBe(fs.realpathSync(path.join(tempDir, 'knbn.knbn')));
    });

    it('should prefer .knbn over knbn.knbn', () => {
      fs.writeFileSync(path.join(tempDir, '.knbn'), 'priority content');
      fs.writeFileSync(path.join(tempDir, 'knbn.knbn'), 'secondary content');
      
      const result = findBoardFile();
      
      expect(result).toBe(fs.realpathSync(path.join(tempDir, '.knbn')));
    });

    it('should find any .knbn file when primary files do not exist', () => {
      fs.writeFileSync(path.join(tempDir, 'my-project.knbn'), 'project content');
      
      const result = findBoardFile();
      
      expect(result).toBe(fs.realpathSync(path.join(tempDir, 'my-project.knbn')));
    });

    it('should return null when no board files exist', () => {
      const result = findBoardFile();
      
      expect(result).toBeNull();
    });

    it('should find multiple .knbn files and return one', () => {
      fs.writeFileSync(path.join(tempDir, 'project1.knbn'), 'content1');
      fs.writeFileSync(path.join(tempDir, 'project2.knbn'), 'content2');
      
      const result = findBoardFile();
      
      expect(result).toBeDefined();
      expect(result?.endsWith('.knbn')).toBe(true);
    });
  });

  describe('loadBoard', () => {
    const validBoardContent = `
configuration:
  name: "Test Board"
  description: "A test board"
  columns:
    - name: "todo"
    - name: "done"
tasks:
  1:
    id: 1
    title: "Test Task"
    description: "Test"
    status: "todo"
    created: "2024-01-01T10:00:00Z"
    updated: "2024-01-01T10:00:00Z"
metadata:
  nextId: 2
  createdAt: "2024-01-01T09:00:00Z"
  lastModified: "2024-01-01T10:00:00Z"
  version: "0.1.0"
    `;

    it('should load a valid board file', () => {
      const boardPath = path.join(tempDir, 'test.knbn');
      fs.writeFileSync(boardPath, validBoardContent);
      
      const result = loadBoard(boardPath);
      
      expect(result.configuration.name).toBe('Test Board');
      expect(result.configuration.description).toBe('A test board');
      expect(result.configuration.columns).toHaveLength(2);
      expect(result.configuration.columns[0].name).toBe('todo');
      expect(result.tasks[1]).toBeDefined();
      expect(result.tasks[1].title).toBe('Test Task');
      expect(result.metadata.nextId).toBe(2);
    });

    it('should handle empty board structure with defaults', () => {
      const emptyBoardContent = 'configuration: {}';
      const boardPath = path.join(tempDir, 'empty.knbn');
      fs.writeFileSync(boardPath, emptyBoardContent);
      
      const result = loadBoard(boardPath);
      
      expect(result.configuration.name).toBe('Default Board');
      expect(result.configuration.description).toBe('A kanban board');
      expect(result.configuration.columns).toHaveLength(2);
      expect(result.tasks).toEqual({});
      expect(result.metadata.nextId).toBe(1);
      expect(result.metadata.version).toBeDefined();
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.knbn');
      
      expect(() => loadBoard(nonExistentPath)).toThrow('Failed to load board file');
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content: [unclosed';
      const boardPath = path.join(tempDir, 'invalid.knbn');
      fs.writeFileSync(boardPath, invalidYaml);
      
      expect(() => loadBoard(boardPath)).toThrow('Failed to load board file');
    });

    it('should handle partial board data with defaults', () => {
      const partialBoard = `
configuration:
  name: "Partial Board"
tasks:
  5:
    id: 5
    title: "Existing Task"
    status: "todo"
    created: "2024-01-01T10:00:00Z"
    updated: "2024-01-01T10:00:00Z"
      `;
      const boardPath = path.join(tempDir, 'partial.knbn');
      fs.writeFileSync(boardPath, partialBoard);
      
      const result = loadBoard(boardPath);
      
      expect(result.configuration.name).toBe('Partial Board');
      expect(result.configuration.description).toBe('A kanban board'); // default
      expect(result.tasks[5]).toBeDefined();
      expect(result.metadata.nextId).toBe(1); // default
    });
  });

  describe('saveBoard', () => {
    it('should save a board to file', () => {
      const board: Board = {
        configuration: {
          name: 'Save Test Board',
          description: 'Testing save functionality',
          columns: [{ name: 'todo' }, { name: 'done' }]
        },
        tasks: {
          1: {
            id: 1,
            title: 'Test Task',
            description: 'Test Description',
            status: 'todo',
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z'
          }
        },
        metadata: {
          nextId: 2,
          createdAt: '2024-01-01T09:00:00Z',
          lastModified: '2024-01-01T10:00:00Z',
          version: '0.1.0'
        }
      };
      const boardPath = path.join(tempDir, 'save-test.knbn');
      
      saveBoard(boardPath, board);
      
      expect(fs.existsSync(boardPath)).toBe(true);
      const content = fs.readFileSync(boardPath, 'utf8');
      expect(content).toContain('Save Test Board');
      expect(content).toContain('Test Task');
      
      // Verify lastModified was updated
      const reloadedBoard = loadBoard(boardPath);
      expect(new Date(reloadedBoard.metadata.lastModified).getTime()).toBeGreaterThan(
        new Date('2024-01-01T10:00:00Z').getTime()
      );
    });

    it('should handle save errors gracefully', () => {
      const board: Board = {
        configuration: { name: 'Test', description: 'Test', columns: [] },
        tasks: {},
        metadata: { nextId: 1, createdAt: '', lastModified: '', version: '0.1.0' }
      };
      const invalidPath = '/invalid/path/that/does/not/exist.knbn';
      
      expect(() => saveBoard(invalidPath, board)).toThrow('Failed to save board file');
    });
  });

  describe('addTaskToBoard', () => {
    let board: Board;

    beforeEach(() => {
      board = {
        configuration: {
          name: 'Test Board',
          description: 'Test',
          columns: [{ name: 'backlog' }, { name: 'todo' }, { name: 'done' }]
        },
        tasks: {},
        metadata: {
          nextId: 1,
          createdAt: '2024-01-01T09:00:00Z',
          lastModified: '2024-01-01T09:00:00Z',
          version: '0.1.0'
        }
      };
    });

    it('should add a task with provided data', () => {
      const taskData: Partial<Task> = {
        title: 'New Task',
        description: 'Task description',
        assignee: 'john',
        labels: ['feature']
      };
      
      const result = addTaskToBoard(board, taskData);
      
      expect(result.id).toBe(1);
      expect(result.title).toBe('New Task');
      expect(result.description).toBe('Task description');
      expect(result.status).toBe('backlog'); // First column
      expect(result.assignee).toBe('john');
      expect(result.labels).toEqual(['feature']);
      expect(board.tasks[1]).toBe(result);
      expect(board.metadata.nextId).toBe(2);
    });

    it('should add a task with default values', () => {
      const result = addTaskToBoard(board, {});
      
      expect(result.id).toBe(1);
      expect(result.title).toBe('Untitled Task');
      expect(result.description).toBe('');
      expect(result.status).toBe('backlog');
      expect(result.created).toBeDefined();
      expect(result.updated).toBeDefined();
    });

    it('should increment nextId correctly', () => {
      addTaskToBoard(board, { title: 'Task 1' });
      addTaskToBoard(board, { title: 'Task 2' });
      
      expect(board.metadata.nextId).toBe(3);
      expect(board.tasks[1].title).toBe('Task 1');
      expect(board.tasks[2].title).toBe('Task 2');
    });

    it('should use specified status when provided', () => {
      const result = addTaskToBoard(board, { title: 'Custom Status', status: 'done' });
      
      expect(result.status).toBe('done');
    });

    it('should handle board with no columns gracefully', () => {
      board.configuration.columns = [];
      
      const result = addTaskToBoard(board, { title: 'No Columns Task' });
      
      expect(result.status).toBe('todo'); // fallback default
    });
  });

  describe('updateTaskInBoard', () => {
    let board: Board;

    beforeEach(() => {
      board = {
        configuration: {
          name: 'Test Board',
          description: 'Test',
          columns: [{ name: 'todo' }, { name: 'doing' }, { name: 'done' }]
        },
        tasks: {
          1: {
            id: 1,
            title: 'Existing Task',
            description: 'Original description',
            status: 'todo',
            assignee: 'alice',
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z'
          }
        },
        metadata: {
          nextId: 2,
          createdAt: '2024-01-01T09:00:00Z',
          lastModified: '2024-01-01T10:00:00Z',
          version: '0.1.0'
        }
      };
    });

    it('should update task with new values', () => {
      const updates = {
        title: 'Updated Task',
        description: 'New description',
        assignee: 'bob'
      };
      
      const result = updateTaskInBoard(board, 1, updates);
      
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.title).toBe('Updated Task');
      expect(result!.description).toBe('New description');
      expect(result!.assignee).toBe('bob');
      expect(result!.status).toBe('todo'); // unchanged
      expect(result!.created).toBe('2024-01-01T10:00:00Z'); // unchanged
      expect(new Date(result!.updated).getTime()).toBeGreaterThan(
        new Date('2024-01-01T10:00:00Z').getTime()
      );
    });

    it('should return null for non-existent task', () => {
      const result = updateTaskInBoard(board, 999, { title: 'Non-existent' });
      
      expect(result).toBeNull();
    });

    it('should preserve ID even if provided in updates', () => {
      const updates = { id: 999, title: 'Trying to change ID' };
      
      const result = updateTaskInBoard(board, 1, updates);
      
      expect(result!.id).toBe(1); // Should remain 1, not 999
    });

    it('should set completed timestamp when status changes to done', () => {
      const result = updateTaskInBoard(board, 1, { status: 'done' });
      
      expect(result!.status).toBe('done');
      expect(result!.completed).toBeDefined();
      expect(new Date(result!.completed!).getTime()).toBeGreaterThan(0);
    });

    it('should set completed timestamp for other completion statuses', () => {
      const result1 = updateTaskInBoard(board, 1, { status: 'completed' });
      expect(result1!.completed).toBeDefined();
      
      // Reset task
      board.tasks[1].completed = undefined;
      
      const result2 = updateTaskInBoard(board, 1, { status: 'finished' });
      expect(result2!.completed).toBeDefined();
    });

    it('should not override existing completed timestamp', () => {
      const existingCompleted = '2024-01-01T15:00:00Z';
      board.tasks[1].completed = existingCompleted;
      
      const result = updateTaskInBoard(board, 1, { status: 'done' });
      
      expect(result!.completed).toBe(existingCompleted);
    });

    it('should allow manual completion timestamp override', () => {
      const manualCompleted = '2024-01-01T16:00:00Z';
      
      const result = updateTaskInBoard(board, 1, { 
        status: 'done', 
        completed: manualCompleted 
      });
      
      expect(result!.completed).toBe(manualCompleted);
    });

    it('should not set completed timestamp for non-completion statuses', () => {
      const result = updateTaskInBoard(board, 1, { status: 'doing' });
      
      expect(result!.status).toBe('doing');
      expect(result!.completed).toBeUndefined();
    });

    it('should handle partial updates correctly', () => {
      const result = updateTaskInBoard(board, 1, { title: 'Just Title Change' });
      
      expect(result!.title).toBe('Just Title Change');
      expect(result!.description).toBe('Original description'); // unchanged
      expect(result!.assignee).toBe('alice'); // unchanged
      expect(result!.status).toBe('todo'); // unchanged
    });
  });
});
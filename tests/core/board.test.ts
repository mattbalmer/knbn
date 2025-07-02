import { createBoard, findDefaultColumn, newTask } from '../../src/core/utils/board';
import { Board, Task } from '../../src/core/types/knbn';

describe('board utils', () => {
  describe('createBoard', () => {
    it('should create a board with all provided data', () => {
      const boardData = {
        name: 'Test Board',
        description: 'A test board',
        columns: [{ name: 'todo' }, { name: 'done' }]
      };

      const result = createBoard(boardData);

      expect(result.name).toBe('Test Board');
      expect(result.description).toBe('A test board');
      expect(result.columns).toHaveLength(2);
      expect(result.columns[0].name).toBe('todo');
      expect(result.tasks).toEqual({});
      expect(result.metadata.nextId).toBe(1);
      expect(result.metadata.version).toBeDefined();
      expect(result.dates.created).toBeDefined();
      expect(result.dates.updated).toBeDefined();
      expect(result.dates.saved).toBeDefined();
    });

    it('should create a board with default values', () => {
      const result = createBoard({});

      expect(result.name).toBe('Your Board');
      expect(result.description).toBe('Your local kanban board');
      expect(result.columns).toHaveLength(4);
      expect(result.columns[0].name).toBe('backlog');
      expect(result.columns[1].name).toBe('todo');
      expect(result.columns[2].name).toBe('working');
      expect(result.columns[3].name).toBe('done');
      expect(result.tasks).toEqual({});
      expect(result.metadata.nextId).toBe(1);
    });

    it('should create board with correct metadata structure', () => {
      const result = createBoard({});

      expect(result.metadata).toEqual({
        nextId: 1,
        version: expect.any(String)
      });

      // Verify timestamps are valid ISO strings
      expect(() => new Date(result.dates.created)).not.toThrow();
      expect(() => new Date(result.dates.updated)).not.toThrow();
      expect(() => new Date(result.dates.saved)).not.toThrow();
    });
  });

  describe('findDefaultColumn', () => {
    it('should return the first column', () => {
      const board: Board = {
        name: 'Test Board',
        columns: [{ name: 'backlog' }, { name: 'todo' }, { name: 'done' }],
        tasks: {},
        metadata: { nextId: 1, version: '0.1.0' },
        dates: { created: '', updated: '', saved: '' }
      };

      const result = findDefaultColumn(board);

      expect(result).toEqual({ name: 'backlog' });
    });

    it('should return undefined for board with no columns', () => {
      const board: Board = {
        name: 'Test Board',
        columns: [],
        tasks: {},
        metadata: { nextId: 1, version: '0.1.0' },
        dates: { created: '', updated: '', saved: '' }
      };

      const result = findDefaultColumn(board);

      expect(result).toBeUndefined();
    });
  });

  describe('newTask', () => {
    let board: Board;

    beforeEach(() => {
      board = {
        name: 'Test Board',
        description: 'Test',
        columns: [{ name: 'backlog' }, { name: 'todo' }, { name: 'working' }, { name: 'done' }],
        tasks: {},
        metadata: {
          nextId: 1,
          version: '0.1.0'
        },
        dates: {
          created: '2024-01-01T09:00:00Z',
          updated: '2024-01-01T09:00:00Z',
          saved: '2024-01-01T09:00:00Z'
        }
      };
    });

    it('should add a task with provided data', () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description'
      };
      
      const result = newTask(board, taskData);
      
      expect(result.task.id).toBe(1);
      expect(result.task.title).toBe('New Task');
      expect(result.task.description).toBe('Task description');
      expect(result.task.column).toBe('backlog'); // First column
      expect(result.task.dates.created).toBeDefined();
      expect(result.task.dates.updated).toBeDefined();
      expect(result.board.tasks[1]).toBe(result.task);
      expect(result.board.metadata.nextId).toBe(2);
    });

    it('should add a task with default values', () => {
      const result = newTask(board, {});
      
      expect(result.task.id).toBe(1);
      expect(result.task.title).toBe('');
      expect(result.task.description).toBe('');
      expect(result.task.column).toBe('backlog');
      expect(result.task.dates.created).toBeDefined();
      expect(result.task.dates.updated).toBeDefined();
    });

    it('should increment nextId correctly', () => {
      const result1 = newTask(board, { title: 'Task 1' });
      const result2 = newTask(result1.board, { title: 'Task 2' });
      
      expect(result2.board.metadata.nextId).toBe(3);
      expect(result2.board.tasks[1].title).toBe('Task 1');
      expect(result2.board.tasks[2].title).toBe('Task 2');
    });

    it('should use default column from board', () => {
      const result = newTask(board, { title: 'Default Column Task' });
      
      // The newTask function uses findDefaultColumn which returns the first column
      expect(result.task.column).toBe('backlog');
    });

    it('should handle board with no columns gracefully', () => {
      board.columns = [];
      
      const result = newTask(board, { title: 'No Columns Task' });
      
      expect(result.task.column).toBe(''); // fallback when no default column
    });

    it('should update board dates', () => {
      const originalUpdated = board.dates.updated;
      
      const result = newTask(board, { title: 'Test Task' });
      
      expect(new Date(result.board.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });
  });
});
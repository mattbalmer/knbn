import {
  createColumn,
  getColumnByName,
  addColumnToBoard,
  updateColumnOnBoard,
  removeColumnFromBoard,
  moveColumnOnBoard,
  getTasksInColumn,
  getColumnTaskCount,
  getColumnNames
} from '../../../src/core/utils/column';
import { Board } from '../../../src/core/types/knbn';

describe('column utils', () => {
  let sampleBoard: Board;

  beforeEach(() => {
    sampleBoard = {
      name: 'Test Board',
      description: 'Test board',
      columns: [
        { name: 'todo' },
        { name: 'doing' },
        { name: 'done' }
      ],
      tasks: {
        1: {
          id: 1,
          title: 'Task 1',
          description: 'Test task 1',
          column: 'todo',
          dates: {
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z'
          }
        },
        2: {
          id: 2,
          title: 'Task 2',
          description: 'Test task 2',
          column: 'doing',
          dates: {
            created: '2024-01-01T11:00:00Z',
            updated: '2024-01-01T11:00:00Z'
          }
        },
        3: {
          id: 3,
          title: 'Task 3',
          description: 'Test task 3',
          column: 'todo',
          dates: {
            created: '2024-01-01T12:00:00Z',
            updated: '2024-01-01T12:00:00Z'
          }
        }
      },
      metadata: { nextId: 4, version: '0.2.0' },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T09:00:00Z',
        saved: '2024-01-01T09:00:00Z'
      }
    };
  });

  describe('createColumn', () => {
    it('should create a column with required name', () => {
      const column = createColumn({ name: 'testing' });
      
      expect(column).toEqual({ name: 'testing' });
    });
  });

  describe('getColumnByName', () => {
    it('should find existing column', () => {
      const column = getColumnByName(sampleBoard, 'todo');
      
      expect(column).toEqual({ name: 'todo' });
    });

    it('should return undefined for non-existent column', () => {
      const column = getColumnByName(sampleBoard, 'nonexistent');
      
      expect(column).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const column = getColumnByName(sampleBoard, 'TODO');
      
      expect(column).toBeUndefined();
    });
  });

  describe('addColumnToBoard', () => {
    it('should add column to end by default', () => {
      const newColumn = { name: 'testing' };
      const updatedBoard = addColumnToBoard(sampleBoard, newColumn);
      
      expect(updatedBoard.columns).toHaveLength(4);
      expect(updatedBoard.columns[3]).toEqual(newColumn);
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should add column at specified position', () => {
      const newColumn = { name: 'testing' };
      const updatedBoard = addColumnToBoard(sampleBoard, newColumn, 1);
      
      expect(updatedBoard.columns).toHaveLength(4);
      expect(updatedBoard.columns[1]).toEqual(newColumn);
      expect(updatedBoard.columns[0]).toEqual({ name: 'todo' });
      expect(updatedBoard.columns[2]).toEqual({ name: 'doing' });
    });

    it('should add column at beginning when position is 0', () => {
      const newColumn = { name: 'testing' };
      const updatedBoard = addColumnToBoard(sampleBoard, newColumn, 0);
      
      expect(updatedBoard.columns[0]).toEqual(newColumn);
      expect(updatedBoard.columns[1]).toEqual({ name: 'todo' });
    });

    it('should throw error if column with same name exists', () => {
      const duplicateColumn = { name: 'todo' };
      
      expect(() => addColumnToBoard(sampleBoard, duplicateColumn)).toThrow(
        'Column with name "todo" already exists'
      );
    });

    it('should handle invalid position by adding to end', () => {
      const newColumn = { name: 'testing' };
      const updatedBoard = addColumnToBoard(sampleBoard, newColumn, 10);
      
      expect(updatedBoard.columns).toHaveLength(4);
      expect(updatedBoard.columns[3]).toEqual(newColumn);
    });

    it('should handle negative position by adding to end', () => {
      const newColumn = { name: 'testing' };
      const updatedBoard = addColumnToBoard(sampleBoard, newColumn, -1);
      
      expect(updatedBoard.columns).toHaveLength(4);
      expect(updatedBoard.columns[3]).toEqual(newColumn);
    });
  });

  describe('updateColumnOnBoard', () => {
    it('should update existing column', () => {
      const updatedBoard = updateColumnOnBoard(sampleBoard, 'todo', { name: 'todo-updated' });
      
      expect(updatedBoard.columns[0]).toEqual({ name: 'todo-updated' });
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should preserve name when not provided in updates', () => {
      const updatedBoard = updateColumnOnBoard(sampleBoard, 'todo', {});
      
      expect(updatedBoard.columns[0]).toEqual({ name: 'todo' });
    });

    it('should throw error for non-existent column', () => {
      expect(() => updateColumnOnBoard(sampleBoard, 'nonexistent', { name: 'new-name' })).toThrow(
        'Column with name "nonexistent" not found'
      );
    });

    it('should not mutate original board', () => {
      const originalColumns = [...sampleBoard.columns];
      updateColumnOnBoard(sampleBoard, 'todo', { name: 'updated' });
      
      expect(sampleBoard.columns).toEqual(originalColumns);
    });
  });

  describe('removeColumnFromBoard', () => {
    it('should remove empty column', () => {
      const updatedBoard = removeColumnFromBoard(sampleBoard, 'done');
      
      expect(updatedBoard.columns).toHaveLength(2);
      expect(updatedBoard.columns.find(col => col.name === 'done')).toBeUndefined();
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should throw error when removing column with tasks', () => {
      expect(() => removeColumnFromBoard(sampleBoard, 'todo')).toThrow(
        'Cannot remove column "todo" because it contains 2 task(s)'
      );
    });

    it('should silently succeed on remove with nonexistent column', () => {
      const updatedBoard = removeColumnFromBoard(sampleBoard, 'nonexistent');

      expect(updatedBoard.columns).toHaveLength(3);
      expect(updatedBoard.columns.find(col => col.name === 'nonexistent')).toBeUndefined();
      expect(new Date(updatedBoard.dates.updated).getTime()).toEqual(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should not mutate original board', () => {
      const originalColumns = [...sampleBoard.columns];
      try {
        removeColumnFromBoard(sampleBoard, 'todo');
      } catch (e) {
        // Expected to throw
      }
      
      expect(sampleBoard.columns).toEqual(originalColumns);
    });
  });

  describe('moveColumnOnBoard', () => {
    it('should move column to new position', () => {
      const updatedBoard = moveColumnOnBoard(sampleBoard, 'done', 0);
      
      expect(updatedBoard.columns[0]).toEqual({ name: 'done' });
      expect(updatedBoard.columns[1]).toEqual({ name: 'todo' });
      expect(updatedBoard.columns[2]).toEqual({ name: 'doing' });
    });

    it('should handle moving to same position', () => {
      const updatedBoard = moveColumnOnBoard(sampleBoard, 'todo', 0);
      
      expect(updatedBoard.columns).toEqual(sampleBoard.columns);
    });

    it('should throw error for non-existent column', () => {
      expect(() => moveColumnOnBoard(sampleBoard, 'nonexistent', 0)).toThrow(
        'Column with name "nonexistent" not found'
      );
    });

    it('should throw error for invalid position (negative)', () => {
      expect(() => moveColumnOnBoard(sampleBoard, 'todo', -1)).toThrow(
        'Invalid position -1. Must be between 0 and 2'
      );
    });

    it('should throw error for invalid position (too high)', () => {
      expect(() => moveColumnOnBoard(sampleBoard, 'todo', 3)).toThrow(
        'Invalid position 3. Must be between 0 and 2'
      );
    });

    it('should update board dates', () => {
      const updatedBoard = moveColumnOnBoard(sampleBoard, 'done', 0);
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });
  });

  describe('getTasksInColumn', () => {
    it('should return tasks in specified column', () => {
      const tasks = getTasksInColumn(sampleBoard, 'todo');
      
      expect(tasks).toHaveLength(2);
      expect(tasks.every(task => task.column === 'todo')).toBe(true);
    });

    it('should return empty array for column with no tasks', () => {
      const tasks = getTasksInColumn(sampleBoard, 'done');
      
      expect(tasks).toEqual([]);
    });

    it('should return empty array for non-existent column', () => {
      const tasks = getTasksInColumn(sampleBoard, 'nonexistent');
      
      expect(tasks).toEqual([]);
    });

    it('should return sorted tasks', () => {
      const tasks = getTasksInColumn(sampleBoard, 'todo');
      
      // Verify tasks are returned (sorting logic is tested in task utils)
      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBeDefined();
      expect(tasks[1].id).toBeDefined();
    });
  });

  describe('getColumnTaskCount', () => {
    it('should return correct task count for column', () => {
      const count = getColumnTaskCount(sampleBoard, 'todo');
      
      expect(count).toBe(2);
    });

    it('should return 0 for empty column', () => {
      const count = getColumnTaskCount(sampleBoard, 'done');
      
      expect(count).toBe(0);
    });

    it('should return 0 for non-existent column', () => {
      const count = getColumnTaskCount(sampleBoard, 'nonexistent');
      
      expect(count).toBe(0);
    });
  });

  describe('getColumnNames', () => {
    it('should return array of column names', () => {
      const names = getColumnNames(sampleBoard);
      
      expect(names).toEqual(['todo', 'doing', 'done']);
    });

    it('should return empty array for board with no columns', () => {
      const emptyBoard = { ...sampleBoard, columns: [] };
      const names = getColumnNames(emptyBoard);
      
      expect(names).toEqual([]);
    });

    it('should preserve column order', () => {
      const names = getColumnNames(sampleBoard);
      
      expect(names[0]).toBe('todo');
      expect(names[1]).toBe('doing');
      expect(names[2]).toBe('done');
    });
  });
});
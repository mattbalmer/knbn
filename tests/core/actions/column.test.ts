import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  createColumn,
  updateColumn,
  removeColumn,
  moveColumn,
  listColumns,
  getColumn,
  getTasksInColumn,
  getColumnTaskCount,
  getColumnNames
} from '../../../src/core/actions/column';
import { Board } from '../../../src/core/types/knbn';
import { Brands } from '../../../src/core/utils/ts';
// @ts-ignore
import { createTempDir } from '../../test-utils';

describe('column actions', () => {
  let tempDir: string;
  let testFilepath: string;
  let sampleBoard: Board;

  beforeEach(() => {
    tempDir = createTempDir('column-actions-tests');
    testFilepath = path.join(tempDir, 'test-board.knbn');

    sampleBoard = {
      name: 'Test Board',
      description: 'Test board for column actions',
      columns: [
        { name: 'todo' },
        { name: 'doing' },
        { name: 'done' }
      ],
      tasks: {
        1: {
          id: 1,
          title: 'Task 1',
          description: 'First task',
          column: 'todo',
          dates: {
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z'
          }
        },
        2: {
          id: 2,
          title: 'Task 2',
          description: 'Second task',
          column: 'todo',
          dates: {
            created: '2024-01-01T11:00:00Z',
            updated: '2024-01-01T11:00:00Z'
          }
        },
        3: {
          id: 3,
          title: 'Task 3',
          description: 'Third task',
          column: 'doing',
          dates: {
            created: '2024-01-01T12:00:00Z',
            updated: '2024-01-01T12:00:00Z'
          }
        }
      },
      metadata: { nextId: 4, version: '0.2' },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T09:00:00Z',
        saved: '2024-01-01T09:00:00Z'
      }
    };

    const content = yaml.dump(sampleBoard);
    fs.writeFileSync(testFilepath, content, 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('createColumn', () => {
    it('should create new column and add to end by default', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = createColumn(filepath, { name: 'testing' });
      
      expect(updatedBoard.columns).toHaveLength(4);
      expect(updatedBoard.columns[3]).toEqual({ name: 'testing' });
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.columns).toHaveLength(4);
      expect(savedBoard.columns[3].name).toBe('testing');
    });

    it('should create column at specified position', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = createColumn(filepath, { name: 'testing' }, 1);
      
      expect(updatedBoard.columns).toHaveLength(4);
      expect(updatedBoard.columns[1]).toEqual({ name: 'testing' });
      expect(updatedBoard.columns[0]).toEqual({ name: 'todo' });
      expect(updatedBoard.columns[2]).toEqual({ name: 'doing' });
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = createColumn(filepath, { name: 'testing' });
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should throw error for duplicate column name', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => createColumn(filepath, { name: 'todo' })).toThrow(
        'Column with name "todo" already exists'
      );
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => createColumn(filepath, { name: 'test' })).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('updateColumn', () => {
    it('should update existing column and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateColumn(filepath, 'todo', { name: 'backlog' });
      
      expect(updatedBoard.columns[0]).toEqual({ name: 'backlog' });
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.columns[0].name).toBe('backlog');
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = updateColumn(filepath, 'todo', { name: 'backlog' });
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should throw error for non-existent column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => updateColumn(filepath, 'nonexistent', { name: 'test' })).toThrow(
        'Column with name "nonexistent" not found'
      );
    });

    it('should preserve other columns', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateColumn(filepath, 'todo', { name: 'backlog' });
      
      expect(updatedBoard.columns[1]).toEqual({ name: 'doing' });
      expect(updatedBoard.columns[2]).toEqual({ name: 'done' });
    });
  });

  describe('removeColumn', () => {
    it('should remove empty column and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = removeColumn(filepath, 'done');
      
      expect(updatedBoard.columns).toHaveLength(2);
      expect(updatedBoard.columns.find(col => col.name === 'done')).toBeUndefined();
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.columns).toHaveLength(2);
    });

    it('should throw error when removing column with tasks', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => removeColumn(filepath, 'todo')).toThrow(
        'Cannot remove column "todo" because it contains 2 task(s)'
      );
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = removeColumn(filepath, 'done');
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should handle non-existent column gracefully', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = removeColumn(filepath, 'nonexistent');
      
      expect(updatedBoard.columns).toHaveLength(3);
      expect(updatedBoard).toEqual(sampleBoard);
    });
  });

  describe('moveColumn', () => {
    it('should move column to new position and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = moveColumn(filepath, 'done', 0);
      
      expect(updatedBoard.columns[0]).toEqual({ name: 'done' });
      expect(updatedBoard.columns[1]).toEqual({ name: 'todo' });
      expect(updatedBoard.columns[2]).toEqual({ name: 'doing' });
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.columns[0].name).toBe('done');
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = moveColumn(filepath, 'done', 0);
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should throw error for non-existent column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => moveColumn(filepath, 'nonexistent', 0)).toThrow(
        'Column with name "nonexistent" not found'
      );
    });

    it('should throw error for invalid position', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => moveColumn(filepath, 'todo', -1)).toThrow(
        'Invalid position -1. Must be between 0 and 2'
      );
      
      expect(() => moveColumn(filepath, 'todo', 3)).toThrow(
        'Invalid position 3. Must be between 0 and 2'
      );
    });
  });

  describe('listColumns', () => {
    it('should return all columns from board', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const columns = listColumns(filepath);
      
      expect(columns).toEqual([
        { name: 'todo' },
        { name: 'doing' },
        { name: 'done' }
      ]);
    });

    it('should return empty array for board with no columns', () => {
      const emptyBoard = { ...sampleBoard, columns: [] };
      const content = yaml.dump(emptyBoard);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const columns = listColumns(filepath);
      
      expect(columns).toEqual([]);
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => listColumns(filepath)).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('getColumn', () => {
    it('should return existing column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const column = getColumn(filepath, 'todo');
      
      expect(column).toEqual({ name: 'todo' });
    });

    it('should return undefined for non-existent column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const column = getColumn(filepath, 'nonexistent');
      
      expect(column).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const column = getColumn(filepath, 'TODO');
      
      expect(column).toBeUndefined();
    });
  });

  describe('getTasksInColumn', () => {
    it('should return tasks in specified column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = getTasksInColumn(filepath, 'todo');
      
      expect(tasks).toHaveLength(2);
      expect(tasks.every(task => task.column === 'todo')).toBe(true);
    });

    it('should return empty array for column with no tasks', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = getTasksInColumn(filepath, 'done');
      
      expect(tasks).toEqual([]);
    });

    it('should return empty array for non-existent column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = getTasksInColumn(filepath, 'nonexistent');
      
      expect(tasks).toEqual([]);
    });

    it('should return sorted tasks', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = getTasksInColumn(filepath, 'todo');
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBeDefined();
      expect(tasks[1].id).toBeDefined();
    });
  });

  describe('getColumnTaskCount', () => {
    it('should return correct task count for column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const count = getColumnTaskCount(filepath, 'todo');
      
      expect(count).toBe(2);
    });

    it('should return 0 for empty column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const count = getColumnTaskCount(filepath, 'done');
      
      expect(count).toBe(0);
    });

    it('should return 0 for non-existent column', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const count = getColumnTaskCount(filepath, 'nonexistent');
      
      expect(count).toBe(0);
    });
  });

  describe('getColumnNames', () => {
    it('should return array of column names', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const names = getColumnNames(filepath);
      
      expect(names).toEqual(['todo', 'doing', 'done']);
    });

    it('should return empty array for board with no columns', () => {
      const emptyBoard = { ...sampleBoard, columns: [] };
      const content = yaml.dump(emptyBoard);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const names = getColumnNames(filepath);
      
      expect(names).toEqual([]);
    });

    it('should preserve column order', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const names = getColumnNames(filepath);
      
      expect(names[0]).toBe('todo');
      expect(names[1]).toBe('doing');
      expect(names[2]).toBe('done');
    });
  });
});
import * as fs from 'fs';
import * as path from 'path';
import { saveBoard, loadBoard, loadBoardFields } from '../../src/core/utils/board-files';
import { Board } from '../../src/core/types/knbn';
import { Filepath } from '../../src/core/types/ts';
import { createTempDir, rmTempDir } from '../test-utils';

describe('board-files utils', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = createTempDir('knbn-board-files');
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmTempDir('knbn-board-files');
  });

  describe('saveBoard', () => {
    it('should save a board to file', () => {
      const board: Board = {
        name: 'Save Test Board',
        description: 'Testing save functionality',
        columns: [{ name: 'todo' }, { name: 'done' }],
        tasks: {
          1: {
            id: 1,
            title: 'Test Task',
            description: 'Test Description',
            column: 'todo',
            dates: {
              created: '2024-01-01T10:00:00Z',
              updated: '2024-01-01T10:00:00Z'
            }
          }
        },
        metadata: {
          nextId: 2,
          version: '0.1.0'
        },
        dates: {
          created: '2024-01-01T09:00:00Z',
          updated: '2024-01-01T10:00:00Z',
          saved: '2024-01-01T10:00:00Z'
        }
      };
      const boardPath = path.join(tempDir, 'save-test.knbn') as Filepath;
      
      saveBoard(boardPath, board);
      
      expect(fs.existsSync(boardPath)).toBe(true);
      const content = fs.readFileSync(boardPath, 'utf8');
      expect(content).toContain('Save Test Board');
      expect(content).toContain('Test Task');
      
      // Verify saved timestamp was updated
      const reloadedBoard = loadBoard(boardPath);
      expect(new Date(reloadedBoard.dates.saved).getTime()).toBeGreaterThan(
        new Date('2024-01-01T10:00:00Z').getTime()
      );
    });

    it('should handle save errors gracefully', () => {
      const board: Board = {
        name: 'Test',
        description: 'Test',
        columns: [],
        tasks: {},
        metadata: { nextId: 1, version: '0.1.0' },
        dates: { created: '', updated: '', saved: '' }
      };
      const invalidPath = '/invalid/path/that/does/not/exist.knbn' as Filepath;
      
      expect(() => saveBoard(invalidPath, board)).toThrow('Failed to save board file');
    });
  });

  describe('loadBoard', () => {
    const validBoardContent = `
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
    column: "todo"
    dates:
      created: "2024-01-01T10:00:00Z"
      updated: "2024-01-01T10:00:00Z"
metadata:
  nextId: 2
  version: "0.1.0"
dates:
  created: "2024-01-01T09:00:00Z"
  updated: "2024-01-01T10:00:00Z"
  saved: "2024-01-01T10:00:00Z"
    `;

    it('should load a valid board file', () => {
      const boardPath = path.join(tempDir, 'test.knbn') as Filepath;
      fs.writeFileSync(boardPath, validBoardContent);
      
      const result = loadBoard(boardPath);
      
      expect(result.name).toBe('Test Board');
      expect(result.description).toBe('A test board');
      expect(result.columns).toHaveLength(2);
      expect(result.columns[0].name).toBe('todo');
      expect(result.tasks[1]).toBeDefined();
      expect(result.tasks[1].title).toBe('Test Task');
      expect(result.metadata.nextId).toBe(2);
    });

    it('should handle empty tasks object', () => {
      const emptyTasksBoard = `
name: "Empty Tasks Board"
columns:
  - name: "todo"
tasks: {}
metadata:
  nextId: 1
  version: "0.1.0"
dates:
  created: "2024-01-01T09:00:00Z"
  updated: "2024-01-01T10:00:00Z" 
  saved: "2024-01-01T10:00:00Z"
      `;
      const boardPath = path.join(tempDir, 'empty-tasks.knbn') as Filepath;
      fs.writeFileSync(boardPath, emptyTasksBoard);
      
      const result = loadBoard(boardPath);
      
      expect(result.name).toBe('Empty Tasks Board');
      expect(result.tasks).toEqual({});
      expect(result.metadata.nextId).toBe(1);
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.knbn') as Filepath;
      
      expect(() => loadBoard(nonExistentPath)).toThrow('Failed to load board file');
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content: [unclosed';
      const boardPath = path.join(tempDir, 'invalid.knbn') as Filepath;
      fs.writeFileSync(boardPath, invalidYaml);
      
      expect(() => loadBoard(boardPath)).toThrow('Failed to load board file');
    });

    it('should throw error for invalid board format', () => {
      const invalidBoard = 'null';
      const boardPath = path.join(tempDir, 'invalid-format.knbn') as Filepath;
      fs.writeFileSync(boardPath, invalidBoard);
      
      expect(() => loadBoard(boardPath)).toThrow('Failed to load board file');
    });

    it('should handle missing tasks field', () => {
      const noTasksBoard = `
name: "No Tasks Board"
columns:
  - name: "todo"
metadata:
  nextId: 1
  version: "0.1.0"
dates:
  created: "2024-01-01T09:00:00Z"
  updated: "2024-01-01T10:00:00Z"
  saved: "2024-01-01T10:00:00Z"
      `;
      const boardPath = path.join(tempDir, 'no-tasks.knbn') as Filepath;
      fs.writeFileSync(boardPath, noTasksBoard);
      
      const result = loadBoard(boardPath);
      
      expect(result.name).toBe('No Tasks Board');
      expect(result.tasks).toEqual({});
    });
  });

  describe('loadBoardFields', () => {
    const sampleBoard = `
name: "Sample Board"
description: "A sample board"
columns:
  - name: "todo"
  - name: "done"
tasks:
  1:
    id: 1
    title: "Sample Task"
    description: "Test"
    column: "todo"
    dates:
      created: "2024-01-01T10:00:00Z"
      updated: "2024-01-01T10:00:00Z"
metadata:
  nextId: 2
  version: "0.1.0"
dates:
  created: "2024-01-01T09:00:00Z"
  updated: "2024-01-01T10:00:00Z"
  saved: "2024-01-01T10:00:00Z"
    `;

    it('should load specific fields from a board file', () => {
      const boardPath = path.join(tempDir, 'sample.knbn') as Filepath;
      fs.writeFileSync(boardPath, sampleBoard);
      
      const result = loadBoardFields(boardPath, ['name', 'metadata']);
      
      expect(result.name).toBe('Sample Board');
      expect(result.metadata.nextId).toBe(2);
      expect((result as any).description).toBeUndefined();
      expect((result as any).tasks).toBeUndefined();
      expect((result as any).columns).toBeUndefined();
    });

    it('should load single field from a board file', () => {
      const boardPath = path.join(tempDir, 'sample.knbn') as Filepath;
      fs.writeFileSync(boardPath, sampleBoard);
      
      const result = loadBoardFields(boardPath, ['name']);
      
      expect(result.name).toBe('Sample Board');
      expect((result as any).metadata).toBeUndefined();
      expect((result as any).tasks).toBeUndefined();
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.knbn') as Filepath;
      
      expect(() => loadBoardFields(nonExistentPath, ['name'])).toThrow('Failed to load board file');
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content: [unclosed';
      const boardPath = path.join(tempDir, 'invalid.knbn') as Filepath;
      fs.writeFileSync(boardPath, invalidYaml);
      
      expect(() => loadBoardFields(boardPath, ['name'])).toThrow('Failed to load board file');
    });
  });
});
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { saveBoard, loadBoard, loadBoardFields } from '../../../src/core/utils/board-files';
import { Board } from '../../../src/core/types/knbn';
import { Brands } from '../../../src/core/utils/ts';
import { createTempDir } from '../../test-utils';

describe('board-files utils', () => {
  let tempDir: string;
  let sampleBoard: Board;
  let testFilepath: string;

  beforeEach(() => {
    tempDir = createTempDir('board-files-tests');
    testFilepath = path.join(tempDir, 'test-board.knbn');

    sampleBoard = {
      name: 'Test Board',
      description: 'Test board for file operations',
      columns: [{ name: 'todo' }, { name: 'done' }],
      tasks: {
        1: {
          id: 1,
          title: 'Test Task',
          description: 'Test task description',
          column: 'todo',
          dates: {
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z'
          }
        }
      },
      labels: [{ name: 'bug', color: 'red' }],
      sprints: [{
        name: 'Sprint 1',
        description: 'Test sprint',
        capacity: 10,
        dates: {
          created: '2024-01-01T09:00:00Z',
          starts: '2024-01-01T09:00:00Z',
          ends: '2024-01-15T09:00:00Z'
        }
      }],
      metadata: { nextId: 2, version: '0.1.0' },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T09:00:00Z',
        saved: '2024-01-01T09:00:00Z'
      }
    };
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('saveBoard', () => {
    it('should save board to file with updated saved date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const beforeSave = new Date().getTime();
      
      saveBoard(filepath, sampleBoard);
      
      expect(fs.existsSync(testFilepath)).toBe(true);
      
      // Verify the saved date was updated
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      const savedTime = new Date(savedBoard.dates.saved).getTime();
      
      expect(savedTime).toBeGreaterThanOrEqual(beforeSave);
      expect(savedBoard.name).toBe(sampleBoard.name);
      expect(savedBoard.description).toBe(sampleBoard.description);
    });

    it('should preserve all board data when saving', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      saveBoard(filepath, sampleBoard);
      
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      
      expect(savedBoard.name).toBe(sampleBoard.name);
      expect(savedBoard.description).toBe(sampleBoard.description);
      expect(savedBoard.columns).toEqual(sampleBoard.columns);
      expect(savedBoard.tasks).toEqual(sampleBoard.tasks);
      expect(savedBoard.labels).toEqual(sampleBoard.labels);
      expect(savedBoard.sprints).toEqual(sampleBoard.sprints);
      expect(savedBoard.metadata).toEqual(sampleBoard.metadata);
      expect(savedBoard.dates.created).toBe(sampleBoard.dates.created);
      expect(savedBoard.dates.updated).toBe(sampleBoard.dates.updated);
    });

    it('should format YAML output properly', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      saveBoard(filepath, sampleBoard);
      
      const content = fs.readFileSync(testFilepath, 'utf8');
      
      // Verify it's valid YAML
      expect(() => yaml.load(content)).not.toThrow();
      
      // Verify indentation (should be 2 spaces)
      const lines = content.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  '));
      expect(indentedLines.length).toBeGreaterThan(0);
    });

    it('should throw error when file cannot be written', () => {
      const invalidPath = '/nonexistent/directory/test.knbn';
      const filepath = Brands.Filepath(invalidPath);
      
      expect(() => saveBoard(filepath, sampleBoard)).toThrow(
        'Failed to save board file:'
      );
    });

    it('should overwrite existing file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      // Save initial board
      saveBoard(filepath, sampleBoard);
      
      // Modify and save again
      const modifiedBoard = {
        ...sampleBoard,
        name: 'Modified Board'
      };
      
      saveBoard(filepath, modifiedBoard);
      
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      
      expect(savedBoard.name).toBe('Modified Board');
    });
  });

  describe('loadBoard', () => {
    beforeEach(() => {
      // Create a test file
      const content = yaml.dump(sampleBoard);
      fs.writeFileSync(testFilepath, content, 'utf8');
    });

    it('should load board from file correctly', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const loadedBoard = loadBoard(filepath);
      
      expect(loadedBoard.name).toBe(sampleBoard.name);
      expect(loadedBoard.description).toBe(sampleBoard.description);
      expect(loadedBoard.columns).toEqual(sampleBoard.columns);
      expect(loadedBoard.tasks).toEqual(sampleBoard.tasks);
      expect(loadedBoard.labels).toEqual(sampleBoard.labels);
      expect(loadedBoard.sprints).toEqual(sampleBoard.sprints);
      expect(loadedBoard.metadata).toEqual(sampleBoard.metadata);
      expect(loadedBoard.dates).toEqual(sampleBoard.dates);
    });

    it('should handle board with empty tasks', () => {
      const boardWithoutTasks = { ...sampleBoard };
      delete (boardWithoutTasks as any).tasks;
      
      const content = yaml.dump(boardWithoutTasks);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const loadedBoard = loadBoard(filepath);
      
      expect(loadedBoard.tasks).toEqual({});
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => loadBoard(filepath)).toThrow(
        'Failed to load board file:'
      );
    });

    it('should throw error for invalid YAML', () => {
      fs.writeFileSync(testFilepath, 'invalid: yaml: content: [', 'utf8');
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => loadBoard(filepath)).toThrow(
        'Failed to load board file:'
      );
    });

    it('should throw error for non-object data', () => {
      fs.writeFileSync(testFilepath, 'just a string', 'utf8');
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => loadBoard(filepath)).toThrow(
        'Invalid board file format'
      );
    });

    it('should throw error for null data', () => {
      fs.writeFileSync(testFilepath, '', 'utf8');
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => loadBoard(filepath)).toThrow(
        'Invalid board file format'
      );
    });
  });

  describe('loadBoardFields', () => {
    beforeEach(() => {
      const content = yaml.dump(sampleBoard);
      fs.writeFileSync(testFilepath, content, 'utf8');
    });

    it('should load specific fields only', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const result = loadBoardFields(filepath, ['name', 'description']);
      
      expect(result).toEqual({
        name: sampleBoard.name,
        description: sampleBoard.description
      });
      expect(Object.keys(result)).toEqual(['name', 'description']);
    });

    it('should load single field', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const result = loadBoardFields(filepath, ['name']);
      
      expect(result).toEqual({
        name: sampleBoard.name
      });
    });

    it('should load multiple fields', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const result = loadBoardFields(filepath, ['name', 'columns', 'metadata']);
      
      expect(result).toEqual({
        name: sampleBoard.name,
        columns: sampleBoard.columns,
        metadata: sampleBoard.metadata
      });
    });

    it('should handle empty fields array', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const result = loadBoardFields(filepath, []);
      
      expect(result).toEqual({});
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => loadBoardFields(filepath, ['name'])).toThrow(
        'Failed to load board file:'
      );
    });

    it('should handle fields that do not exist in file', () => {
      // Create minimal board without some fields
      const minimalBoard = {
        name: 'Minimal Board',
        columns: [{ name: 'todo' }],
        tasks: {},
        metadata: { nextId: 1, version: '0.1.0' },
        dates: {
          created: '2024-01-01T09:00:00Z',
          updated: '2024-01-01T09:00:00Z',
          saved: '2024-01-01T09:00:00Z'
        }
      };
      
      const content = yaml.dump(minimalBoard);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const result = loadBoardFields(filepath, ['name', 'description', 'labels']);
      
      expect(result).toEqual({
        name: 'Minimal Board'
        // description and labels should not be present since they don't exist in the file
      });
    });
  });
});
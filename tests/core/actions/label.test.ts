import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  addLabel,
  updateLabel,
  removeLabel,
  listLabels,
  getLabel
} from '../../../src/core/actions/label';
import { Board } from '../../../src/core/types/knbn';
import { Brands } from '../../../src/core/utils/ts';
import { createTempDir } from '../../test-utils';

describe('label actions', () => {
  let tempDir: string;
  let testFilepath: string;
  let sampleBoard: Board;

  beforeEach(() => {
    tempDir = createTempDir('label-actions-tests');
    testFilepath = path.join(tempDir, 'test-board.knbn');

    sampleBoard = {
      name: 'Test Board',
      description: 'Test board for label actions',
      columns: [{ name: 'todo' }, { name: 'done' }],
      tasks: {},
      labels: [
        { name: 'bug', color: 'red' },
        { name: 'feature', color: '#0096FF' },
        { name: 'urgent' } // no color
      ],
      metadata: { nextId: 1, version: '0.2.0' },
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

  describe('addLabel', () => {
    it('should add new label with color and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      const labelData = { name: 'testing', color: 'green' };
      
      const updatedBoard = addLabel(filepath, labelData);
      
      expect(updatedBoard.labels).toHaveLength(4);
      expect(updatedBoard.labels![3]).toEqual(labelData);
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.labels).toHaveLength(4);
      expect(savedBoard.labels![3]).toEqual(labelData);
    });

    it('should add label without color', () => {
      const filepath = Brands.Filepath(testFilepath);
      const labelData = { name: 'no-color' };
      
      const updatedBoard = addLabel(filepath, labelData);
      
      expect(updatedBoard.labels![3]).toEqual({ name: 'no-color', color: undefined });
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = addLabel(filepath, { name: 'testing' });
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should throw error for duplicate label name (case-insensitive)', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => addLabel(filepath, { name: 'bug' })).toThrow(
        'Label with name "bug" already exists'
      );
      
      expect(() => addLabel(filepath, { name: 'BUG' })).toThrow(
        'Label with name "BUG" already exists'
      );
    });

    it('should add label to board without existing labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      const content = yaml.dump(boardWithoutLabels);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const updatedBoard = addLabel(filepath, { name: 'first-label' });
      
      expect(updatedBoard.labels).toHaveLength(1);
      expect(updatedBoard.labels![0].name).toBe('first-label');
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => addLabel(filepath, { name: 'test' })).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('updateLabel', () => {
    it('should update existing label and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateLabel(filepath, 'bug', { color: 'orange' });
      
      expect(updatedBoard.labels![0]).toEqual({ name: 'bug', color: 'orange' });
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.labels![0].color).toBe('orange');
    });

    it('should update label name', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateLabel(filepath, 'bug', { name: 'defect' });
      
      expect(updatedBoard.labels![0]).toEqual({ name: 'defect', color: 'red' });
    });

    it('should update label with case-insensitive matching', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateLabel(filepath, 'BUG', { color: 'orange' });
      
      expect(updatedBoard.labels![0]).toEqual({ name: 'bug', color: 'orange' });
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = updateLabel(filepath, 'bug', { color: 'blue' });
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should preserve name when not provided in updates', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateLabel(filepath, 'bug', { color: 'yellow' });
      
      expect(updatedBoard.labels![0].name).toBe('bug');
    });

    it('should throw error for non-existent label', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => updateLabel(filepath, 'nonexistent', { color: 'green' })).toThrow(
        'Label with name "nonexistent" not found'
      );
    });

    it('should preserve other labels', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateLabel(filepath, 'bug', { color: 'orange' });
      
      expect(updatedBoard.labels![1]).toEqual({ name: 'feature', color: '#0096FF' });
      expect(updatedBoard.labels![2]).toEqual({ name: 'urgent' });
    });
  });

  describe('removeLabel', () => {
    it('should remove existing label and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = removeLabel(filepath, 'bug');
      
      expect(updatedBoard.labels).toHaveLength(2);
      expect(updatedBoard.labels!.find(label => label.name === 'bug')).toBeUndefined();
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.labels).toHaveLength(2);
    });

    it('should remove label with case-insensitive matching', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = removeLabel(filepath, 'BUG');
      
      expect(updatedBoard.labels).toHaveLength(2);
      expect(updatedBoard.labels!.find(label => label.name === 'bug')).toBeUndefined();
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = removeLabel(filepath, 'bug');
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should handle non-existent label gracefully', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = removeLabel(filepath, 'nonexistent');
      
      expect(updatedBoard.labels).toHaveLength(3);
      expect(updatedBoard).toEqual(sampleBoard);
    });

    it('should preserve other labels', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = removeLabel(filepath, 'bug');
      
      expect(updatedBoard.labels!.find(label => label.name === 'feature')).toBeDefined();
      expect(updatedBoard.labels!.find(label => label.name === 'urgent')).toBeDefined();
    });
  });

  describe('listLabels', () => {
    it('should return all labels from board', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const labels = listLabels(filepath);
      
      expect(labels).toEqual([
        { name: 'bug', color: 'red' },
        { name: 'feature', color: '#0096FF' },
        { name: 'urgent' }
      ]);
    });

    it('should return empty array for board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      const content = yaml.dump(boardWithoutLabels);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const labels = listLabels(filepath);
      
      expect(labels).toEqual([]);
    });

    it('should return empty array for board with empty labels array', () => {
      const boardWithEmptyLabels = { ...sampleBoard, labels: [] };
      const content = yaml.dump(boardWithEmptyLabels);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const labels = listLabels(filepath);
      
      expect(labels).toEqual([]);
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => listLabels(filepath)).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('getLabel', () => {
    it('should return existing label', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const label = getLabel(filepath, 'bug');
      
      expect(label).toEqual({ name: 'bug', color: 'red' });
    });

    it('should return label with case-insensitive matching', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const label = getLabel(filepath, 'BUG');
      
      expect(label).toEqual({ name: 'bug', color: 'red' });
    });

    it('should return undefined for non-existent label', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const label = getLabel(filepath, 'nonexistent');
      
      expect(label).toBeUndefined();
    });

    it('should return label without color', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const label = getLabel(filepath, 'urgent');
      
      expect(label).toEqual({ name: 'urgent', color: undefined });
    });

    it('should return undefined for board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      const content = yaml.dump(boardWithoutLabels);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const label = getLabel(filepath, 'bug');
      
      expect(label).toBeUndefined();
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => getLabel(filepath, 'bug')).toThrow(
        'Failed to load board file:'
      );
    });
  });
});
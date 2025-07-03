import {
  createLabel,
  getLabelByName,
  addLabelToBoard,
  updateLabelOnBoard,
  removeLabelFromBoard,
  findLabels
} from '../../../src/core/utils/label';
import { Board } from '../../../src/core/types/knbn';

describe('label utils', () => {
  let sampleBoard: Board;

  beforeEach(() => {
    sampleBoard = {
      name: 'Test Board',
      description: 'Test board',
      columns: [{ name: 'todo' }, { name: 'done' }],
      tasks: {},
      labels: [
        { name: 'bug', color: 'red' },
        { name: 'feature', color: 'blue' },
        { name: 'urgent' } // no color
      ],
      metadata: { nextId: 1, version: '0.1.0' },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T09:00:00Z',
        saved: '2024-01-01T09:00:00Z'
      }
    };
  });

  describe('createLabel', () => {
    it('should create a label with name and color', () => {
      const label = createLabel({ name: 'testing', color: 'green' });
      
      expect(label).toEqual({ name: 'testing', color: 'green' });
    });

    it('should create a label with only name', () => {
      const label = createLabel({ name: 'testing' });
      
      expect(label).toEqual({ name: 'testing', color: undefined });
    });

    it('should include all provided properties', () => {
      const label = createLabel({ name: 'testing', color: 'purple' });
      
      expect(Object.keys(label)).toEqual(['name', 'color']);
    });
  });

  describe('getLabelByName', () => {
    it('should find existing label', () => {
      const label = getLabelByName(sampleBoard, 'bug');
      
      expect(label).toEqual({ name: 'bug', color: 'red' });
    });

    it('should return undefined for non-existent label', () => {
      const label = getLabelByName(sampleBoard, 'nonexistent');
      
      expect(label).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const label = getLabelByName(sampleBoard, 'BUG');
      
      expect(label).toBeUndefined();
    });

    it('should handle board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      const label = getLabelByName(boardWithoutLabels, 'bug');
      
      expect(label).toBeUndefined();
    });

    it('should handle board with empty labels array', () => {
      const boardWithEmptyLabels = { ...sampleBoard, labels: [] };
      const label = getLabelByName(boardWithEmptyLabels, 'bug');
      
      expect(label).toBeUndefined();
    });
  });

  describe('addLabelToBoard', () => {
    it('should add label to board with existing labels', () => {
      const newLabel = { name: 'testing', color: 'green' };
      const updatedBoard = addLabelToBoard(sampleBoard, newLabel);
      
      expect(updatedBoard.labels).toHaveLength(4);
      expect(updatedBoard.labels![3]).toEqual(newLabel);
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should add label to board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      const newLabel = { name: 'testing', color: 'green' };
      const updatedBoard = addLabelToBoard(boardWithoutLabels, newLabel);
      
      expect(updatedBoard.labels).toHaveLength(1);
      expect(updatedBoard.labels![0]).toEqual(newLabel);
    });

    it('should add label to board with empty labels array', () => {
      const boardWithEmptyLabels = { ...sampleBoard, labels: [] };
      const newLabel = { name: 'testing', color: 'green' };
      const updatedBoard = addLabelToBoard(boardWithEmptyLabels, newLabel);
      
      expect(updatedBoard.labels).toHaveLength(1);
      expect(updatedBoard.labels![0]).toEqual(newLabel);
    });

    it('should throw error if label with same name exists', () => {
      const duplicateLabel = { name: 'bug', color: 'orange' };
      
      expect(() => addLabelToBoard(sampleBoard, duplicateLabel)).toThrow(
        'Label with name "bug" already exists'
      );
    });

    it('should not mutate original board', () => {
      const originalLabels = sampleBoard.labels ? [...sampleBoard.labels] : undefined;
      const newLabel = { name: 'testing', color: 'green' };
      addLabelToBoard(sampleBoard, newLabel);
      
      expect(sampleBoard.labels).toEqual(originalLabels);
    });
  });

  describe('updateLabelOnBoard', () => {
    it('should update existing label', () => {
      const updatedBoard = updateLabelOnBoard(sampleBoard, 'bug', { color: 'orange' });
      
      expect(updatedBoard.labels![0]).toEqual({ name: 'bug', color: 'orange' });
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should update label name', () => {
      const updatedBoard = updateLabelOnBoard(sampleBoard, 'bug', { name: 'defect' });
      
      expect(updatedBoard.labels![0]).toEqual({ name: 'defect', color: 'red' });
    });

    it('should preserve name when not provided in updates', () => {
      const updatedBoard = updateLabelOnBoard(sampleBoard, 'bug', { color: 'yellow' });
      
      expect(updatedBoard.labels![0].name).toBe('bug');
    });

    it('should throw error for non-existent label', () => {
      expect(() => updateLabelOnBoard(sampleBoard, 'nonexistent', { color: 'green' })).toThrow(
        'Label with name "nonexistent" not found'
      );
    });

    it('should handle board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      
      expect(() => updateLabelOnBoard(boardWithoutLabels, 'bug', { color: 'green' })).toThrow(
        'Label with name "bug" not found'
      );
    });

    it('should handle board with empty labels array', () => {
      const boardWithEmptyLabels = { ...sampleBoard, labels: [] };
      
      expect(() => updateLabelOnBoard(boardWithEmptyLabels, 'bug', { color: 'green' })).toThrow(
        'Label with name "bug" not found'
      );
    });

    it('should not mutate original board', () => {
      const originalLabels = sampleBoard.labels ? [...sampleBoard.labels] : undefined;
      updateLabelOnBoard(sampleBoard, 'bug', { color: 'orange' });
      
      expect(sampleBoard.labels).toEqual(originalLabels);
    });
  });

  describe('removeLabelFromBoard', () => {
    it('should remove existing label', () => {
      const updatedBoard = removeLabelFromBoard(sampleBoard, 'bug');
      
      expect(updatedBoard.labels).toHaveLength(2);
      expect(updatedBoard.labels!.find(label => label.name === 'bug')).toBeUndefined();
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should throw error for non-existent label', () => {
      expect(() => removeLabelFromBoard(sampleBoard, 'nonexistent')).toThrow(
        'Label with name "nonexistent" not found'
      );
    });

    it('should handle board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      
      expect(() => removeLabelFromBoard(boardWithoutLabels, 'bug')).toThrow(
        'Label with name "bug" not found'
      );
    });

    it('should handle board with empty labels array', () => {
      const boardWithEmptyLabels = { ...sampleBoard, labels: [] };
      
      expect(() => removeLabelFromBoard(boardWithEmptyLabels, 'bug')).toThrow(
        'Label with name "bug" not found'
      );
    });

    it('should not mutate original board', () => {
      const originalLabels = sampleBoard.labels ? [...sampleBoard.labels] : undefined;
      removeLabelFromBoard(sampleBoard, 'bug');
      
      expect(sampleBoard.labels).toEqual(originalLabels);
    });
  });

  describe('findLabels', () => {
    it('should find labels matching query', () => {
      const results = findLabels(sampleBoard, 'ur');
      
      expect(results).toHaveLength(2);
      expect(results.map(label => label.name)).toContain('feature');
      expect(results.map(label => label.name)).toContain('urgent');
    });

    it('should be case insensitive', () => {
      const results = findLabels(sampleBoard, 'BUG');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('bug');
    });

    it('should find exact matches', () => {
      const results = findLabels(sampleBoard, 'bug');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('bug');
    });

    it('should return empty array when no matches', () => {
      const results = findLabels(sampleBoard, 'nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should handle empty query', () => {
      const results = findLabels(sampleBoard, '');
      
      expect(results).toHaveLength(3); // All labels match empty query
    });

    it('should handle board without labels', () => {
      const boardWithoutLabels = { ...sampleBoard, labels: undefined };
      const results = findLabels(boardWithoutLabels, 'bug');
      
      expect(results).toEqual([]);
    });

    it('should handle board with empty labels array', () => {
      const boardWithEmptyLabels = { ...sampleBoard, labels: [] };
      const results = findLabels(boardWithEmptyLabels, 'bug');
      
      expect(results).toEqual([]);
    });

    it('should return partial matches', () => {
      const results = findLabels(sampleBoard, 'e');
      
      expect(results).toHaveLength(2); // 'feature' and 'urgent' both contain 'e'
      expect(results.map(label => label.name)).toContain('feature');
      expect(results.map(label => label.name)).toContain('urgent');
    });
  });
});
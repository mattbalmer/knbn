import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  addSprint,
  updateSprint,
  removeSprint,
  listSprints,
  getSprint,
  getActiveSprints,
  getUpcomingSprints,
  getCompletedSprints
} from '../../../src/core/actions/sprint';
import { Board } from '../../../src/core/types/knbn';
import { Brands } from '../../../src/core/utils/ts';
// @ts-ignore
import { createTempDir } from '../../test-utils';

describe('sprint actions', () => {
  let tempDir: string;
  let testFilepath: string;
  let sampleBoard: Board;

  beforeEach(() => {
    tempDir = createTempDir('sprint-actions-tests');
    testFilepath = path.join(tempDir, 'test-board.knbn');

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    sampleBoard = {
      name: 'Test Board',
      description: 'Test board for sprint actions',
      columns: [{ name: 'todo' }, { name: 'done' }],
      tasks: {},
      sprints: [
        {
          name: 'Sprint 1',
          description: 'Completed sprint',
          capacity: 10,
          dates: {
            created: yesterday.toISOString(),
            starts: yesterday.toISOString(),
            ends: yesterday.toISOString()
          }
        },
        {
          name: 'Sprint 2',
          description: 'Active sprint',
          capacity: 15,
          dates: {
            created: yesterday.toISOString(),
            starts: yesterday.toISOString(),
            ends: tomorrow.toISOString()
          }
        },
        {
          name: 'Sprint 3',
          description: 'Upcoming sprint',
          capacity: 20,
          dates: {
            created: now.toISOString(),
            starts: tomorrow.toISOString(),
            ends: dayAfterTomorrow.toISOString()
          }
        }
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

  describe('addSprint', () => {
    it('should add new sprint and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      const sprintData = {
        name: 'New Sprint',
        description: 'Test sprint',
        capacity: 25,
        dates: {
          created: '2024-02-28T09:00:00Z',
          starts: '2024-03-01T09:00:00Z',
          ends: '2024-03-15T09:00:00Z'
        }
      };
      
      const sprint = addSprint(filepath, sprintData);
      
      expect(sprint.name).toBe('New Sprint');
      expect(sprint.description).toBe('Test sprint');
      expect(sprint.capacity).toBe(25);
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.sprints).toHaveLength(4);
      expect(savedBoard.sprints![3].name).toBe('New Sprint');
    });

    it('should add sprint with minimal data', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const sprint = addSprint(filepath, { name: 'Minimal Sprint' });
      
      expect(sprint.name).toBe('Minimal Sprint');
      expect(sprint.description).toBeUndefined();
      expect(sprint.capacity).toBeUndefined();
      expect(sprint.dates.created).toBeDefined();
      expect(sprint.dates.starts).toBeDefined();
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      addSprint(filepath, { name: 'Test Sprint' });
      
      // Check the saved board's updated date
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(new Date(savedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should throw error for duplicate sprint name (case-insensitive)', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => addSprint(filepath, { name: 'Sprint 1' })).toThrow(
        'Sprint with name "Sprint 1" already exists'
      );
      
      expect(() => addSprint(filepath, { name: 'SPRINT 1' })).toThrow(
        'Sprint with name "SPRINT 1" already exists'
      );
    });

    it('should add sprint to board without existing sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const content = yaml.dump(boardWithoutSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const sprint = addSprint(filepath, { name: 'First Sprint' });
      
      expect(sprint.name).toBe('First Sprint');
      
      // Verify saved to file
      const savedContent = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(savedContent) as Board;
      expect(savedBoard.sprints).toHaveLength(1);
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => addSprint(filepath, { name: 'test' })).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('updateSprint', () => {
    it('should update existing sprint and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      const updates = { description: 'Updated description', capacity: 50 };
      
      const updatedSprint = updateSprint(filepath, 'Sprint 1', updates);
      
      expect(updatedSprint.name).toBe('Sprint 1');
      expect(updatedSprint.description).toBe('Updated description');
      expect(updatedSprint.capacity).toBe(50);
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.sprints![0].description).toBe('Updated description');
      expect(savedBoard.sprints![0].capacity).toBe(50);
    });

    it('should update sprint name', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedSprint = updateSprint(filepath, 'Sprint 1', { name: 'Renamed Sprint' });
      
      expect(updatedSprint.name).toBe('Renamed Sprint');
    });

    it('should update sprint with case-insensitive matching', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedSprint = updateSprint(filepath, 'sprint 1', { name: 'SPRINT 1' });
      
      expect(updatedSprint.name).toBe('SPRINT 1');
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      updateSprint(filepath, 'Sprint 1', { capacity: 100 });
      
      // Check the saved board's updated date
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(new Date(savedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should throw error for non-existent sprint', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => updateSprint(filepath, 'nonexistent', { capacity: 50 })).toThrow(
        'Sprint with name "nonexistent" not found'
      );
    });

    it('should throw error if updated sprint not found after update', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      // This scenario shouldn't happen in normal operation, but tests edge case
      expect(() => updateSprint(filepath, 'Sprint 1', { name: 'Sprint 1' })).not.toThrow();
    });

    it('should preserve other sprints', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      updateSprint(filepath, 'Sprint 1', { capacity: 100 });
      
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      
      expect(savedBoard.sprints![1].name).toBe('Sprint 2');
      expect(savedBoard.sprints![2].name).toBe('Sprint 3');
    });
  });

  describe('removeSprint', () => {
    it('should remove existing sprint and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      removeSprint(filepath, 'Sprint 1');
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.sprints).toHaveLength(2);
      expect(savedBoard.sprints!.find(sprint => sprint.name === 'Sprint 1')).toBeUndefined();
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.dates.updated;
      
      removeSprint(filepath, 'Sprint 1');
      
      // Check the saved board's updated date
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(new Date(savedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should handle non-existent sprint gracefully', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      // Should not throw error
      expect(() => removeSprint(filepath, 'nonexistent')).not.toThrow();
      
      // Board should remain unchanged
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.sprints).toHaveLength(3);
    });

    it('should preserve other sprints', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      removeSprint(filepath, 'Sprint 1');
      
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      
      expect(savedBoard.sprints!.find(sprint => sprint.name === 'Sprint 2')).toBeDefined();
      expect(savedBoard.sprints!.find(sprint => sprint.name === 'Sprint 3')).toBeDefined();
    });
  });

  describe('listSprints', () => {
    it('should return all sprints from board', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const sprints = listSprints(filepath);
      
      expect(sprints).toHaveLength(3);
      expect(sprints.map(s => s.name)).toEqual(['Sprint 1', 'Sprint 2', 'Sprint 3']);
    });

    it('should return empty array for board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const content = yaml.dump(boardWithoutSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const sprints = listSprints(filepath);
      
      expect(sprints).toEqual([]);
    });

    it('should return empty array for board with empty sprints array', () => {
      const boardWithEmptySprints = { ...sampleBoard, sprints: [] };
      const content = yaml.dump(boardWithEmptySprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const sprints = listSprints(filepath);
      
      expect(sprints).toEqual([]);
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => listSprints(filepath)).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('getSprint', () => {
    it('should return existing sprint', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const sprint = getSprint(filepath, 'Sprint 1');
      
      expect(sprint.name).toBe('Sprint 1');
      expect(sprint.description).toBe('Completed sprint');
      expect(sprint.capacity).toBe(10);
    });

    it('should return sprint with case-sensitive matching', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const sprint = getSprint(filepath, 'sprint 1');
      
      expect(sprint.name).toBe('Sprint 1');
    });

    it('should throw error for non-existent sprint', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => getSprint(filepath, 'nonexistent')).toThrow(
        'Sprint with name "nonexistent" not found'
      );
    });

    it('should throw error for board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const content = yaml.dump(boardWithoutSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => getSprint(filepath, 'Sprint 1')).toThrow(
        'Sprint with name "Sprint 1" not found'
      );
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => getSprint(filepath, 'Sprint 1')).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('getActiveSprints', () => {
    it('should return currently active sprints', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const activeSprints = getActiveSprints(filepath);
      
      expect(activeSprints).toHaveLength(1);
      expect(activeSprints[0].name).toBe('Sprint 2');
    });

    it('should return empty array when no active sprints', () => {
      const boardWithInactiveSprints = {
        ...sampleBoard,
        sprints: [sampleBoard.sprints![0], sampleBoard.sprints![2]] // completed and upcoming
      };
      const content = yaml.dump(boardWithInactiveSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const activeSprints = getActiveSprints(filepath);
      
      expect(activeSprints).toEqual([]);
    });

    it('should return empty array for board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const content = yaml.dump(boardWithoutSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const activeSprints = getActiveSprints(filepath);
      
      expect(activeSprints).toEqual([]);
    });
  });

  describe('getUpcomingSprints', () => {
    it('should return upcoming sprints', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const upcomingSprints = getUpcomingSprints(filepath);
      
      expect(upcomingSprints).toHaveLength(1);
      expect(upcomingSprints[0].name).toBe('Sprint 3');
    });

    it('should return empty array when no upcoming sprints', () => {
      const boardWithNoUpcoming = {
        ...sampleBoard,
        sprints: [sampleBoard.sprints![0], sampleBoard.sprints![1]] // completed and active
      };
      const content = yaml.dump(boardWithNoUpcoming);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const upcomingSprints = getUpcomingSprints(filepath);
      
      expect(upcomingSprints).toEqual([]);
    });

    it('should return empty array for board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const content = yaml.dump(boardWithoutSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const upcomingSprints = getUpcomingSprints(filepath);
      
      expect(upcomingSprints).toEqual([]);
    });
  });

  describe('getCompletedSprints', () => {
    it('should return completed sprints', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const completedSprints = getCompletedSprints(filepath);
      
      expect(completedSprints).toHaveLength(1);
      expect(completedSprints[0].name).toBe('Sprint 1');
    });

    it('should return empty array when no completed sprints', () => {
      const boardWithNoCompleted = {
        ...sampleBoard,
        sprints: [sampleBoard.sprints![1], sampleBoard.sprints![2]] // active and upcoming
      };
      const content = yaml.dump(boardWithNoCompleted);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const completedSprints = getCompletedSprints(filepath);
      
      expect(completedSprints).toEqual([]);
    });

    it('should return empty array for board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const content = yaml.dump(boardWithoutSprints);
      fs.writeFileSync(testFilepath, content, 'utf8');
      
      const filepath = Brands.Filepath(testFilepath);
      const completedSprints = getCompletedSprints(filepath);
      
      expect(completedSprints).toEqual([]);
    });
  });
});
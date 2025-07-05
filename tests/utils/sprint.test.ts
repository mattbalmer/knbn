import {
  createSprint,
  getSprintByName,
  addSprintToBoard,
  updateSprintOnBoard,
  removeSprintFromBoard,
  getActiveSprints,
  getUpcomingSprints,
  getCompletedSprints
} from '../../src/utils/sprint';
import { Board } from '../../src/types/knbn';

describe('sprint utils', () => {
  let sampleBoard: Board;

  beforeEach(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    sampleBoard = {
      name: 'Test Board',
      description: 'Test board',
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
      metadata: { nextId: 1, version: '0.2' },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T09:00:00Z',
        saved: '2024-01-01T09:00:00Z'
      }
    };
  });

  describe('createSprint', () => {
    // TODO: Dont accept created date (here and elsewhere)
    it('should create a sprint with all properties', () => {
      const sprintData = {
        name: 'Test Sprint',
        description: 'Test description',
        capacity: 10,
        dates: {
          created: '2024-01-01T10:00:00Z',
          starts: '2024-01-01T10:00:00Z',
          ends: '2024-01-15T10:00:00Z'
        }
      };

      const sprint = createSprint(sprintData);
      
      expect(sprint).toEqual(sprintData);
    });

    it('should create a sprint with default values', () => {
      const sprint = createSprint({ name: 'Minimal Sprint' });
      
      expect(sprint.name).toBe('Minimal Sprint');
      expect(sprint.description).toBeUndefined();
      expect(sprint.capacity).toBeUndefined();
      expect(sprint.dates.created).toBeDefined();
      expect(sprint.dates.starts).toBeDefined();
      expect(sprint.dates.ends).toBeUndefined();
    });

    it('should use current time for dates when not provided', () => {
      const before = new Date().getTime();
      const sprint = createSprint({ name: 'Time Test' });
      const after = new Date().getTime();
      
      const createdTime = new Date(sprint.dates.created).getTime();
      const startsTime = new Date(sprint.dates.starts).getTime();
      
      expect(createdTime).toBeGreaterThanOrEqual(before);
      expect(createdTime).toBeLessThanOrEqual(after);
      expect(startsTime).toBeGreaterThanOrEqual(before);
      expect(startsTime).toBeLessThanOrEqual(after);
    });

    it('should preserve provided dates', () => {
      const customDates = {
        created: '2024-01-01T10:00:00Z',
        starts: '2024-01-02T10:00:00Z',
        ends: '2024-01-15T10:00:00Z'
      };

      const sprint = createSprint({ 
        name: 'Custom Dates', 
        dates: customDates 
      });
      
      expect(sprint.dates).toEqual(customDates);
    });
  });

  describe('getSprintByName', () => {
    it('should find existing sprint', () => {
      const sprint = getSprintByName(sampleBoard, 'Sprint 1');
      
      expect(sprint?.name).toBe('Sprint 1');
      expect(sprint?.description).toBe('Completed sprint');
    });

    it('should return undefined for non-existent sprint', () => {
      const sprint = getSprintByName(sampleBoard, 'nonexistent');
      
      expect(sprint).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const sprint = getSprintByName(sampleBoard, 'sprint 1');

      expect(sprint?.name).toBe('Sprint 1');
    });

    it('should handle board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const sprint = getSprintByName(boardWithoutSprints, 'Sprint 1');
      
      expect(sprint).toBeUndefined();
    });

    it('should handle board with empty sprints array', () => {
      const boardWithEmptySprints = { ...sampleBoard, sprints: [] };
      const sprint = getSprintByName(boardWithEmptySprints, 'Sprint 1');
      
      expect(sprint).toBeUndefined();
    });
  });

  describe('addSprintToBoard', () => {
    it('should add sprint to board with existing sprints', () => {
      const newSprint = createSprint({ name: 'New Sprint', capacity: 25 });
      const updatedBoard = addSprintToBoard(sampleBoard, newSprint);
      
      expect(updatedBoard.sprints).toHaveLength(4);
      expect(updatedBoard.sprints![3]).toEqual(newSprint);
    });

    it('should add sprint to board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const newSprint = createSprint({ name: 'First Sprint' });
      const updatedBoard = addSprintToBoard(boardWithoutSprints, newSprint);
      
      expect(updatedBoard.sprints).toHaveLength(1);
      expect(updatedBoard.sprints![0]).toEqual(newSprint);
    });

    it('should add sprint to board with empty sprints array', () => {
      const boardWithEmptySprints = { ...sampleBoard, sprints: [] };
      const newSprint = createSprint({ name: 'First Sprint' });
      const updatedBoard = addSprintToBoard(boardWithEmptySprints, newSprint);
      
      expect(updatedBoard.sprints).toHaveLength(1);
      expect(updatedBoard.sprints![0]).toEqual(newSprint);
    });

    it('should throw error if sprint with same name exists', () => {
      const duplicateSprint = createSprint({ name: 'Sprint 1' });
      
      expect(() => addSprintToBoard(sampleBoard, duplicateSprint)).toThrow(
        'Sprint with name "Sprint 1" already exists'
      );
    });

    it('should throw error if sprint with same name exists (case insensitive)', () => {
      const duplicateSprint = createSprint({ name: 'SPRINT 1' });

      expect(() => addSprintToBoard(sampleBoard, duplicateSprint)).toThrow(
        'Sprint with name "SPRINT 1" already exists'
      );
    });

    it('should not mutate original board', () => {
      const originalSprints = sampleBoard.sprints ? [...sampleBoard.sprints] : undefined;
      const newSprint = createSprint({ name: 'New Sprint' });
      addSprintToBoard(sampleBoard, newSprint);
      
      expect(sampleBoard.sprints).toEqual(originalSprints);
    });
  });

  describe('updateSprintOnBoard', () => {
    it('should update existing sprint', () => {
      const updates = { description: 'Updated description', capacity: 50 };
      const updatedBoard = updateSprintOnBoard(sampleBoard, 'Sprint 1', updates);
      
      expect(updatedBoard.sprints![0].description).toBe('Updated description');
      expect(updatedBoard.sprints![0].capacity).toBe(50);
      expect(updatedBoard.sprints![0].name).toBe('Sprint 1'); // preserved
    });

    it('should update sprint name', () => {
      const updatedBoard = updateSprintOnBoard(sampleBoard, 'Sprint 1', { name: 'Renamed Sprint' });
      
      expect(updatedBoard.sprints![0].name).toBe('Renamed Sprint');
    });

    it('should update sprint name with new case', () => {
      const updatedBoard = updateSprintOnBoard(sampleBoard, 'sprint 1', { name: 'SPRINT 1' });

      expect(updatedBoard.sprints![0].name).toBe('SPRINT 1');
    });

    it('should update sprint dates', () => {
      const newEndDate = '2024-12-31T23:59:59Z';
      const updatedBoard = updateSprintOnBoard(sampleBoard, 'Sprint 1', { 
        dates: { 
          created: sampleBoard.sprints![0].dates.created,
          starts: sampleBoard.sprints![0].dates.starts,
          ends: newEndDate 
        }
      });
      
      expect(updatedBoard.sprints![0].dates.ends).toBe(newEndDate);
      // Other dates should be preserved
      expect(updatedBoard.sprints![0].dates.created).toBe(sampleBoard.sprints![0].dates.created);
      expect(updatedBoard.sprints![0].dates.starts).toBe(sampleBoard.sprints![0].dates.starts);
    });

    it('should preserve name when not provided in updates', () => {
      const updatedBoard = updateSprintOnBoard(sampleBoard, 'Sprint 1', { capacity: 100 });
      
      expect(updatedBoard.sprints![0].name).toBe('Sprint 1');
    });

    it('should throw error for non-existent sprint', () => {
      expect(() => updateSprintOnBoard(sampleBoard, 'nonexistent', { capacity: 50 })).toThrow(
        'Sprint with name "nonexistent" not found'
      );
    });

    it('should handle board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      
      expect(() => updateSprintOnBoard(boardWithoutSprints, 'Sprint 1', { capacity: 50 })).toThrow(
        'Sprint with name "Sprint 1" not found'
      );
    });

    it('should not mutate original board', () => {
      const originalSprints = sampleBoard.sprints ? [...sampleBoard.sprints] : undefined;
      updateSprintOnBoard(sampleBoard, 'Sprint 1', { capacity: 100 });
      
      expect(sampleBoard.sprints).toEqual(originalSprints);
    });
  });

  describe('removeSprintFromBoard', () => {
    it('should remove existing sprint', () => {
      const updatedBoard = removeSprintFromBoard(sampleBoard, 'Sprint 1');

      expect(updatedBoard.sprints).toHaveLength(2);
      expect(updatedBoard.sprints!.find(sprint => sprint.name === 'Sprint 1')).toBeUndefined();
    });

    it('should pass original board for non-existent sprint', () => {
      const updatedBoard = removeSprintFromBoard(sampleBoard, 'nonexistent');

      expect(updatedBoard).toEqual(sampleBoard);
    });

    it('should handle board without sprints', () => {
      const updatedBoard = removeSprintFromBoard(sampleBoard, 'nonexistent');

      expect(updatedBoard).toEqual(sampleBoard);
    });

    it('should handle board with empty sprints array', () => {
      const updatedBoard = removeSprintFromBoard(sampleBoard, 'nonexistent');

      expect(updatedBoard).toEqual(sampleBoard);
    });

    it('should not mutate original board', () => {
      const originalSprints = sampleBoard.sprints ? [...sampleBoard.sprints] : undefined;
      removeSprintFromBoard(sampleBoard, 'Sprint 1');

      expect(sampleBoard.sprints).toEqual(originalSprints);
    });
  });

  describe('getActiveSprints', () => {
    it('should return currently active sprints', () => {
      const activeSprints = getActiveSprints(sampleBoard);
      
      expect(activeSprints).toHaveLength(1);
      expect(activeSprints[0].name).toBe('Sprint 2');
    });

    it('should return empty array when no active sprints', () => {
      const boardWithInactiveSprints = {
        ...sampleBoard,
        sprints: [sampleBoard.sprints![0], sampleBoard.sprints![2]] // completed and upcoming
      };
      const activeSprints = getActiveSprints(boardWithInactiveSprints);
      
      expect(activeSprints).toEqual([]);
    });

    it('should handle board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const activeSprints = getActiveSprints(boardWithoutSprints);
      
      expect(activeSprints).toEqual([]);
    });

    it('should handle sprints without end dates as active', () => {
      const openEndedSprint = {
        name: 'Open Sprint',
        description: 'No end date',
        dates: {
          created: new Date().toISOString(),
          starts: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // started yesterday
        }
      };
      
      const boardWithOpenSprint = {
        ...sampleBoard,
        sprints: [openEndedSprint]
      };
      
      const activeSprints = getActiveSprints(boardWithOpenSprint);
      
      expect(activeSprints).toHaveLength(1);
      expect(activeSprints[0].name).toBe('Open Sprint');
    });
  });

  describe('getUpcomingSprints', () => {
    it('should return upcoming sprints', () => {
      const upcomingSprints = getUpcomingSprints(sampleBoard);
      
      expect(upcomingSprints).toHaveLength(1);
      expect(upcomingSprints[0].name).toBe('Sprint 3');
    });

    it('should return empty array when no upcoming sprints', () => {
      const boardWithNoUpcoming = {
        ...sampleBoard,
        sprints: [sampleBoard.sprints![0], sampleBoard.sprints![1]] // completed and active
      };
      const upcomingSprints = getUpcomingSprints(boardWithNoUpcoming);
      
      expect(upcomingSprints).toEqual([]);
    });

    it('should handle board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const upcomingSprints = getUpcomingSprints(boardWithoutSprints);
      
      expect(upcomingSprints).toEqual([]);
    });
  });

  describe('getCompletedSprints', () => {
    it('should return completed sprints', () => {
      const completedSprints = getCompletedSprints(sampleBoard);
      
      expect(completedSprints).toHaveLength(1);
      expect(completedSprints[0].name).toBe('Sprint 1');
    });

    it('should return empty array when no completed sprints', () => {
      const boardWithNoCompleted = {
        ...sampleBoard,
        sprints: [sampleBoard.sprints![1], sampleBoard.sprints![2]] // active and upcoming
      };
      const completedSprints = getCompletedSprints(boardWithNoCompleted);
      
      expect(completedSprints).toEqual([]);
    });

    it('should handle board without sprints', () => {
      const boardWithoutSprints = { ...sampleBoard, sprints: undefined };
      const completedSprints = getCompletedSprints(boardWithoutSprints);
      
      expect(completedSprints).toEqual([]);
    });

    it('should not consider sprints without end dates as completed', () => {
      const openEndedSprint = {
        name: 'Open Sprint',
        description: 'No end date',
        dates: {
          created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // created 2 days ago
          starts: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // started yesterday
        }
      };
      
      const boardWithOpenSprint = {
        ...sampleBoard,
        sprints: [openEndedSprint]
      };
      
      const completedSprints = getCompletedSprints(boardWithOpenSprint);
      
      expect(completedSprints).toEqual([]);
    });
  });
});
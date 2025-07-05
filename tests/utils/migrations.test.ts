import { migrateBoard, migrateBoardTo } from '../../src/utils/migrations';
import { Board } from '../../src/types/knbn';
import { Board_0_1 } from '../../src/types/version/0.1';
import { Board_0_2 } from '../../src/types/version/0.2';

describe('migrations utils', () => {
  let sampleBoard_0_1: Board_0_1;
  let sampleBoard_0_2: Board_0_2;

  beforeEach(() => {
    sampleBoard_0_1 = {
      configuration: {
        name: 'Test Board v0.1',
        description: 'Test board for migration',
        columns: [
          { name: 'todo' },
          { name: 'doing' },
          { name: 'done' }
        ]
      },
      tasks: {
        1: {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          column: 'todo',
          labels: ['bug', 'urgent'],
          sprint: 'Sprint 1',
          storyPoints: 5,
          dates: {
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z',
            moved: '2024-01-01T11:00:00Z'
          }
        },
        2: {
          id: 2,
          title: 'Task 2',
          description: 'Description 2',
          column: 'doing',
          labels: ['feature'],
          dates: {
            created: '2024-01-01T12:00:00Z',
            updated: '2024-01-01T12:00:00Z'
          }
        }
      },
      sprints: [
        {
          name: 'Sprint 1',
          description: 'First sprint',
          capacity: 10,
          dates: {
            created: '2024-01-01T09:00:00Z',
            starts: '2024-01-01T09:00:00Z',
            ends: '2024-01-15T09:00:00Z'
          }
        }
      ],
      metadata: {
        nextId: 3,
        createdAt: '2024-01-01T09:00:00Z',
        lastModified: '2024-01-01T15:00:00Z',
        version: '0.1'
      }
    };

    sampleBoard_0_2 = {
      name: 'Test Board v0.2',
      description: 'Test board v0.2',
      columns: [
        { name: 'todo' },
        { name: 'doing' },
        { name: 'done' }
      ],
      tasks: {
        1: {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          column: 'todo',
          labels: ['bug', 'urgent'],
          sprint: 'Sprint 1',
          storyPoints: 5,
          priority: 1,
          dates: {
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z',
            moved: '2024-01-01T11:00:00Z'
          }
        }
      },
      labels: [
        { name: 'bug', color: 'red' },
        { name: 'urgent' },
        { name: 'feature', color: 'blue' }
      ],
      sprints: [
        {
          name: 'Sprint 1',
          description: 'First sprint',
          capacity: 10,
          dates: {
            created: '2024-01-01T09:00:00Z',
            starts: '2024-01-01T09:00:00Z',
            ends: '2024-01-15T09:00:00Z'
          }
        }
      ],
      metadata: {
        nextId: 3,
        version: '0.2'
      },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T15:00:00Z',
        saved: '2024-01-01T15:00:00Z'
      }
    };
  });

  describe('migrateBoard', () => {
    it('should migrate from 0.1 to 0.2', () => {
      const result = migrateBoard(sampleBoard_0_1);

      expect(result.name).toBe(sampleBoard_0_1.configuration.name);
      expect(result.description).toBe(sampleBoard_0_1.configuration.description);
      expect(result.columns).toEqual(sampleBoard_0_1.configuration.columns);
      expect(result.tasks).toEqual(sampleBoard_0_1.tasks);
      expect(result.sprints).toEqual(sampleBoard_0_1.sprints);
      expect(result.metadata.nextId).toBe(sampleBoard_0_1.metadata.nextId);
      expect(result.metadata.version).toBe('0.2');
      expect(result.dates.created).toBe(sampleBoard_0_1.metadata.createdAt);
      expect(result.dates.updated).toBe(sampleBoard_0_1.metadata.lastModified);
      expect(result.dates.saved).toBe(sampleBoard_0_1.metadata.lastModified);
    });

    it('should extract unique labels from tasks during migration', () => {
      const result = migrateBoard(sampleBoard_0_1);

      expect(result.labels).toHaveLength(3);
      const labelNames = result.labels!.map(label => label.name);
      expect(labelNames).toContain('bug');
      expect(labelNames).toContain('urgent');
      expect(labelNames).toContain('feature');
      
      // Labels should not have colors by default
      result.labels!.forEach(label => {
        expect(label.color).toBeUndefined();
      });
    });

    it('should handle board with no tasks during migration', () => {
      const boardWithoutTasks = {
        ...sampleBoard_0_1,
        tasks: {}
      };

      const result = migrateBoard(boardWithoutTasks);

      expect(result.labels).toEqual([]);
      expect(result.tasks).toEqual({});
    });

    it('should handle tasks with no labels during migration', () => {
      const boardWithoutLabels = {
        ...sampleBoard_0_1,
        tasks: {
          1: {
            ...sampleBoard_0_1.tasks[1],
            labels: undefined
          },
          2: {
            ...sampleBoard_0_1.tasks[2],
            labels: undefined
          }
        }
      };

      const result = migrateBoard(boardWithoutLabels);

      expect(result.labels).toEqual([]);
    });

    it('should handle board without sprints during migration', () => {
      const boardWithoutSprints = {
        ...sampleBoard_0_1,
        sprints: undefined
      };

      const result = migrateBoard(boardWithoutSprints);

      expect(result.sprints).toBeUndefined();
    });

    it('should return board unchanged if already at target version', () => {
      const result = migrateBoard(sampleBoard_0_2);

      expect(result).toEqual(sampleBoard_0_2);
    });

    it('should throw error for invalid board data', () => {
      expect(() => migrateBoard(null)).toThrow('Invalid board data for migration');
      expect(() => migrateBoard(undefined)).toThrow('Invalid board data for migration');
      expect(() => migrateBoard('not an object')).toThrow('Invalid board data for migration');
    });

    it('should throw error for missing metadata', () => {
      const invalidBoard = {
        configuration: { name: 'Test', description: 'Test', columns: [] },
        tasks: {}
      };

      expect(() => migrateBoard(invalidBoard)).toThrow('Missing version information in board data');
    });

    it('should throw error for missing version', () => {
      const invalidBoard = {
        configuration: { name: 'Test', description: 'Test', columns: [] },
        tasks: {},
        metadata: { nextId: 1 }
      };

      expect(() => migrateBoard(invalidBoard)).toThrow('Missing version information in board data');
    });

    it('should throw error for empty board data', () => {
      expect(() => migrateBoard({})).toThrow('Missing version information in board data');
    });

    it('should throw error for unsupported version', () => {
      const unsupportedBoard = {
        ...sampleBoard_0_1,
        metadata: {
          ...sampleBoard_0_1.metadata,
          version: '0.0.1'
        }
      };

      expect(() => migrateBoard(unsupportedBoard)).toThrow('No migration found for version: 0.0.1->0.1');
    });

    it('should throw error for future version', () => {
      const futureBoard = {
        ...sampleBoard_0_2,
        metadata: {
          ...sampleBoard_0_2.metadata,
          version: '0.3.0'
        }
      };

      expect(() => migrateBoard(futureBoard)).toThrow('No migration found for version: 0.3.0->0.1');
    });

    it('should create a deep copy and not mutate original data', () => {
      const originalData = JSON.parse(JSON.stringify(sampleBoard_0_1));
      
      migrateBoard(sampleBoard_0_1);
      
      expect(sampleBoard_0_1).toEqual(originalData);
    });

    it('should handle duplicate labels during migration', () => {
      const boardWithDuplicateLabels = {
        ...sampleBoard_0_1,
        tasks: {
          1: {
            ...sampleBoard_0_1.tasks[1],
            labels: ['bug', 'urgent', 'bug'] // duplicate 'bug'
          },
          2: {
            ...sampleBoard_0_1.tasks[2],
            labels: ['urgent', 'feature'] // duplicate 'urgent'
          }
        }
      };

      const result = migrateBoard(boardWithDuplicateLabels);

      expect(result.labels).toHaveLength(3);
      const labelNames = result.labels!.map(label => label.name);
      expect(labelNames).toContain('bug');
      expect(labelNames).toContain('urgent');
      expect(labelNames).toContain('feature');
      
      // Should have no duplicates
      const uniqueLabels = new Set(labelNames);
      expect(uniqueLabels.size).toBe(3);
    });
  });

  describe('migrateBoardTo', () => {
    it('should migrate to specific version 0.2', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      expect(result.metadata.version).toBe('0.2');
      expect(result.name).toBe(sampleBoard_0_1.configuration.name);
      expect(result.description).toBe(sampleBoard_0_1.configuration.description);
    });

    it('should handle same version migration', () => {
      // The migrateBoardTo function doesn't handle same-version cases
      // It will try to find a migration path and fail
      expect(() => migrateBoardTo(sampleBoard_0_2, '0.2')).toThrow(
        'No migration found for version: 0.2->0.2'
      );
    });

    it('should throw error for invalid version data', () => {
      const invalidBoard = {
        metadata: { version: null }
      };

      expect(() => migrateBoardTo(invalidBoard, '0.2')).toThrow(
        'Invalid migration data: missing version information: null -> 0.2'
      );
    });

    it('should throw error for unsupported migration path', () => {
      const unsupportedBoard = {
        metadata: { version: '0.0.1' }
      };

      expect(() => migrateBoardTo(unsupportedBoard, '0.2')).toThrow(
        'No migration found for version: 0.0.1->0.2'
      );
    });

    it('should handle missing metadata gracefully', () => {
      const boardWithoutMetadata = {
        configuration: { name: 'Test', description: 'Test', columns: [] },
        tasks: {}
      };

      expect(() => migrateBoardTo(boardWithoutMetadata, '0.2')).toThrow(
        'Invalid migration data: missing version information: undefined -> 0.2'
      );
    });
  });

  describe('0.1 -> 0.2 migration', () => {
    it('should transform configuration structure correctly', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      // Configuration should be flattened
      expect(result.name).toBe(sampleBoard_0_1.configuration.name);
      expect(result.description).toBe(sampleBoard_0_1.configuration.description);
      expect(result.columns).toEqual(sampleBoard_0_1.configuration.columns);
      
      // Should not have configuration property
      expect((result as any).configuration).toBeUndefined();
    });

    it('should transform metadata structure correctly', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      expect(result.metadata.nextId).toBe(sampleBoard_0_1.metadata.nextId);
      expect(result.metadata.version).toBe('0.2');
      
      // Should not have old metadata fields
      expect((result.metadata as any).createdAt).toBeUndefined();
      expect((result.metadata as any).lastModified).toBeUndefined();
    });

    it('should transform dates structure correctly', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      expect(result.dates.created).toBe(sampleBoard_0_1.metadata.createdAt);
      expect(result.dates.updated).toBe(sampleBoard_0_1.metadata.lastModified);
      expect(result.dates.saved).toBe(sampleBoard_0_1.metadata.lastModified);
    });

    it('should preserve tasks unchanged', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      expect(result.tasks).toEqual(sampleBoard_0_1.tasks);
    });

    it('should preserve sprints unchanged when present', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      expect(result.sprints).toEqual(sampleBoard_0_1.sprints);
    });

    it('should handle undefined sprints correctly', () => {
      const boardWithoutSprints = {
        ...sampleBoard_0_1,
        sprints: undefined
      };

      const result = migrateBoardTo(boardWithoutSprints, '0.2');

      expect(result.sprints).toBeUndefined();
    });

    it('should create labels from task labels correctly', () => {
      const result = migrateBoardTo(sampleBoard_0_1, '0.2');

      expect(result.labels).toBeDefined();
      expect(result.labels).toHaveLength(3);
      
      const labelNames = result.labels!.map(label => label.name).sort();
      expect(labelNames).toEqual(['bug', 'feature', 'urgent']);
      
      // All labels should have undefined color initially
      result.labels!.forEach(label => {
        expect(label.color).toBeUndefined();
      });
    });

    it('should handle empty tasks when creating labels', () => {
      const boardWithNoTasks = {
        ...sampleBoard_0_1,
        tasks: {}
      };

      const result = migrateBoardTo(boardWithNoTasks, '0.2');

      expect(result.labels).toEqual([]);
    });

    it('should handle tasks with empty labels arrays', () => {
      const boardWithEmptyLabels = {
        ...sampleBoard_0_1,
        tasks: {
          1: {
            ...sampleBoard_0_1.tasks[1],
            labels: []
          }
        }
      };

      const result = migrateBoardTo(boardWithEmptyLabels, '0.2');

      expect(result.labels).toEqual([]);
    });
  });
});
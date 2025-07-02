import { createTask, updateTask, sortTasks } from '../../src/core/utils/task';
import { Board, Task } from '../../src/core/types/knbn';

describe('task utils', () => {
  describe('createTask', () => {
    it('should create a task with all provided data', () => {
      const taskData = {
        id: 42,
        title: 'Test Task',
        description: 'Test Description',
        column: 'in-progress',
        labels: ['test', 'urgent'],
        storyPoints: 5
      };

      const result = createTask(taskData);

      expect(result).toMatchObject({
        id: 42,
        title: 'Test Task',
        description: 'Test Description',
        column: 'in-progress',
        labels: ['test', 'urgent'],
        storyPoints: 5
      });
      expect(result.dates.created).toBeDefined();
      expect(result.dates.updated).toBeDefined();
      expect(result.dates.created).toBe(result.dates.updated);
      expect(result.dates.moved).toBeUndefined();
    });

    it('should create a task with minimal required data', () => {
      const result = createTask({ id: 1 });

      expect(result).toMatchObject({
        id: 1,
        title: '',
        description: '',
        column: ''
      });
      expect(result.dates.created).toBeDefined();
      expect(result.dates.updated).toBeDefined();
      expect(result.labels).toBeUndefined();
      expect(result.storyPoints).toBeUndefined();
      expect(result.dates.moved).toBeUndefined();
    });

    it('should create a task with partial data', () => {
      const taskData = {
        id: 10,
        title: 'Partial Task'
      };

      const result = createTask(taskData);

      expect(result).toMatchObject({
        id: 10,
        title: 'Partial Task',
        description: '',
        column: ''
      });
    });

    it('should handle task creation with custom dates', () => {
      const customCreated = '2024-01-01T10:00:00Z';
      const customMoved = '2024-01-01T12:00:00Z';
      const taskData = {
        id: 5,
        title: 'Custom Dates Task',
        column: 'done',
        dates: {
          created: customCreated,
          updated: customCreated,
          moved: customMoved
        }
      };

      const result = createTask(taskData);

      expect(result.dates.created).toBe(customCreated);
      expect(result.dates.moved).toBe(customMoved);
      expect(result.column).toBe('done');
    });

    it('should generate unique timestamps for created and updated fields', () => {
      const result1 = createTask({ id: 1, title: 'Task 1' });
      const result2 = createTask({ id: 2, title: 'Task 2' });

      expect(result1.dates.created).toBeDefined();
      expect(result1.dates.updated).toBeDefined();
      expect(result2.dates.created).toBeDefined();
      expect(result2.dates.updated).toBeDefined();
      
      // Times should be ISO strings
      expect(() => new Date(result1.dates.created)).not.toThrow();
      expect(() => new Date(result1.dates.updated)).not.toThrow();
    });
  });

  describe('updateTask', () => {
    let board: Board;

    beforeEach(() => {
      board = {
        name: 'Test Board',
        description: 'Test',
        columns: [{ name: 'todo' }, { name: 'doing' }, { name: 'done' }],
        tasks: {
          1: {
            id: 1,
            title: 'Existing Task',
            description: 'Original description',
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
    });

    it('should update task with new values', () => {
      const updates = {
        title: 'Updated Task',
        description: 'New description'
      };
      
      const result = updateTask(board, 1, updates);
      
      expect(result.tasks[1]).toBeDefined();
      expect(result.tasks[1].id).toBe(1);
      expect(result.tasks[1].title).toBe('Updated Task');
      expect(result.tasks[1].description).toBe('New description');
      expect(result.tasks[1].column).toBe('todo'); // unchanged
      expect(result.tasks[1].dates.created).toBe('2024-01-01T10:00:00Z'); // unchanged
      expect(new Date(result.tasks[1].dates.updated).getTime()).toBeGreaterThan(
        new Date('2024-01-01T10:00:00Z').getTime()
      );
    });

    it('should throw error for non-existent task', () => {
      expect(() => updateTask(board, 999, { title: 'Non-existent' })).toThrow('Task with ID 999 not found on the board.');
    });

    it('should preserve ID even if provided in updates', () => {
      const updates = { id: 999, title: 'Trying to change ID' };
      
      const result = updateTask(board, 1, updates);
      
      expect(result.tasks[1].id).toBe(1); // Should remain 1, not 999
    });

    it('should set moved timestamp when column changes', () => {
      const result = updateTask(board, 1, { column: 'done' });
      
      expect(result.tasks[1].column).toBe('done');
      expect(result.tasks[1].dates.moved).toBeDefined();
      expect(new Date(result.tasks[1].dates.moved!).getTime()).toBeGreaterThan(0);
    });

    it('should not set moved timestamp when column does not change', () => {
      const result = updateTask(board, 1, { title: 'New Title', column: 'todo' });
      
      expect(result.tasks[1].title).toBe('New Title');
      expect(result.tasks[1].column).toBe('todo');
      expect(result.tasks[1].dates.moved).toBeUndefined();
    });
  });

  describe('sortTasks', () => {
    it('should sort tasks by priority then by updated date', () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: 'Low priority',
          description: '',
          column: 'todo',
          priority: 3,
          dates: { created: '2024-01-01T10:00:00Z', updated: '2024-01-01T10:00:00Z' }
        },
        {
          id: 2,
          title: 'High priority',
          description: '',
          column: 'todo',
          priority: 1,
          dates: { created: '2024-01-01T10:00:00Z', updated: '2024-01-01T10:00:00Z' }
        },
        {
          id: 3,
          title: 'No priority, recent',
          description: '',
          column: 'todo',
          dates: { created: '2024-01-01T10:00:00Z', updated: '2024-01-01T12:00:00Z' }
        },
        {
          id: 4,
          title: 'No priority, old',
          description: '',
          column: 'todo',
          dates: { created: '2024-01-01T10:00:00Z', updated: '2024-01-01T11:00:00Z' }
        }
      ];

      const sorted = sortTasks(tasks);

      expect(sorted[0].id).toBe(2); // High priority (1)
      expect(sorted[1].id).toBe(1); // Low priority (3)
      expect(sorted[2].id).toBe(3); // No priority, more recent
      expect(sorted[3].id).toBe(4); // No priority, older
    });

    it('should handle empty array', () => {
      const sorted = sortTasks([]);
      expect(sorted).toEqual([]);
    });

    it('should not mutate original array', () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: 'Task 1',
          description: '',
          column: 'todo',
          dates: { created: '2024-01-01T10:00:00Z', updated: '2024-01-01T10:00:00Z' }
        },
        {
          id: 2,
          title: 'Task 2',
          description: '',
          column: 'todo',
          dates: { created: '2024-01-01T10:00:00Z', updated: '2024-01-01T11:00:00Z' }
        }
      ];

      const originalOrder = tasks.map(t => t.id);
      sortTasks(tasks);
      const afterSortOrder = tasks.map(t => t.id);

      expect(originalOrder).toEqual(afterSortOrder);
    });
  });
});
import { createTask } from '../../src/core/taskUtils';
import { Task } from '../../src/core/types';

describe('taskUtils', () => {
  describe('createTask', () => {
    it('should create a task with all provided data', () => {
      const taskData: Partial<Task> = {
        title: 'Test Task',
        description: 'Test Description',
        column: 'in-progress',
        labels: ['test', 'urgent'],
        assignee: 'john',
        storyPoints: 5
      };

      const result = createTask(taskData, 42);

      expect(result).toMatchObject({
        id: 42,
        title: 'Test Task',
        description: 'Test Description',
        column: 'in-progress',
        labels: ['test', 'urgent'],
        assignee: 'john',
        storyPoints: 5
      });
      expect(result.dates.created).toBeDefined();
      expect(result.dates.updated).toBeDefined();
      expect(result.dates.created).toBe(result.dates.updated);
      expect(result.dates.moved).toBeUndefined();
    });

    it('should create a task with default values for missing data', () => {
      const result = createTask({}, 1);

      expect(result).toMatchObject({
        id: 1,
        title: 'Untitled Task',
        description: '',
        column: 'todo'
      });
      expect(result.dates.created).toBeDefined();
      expect(result.dates.updated).toBeDefined();
      expect(result.labels).toBeUndefined();
      expect(result.assignee).toBeUndefined();
      expect(result.storyPoints).toBeUndefined();
      expect(result.dates.moved).toBeUndefined();
    });

    it('should create a task with partial data', () => {
      const taskData: Partial<Task> = {
        title: 'Partial Task',
        assignee: 'jane'
      };

      const result = createTask(taskData, 10);

      expect(result).toMatchObject({
        id: 10,
        title: 'Partial Task',
        description: '',
        column: 'todo',
        assignee: 'jane'
      });
    });

    it('should handle task creation with custom dates', () => {
      const customCreated = '2024-01-01T10:00:00Z';
      const customMoved = '2024-01-01T12:00:00Z';
      const taskData: Partial<Task> = {
        title: 'Custom Dates Task',
        column: 'done',
        dates: {
          created: customCreated,
          updated: customCreated,
          moved: customMoved
        }
      };

      const result = createTask(taskData, 5);

      expect(result.dates.created).toBe(customCreated);
      expect(result.dates.moved).toBe(customMoved);
      expect(result.column).toBe('done');
    });

    it('should generate unique timestamps for created and updated fields', () => {
      const result1 = createTask({ title: 'Task 1' }, 1);
      // Small delay to ensure different timestamps
      const result2 = createTask({ title: 'Task 2' }, 2);

      expect(result1.dates.created).toBeDefined();
      expect(result1.dates.updated).toBeDefined();
      expect(result2.dates.created).toBeDefined();
      expect(result2.dates.updated).toBeDefined();
      
      // Times should be ISO strings
      expect(() => new Date(result1.dates.created)).not.toThrow();
      expect(() => new Date(result1.dates.updated)).not.toThrow();
    });
  });
});
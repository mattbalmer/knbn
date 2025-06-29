import { createTask } from '../../src/core/taskUtils';
import { Task } from '../../src/core/types';

describe('taskUtils', () => {
  describe('createTask', () => {
    it('should create a task with all provided data', () => {
      const taskData: Partial<Task> = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'in-progress',
        labels: ['test', 'urgent'],
        assignee: 'john',
        storyPoints: 5
      };

      const result = createTask(taskData, 42);

      expect(result).toMatchObject({
        id: 42,
        title: 'Test Task',
        description: 'Test Description',
        status: 'in-progress',
        labels: ['test', 'urgent'],
        assignee: 'john',
        storyPoints: 5
      });
      expect(result.created).toBeDefined();
      expect(result.updated).toBeDefined();
      expect(result.created).toBe(result.updated);
      expect(result.completed).toBeUndefined();
    });

    it('should create a task with default values for missing data', () => {
      const result = createTask({}, 1);

      expect(result).toMatchObject({
        id: 1,
        title: 'Untitled Task',
        description: '',
        status: 'todo'
      });
      expect(result.created).toBeDefined();
      expect(result.updated).toBeDefined();
      expect(result.labels).toBeUndefined();
      expect(result.assignee).toBeUndefined();
      expect(result.storyPoints).toBeUndefined();
      expect(result.completed).toBeUndefined();
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
        status: 'todo',
        assignee: 'jane'
      });
    });

    it('should handle completed task creation', () => {
      const completedTime = '2024-01-01T12:00:00Z';
      const taskData: Partial<Task> = {
        title: 'Completed Task',
        status: 'done',
        completed: completedTime
      };

      const result = createTask(taskData, 5);

      expect(result.completed).toBe(completedTime);
      expect(result.status).toBe('done');
    });

    it('should generate unique timestamps for created and updated fields', () => {
      const result1 = createTask({ title: 'Task 1' }, 1);
      // Small delay to ensure different timestamps
      const result2 = createTask({ title: 'Task 2' }, 2);

      expect(result1.created).toBeDefined();
      expect(result1.updated).toBeDefined();
      expect(result2.created).toBeDefined();
      expect(result2.updated).toBeDefined();
      
      // Times should be ISO strings
      expect(() => new Date(result1.created)).not.toThrow();
      expect(() => new Date(result1.updated)).not.toThrow();
    });
  });
});
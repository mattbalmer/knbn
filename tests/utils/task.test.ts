import { createTask, updateTask, updateTasksBatch, sortTasks } from '../../src/utils/task';
import { Board, Task } from '../../src/types/knbn';

describe('task utils', () => {
  describe('createTask', () => {
    it('should create task with required id', () => {
      const task = createTask({ id: 1 });
      
      expect(task.id).toBe(1);
      expect(task.title).toBe('');
      expect(task.description).toBe('');
      expect(task.column).toBe('');
      expect(task.labels).toBeUndefined();
      expect(task.sprint).toBeUndefined();
      expect(task.storyPoints).toBeUndefined();
      expect(task.priority).toBeUndefined();
      expect(task.dates.created).toBeDefined();
      expect(task.dates.updated).toBeDefined();
      expect(task.dates.moved).toBeUndefined();
    });

    it('should create task with all properties', () => {
      const taskData = {
        id: 2,
        title: 'Test Task',
        description: 'Test description',
        column: 'todo',
        labels: ['urgent', 'feature'],
        sprint: 'Sprint 1',
        storyPoints: 5,
        priority: 1,
        dates: {
          created: '2024-01-01T10:00:00Z',
          updated: '2024-01-01T11:00:00Z',
          moved: '2024-01-01T12:00:00Z'
        }
      };
      
      const task = createTask(taskData);
      
      expect(task).toEqual(taskData);
    });

    it('should use current time for dates when not provided', () => {
      const before = new Date().getTime();
      const task = createTask({ id: 1, title: 'Time Test' });
      const after = new Date().getTime();
      
      const createdTime = new Date(task.dates.created).getTime();
      const updatedTime = new Date(task.dates.updated).getTime();
      
      expect(createdTime).toBeGreaterThanOrEqual(before);
      expect(createdTime).toBeLessThanOrEqual(after);
      expect(updatedTime).toBeGreaterThanOrEqual(before);
      expect(updatedTime).toBeLessThanOrEqual(after);
    });

    it('should preserve provided dates', () => {
      const customDates = {
        created: '2024-01-01T10:00:00Z',
        updated: '2024-01-01T11:00:00Z',
        moved: '2024-01-01T12:00:00Z'
      };
      
      const task = createTask({
        id: 1,
        title: 'Custom Dates',
        dates: customDates
      });
      
      expect(task.dates).toEqual(customDates);
    });

    it('should handle partial dates', () => {
      const task = createTask({
        id: 1,
        dates: {
          created: '2024-01-01T10:00:00Z',
          updated: '2024-01-01T10:00:00Z'
        }
      });
      
      expect(task.dates.created).toBe('2024-01-01T10:00:00Z');
      expect(task.dates.updated).toBeDefined();
      expect(task.dates.moved).toBeUndefined();
    });

    it('should handle empty arrays and undefined values', () => {
      const task = createTask({
        id: 1,
        labels: [],
        sprint: undefined,
        storyPoints: undefined,
        priority: undefined
      });
      
      expect(task.labels).toEqual([]);
      expect(task.sprint).toBeUndefined();
      expect(task.storyPoints).toBeUndefined();
      expect(task.priority).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    let sampleBoard: Board;

    beforeEach(() => {
      sampleBoard = {
        name: 'Test Board',
        description: 'Test board',
        columns: [{ name: 'todo' }, { name: 'doing' }, { name: 'done' }],
        tasks: {
          1: {
            id: 1,
            title: 'Original Task',
            description: 'Original description',
            column: 'todo',
            labels: ['bug'],
            sprint: 'Sprint 1',
            storyPoints: 3,
            priority: 2,
            dates: {
              created: '2024-01-01T10:00:00Z',
              updated: '2024-01-01T10:00:00Z',
              moved: '2024-01-01T10:00:00Z'
            }
          },
          2: {
            id: 2,
            title: 'Another Task',
            description: 'Another description',
            column: 'doing',
            dates: {
              created: '2024-01-01T11:00:00Z',
              updated: '2024-01-01T11:00:00Z'
            }
          }
        },
        metadata: { nextId: 3, version: '0.2' },
        dates: {
          created: '2024-01-01T09:00:00Z',
          updated: '2024-01-01T09:00:00Z',
          saved: '2024-01-01T09:00:00Z'
        }
      };
    });

    it('should update task properties', () => {
      const updates = {
        title: 'Updated Task',
        description: 'Updated description'
      };
      
      const updatedBoard = updateTask(sampleBoard, 1, updates);
      
      expect(updatedBoard.tasks[1].title).toBe('Updated Task');
      expect(updatedBoard.tasks[1].description).toBe('Updated description');
      expect(updatedBoard.tasks[1].column).toBe('todo'); // preserved
      expect(updatedBoard.tasks[1].id).toBe(1); // preserved
    });

    it('should update task dates when modified', () => {
      const originalUpdated = sampleBoard.tasks[1].dates.updated;
      
      const updatedBoard = updateTask(sampleBoard, 1, { title: 'New Title' });
      
      expect(new Date(updatedBoard.tasks[1].dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
      expect(updatedBoard.tasks[1].dates.created).toBe(sampleBoard.tasks[1].dates.created); // preserved
    });

    it('should update moved date when column changes', () => {
      const originalMoved = sampleBoard.tasks[1].dates.moved;
      
      const updatedBoard = updateTask(sampleBoard, 1, { column: 'doing' });
      
      expect(updatedBoard.tasks[1].column).toBe('doing');
      expect(new Date(updatedBoard.tasks[1].dates.moved!).getTime()).toBeGreaterThan(
        new Date(originalMoved!).getTime()
      );
    });

    it('should not update moved date when column does not change', () => {
      const originalMoved = sampleBoard.tasks[1].dates.moved;
      
      const updatedBoard = updateTask(sampleBoard, 1, { title: 'New Title' });
      
      expect(updatedBoard.tasks[1].dates.moved).toBe(originalMoved);
    });

    it('should update board updated date', () => {
      const originalBoardUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = updateTask(sampleBoard, 1, { title: 'New Title' });
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThanOrEqual(
        new Date(originalBoardUpdated).getTime()
      );
    });

    it('should preserve task ID', () => {
      const updatedBoard = updateTask(sampleBoard, 1, { id: 999 }); // Try to change ID
      
      expect(updatedBoard.tasks[1].id).toBe(1); // Should remain 1
    });

    it('should update multiple properties at once', () => {
      const updates = {
        title: 'Multi-Update Task',
        description: 'Multi-update description',
        column: 'done',
        labels: ['feature', 'urgent'],
        sprint: 'Sprint 2',
        storyPoints: 8,
        priority: 1
      };
      
      const updatedBoard = updateTask(sampleBoard, 1, updates);
      const updatedTask = updatedBoard.tasks[1];
      
      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.description).toBe(updates.description);
      expect(updatedTask.column).toBe(updates.column);
      expect(updatedTask.labels).toEqual(updates.labels);
      expect(updatedTask.sprint).toBe(updates.sprint);
      expect(updatedTask.storyPoints).toBe(updates.storyPoints);
      expect(updatedTask.priority).toBe(updates.priority);
    });

    it('should throw error for non-existent task', () => {
      expect(() => updateTask(sampleBoard, 999, { title: 'New Title' })).toThrow(
        'Task with ID 999 not found on the board.'
      );
    });

    it('should not mutate original board', () => {
      const originalTasks = { ...sampleBoard.tasks };
      const originalDates = { ...sampleBoard.dates };
      
      updateTask(sampleBoard, 1, { title: 'New Title' });
      
      expect(sampleBoard.tasks).toEqual(originalTasks);
      expect(sampleBoard.dates).toEqual(originalDates);
    });

    it('should preserve other tasks', () => {
      const updatedBoard = updateTask(sampleBoard, 1, { title: 'Updated' });
      
      expect(updatedBoard.tasks[2]).toEqual(sampleBoard.tasks[2]); // unchanged
    });

    it('should handle updating task without moved date initially', () => {
      const taskWithoutMoved = {
        ...sampleBoard.tasks[2],
        dates: {
          created: '2024-01-01T11:00:00Z',
          updated: '2024-01-01T11:00:00Z'
          // no moved date
        }
      };
      
      const boardWithTaskWithoutMoved = {
        ...sampleBoard,
        tasks: {
          ...sampleBoard.tasks,
          2: taskWithoutMoved
        }
      };
      
      const updatedBoard = updateTask(boardWithTaskWithoutMoved, 2, { column: 'done' });
      
      expect(updatedBoard.tasks[2].column).toBe('done');
      expect(updatedBoard.tasks[2].dates.moved).toBeDefined();
    });
  });

  describe('sortTasks', () => {
    const createTaskForSort = (id: number, priority?: number, updated?: string): Task => ({
      id,
      title: `Task ${id}`,
      description: '',
      column: 'todo',
      dates: {
        created: '2024-01-01T10:00:00Z',
        updated: updated || '2024-01-01T10:00:00Z'
      },
      priority
    });

    it('should sort tasks with priority first (ascending)', () => {
      const tasks: Task[] = [
        createTaskForSort(1, 3),
        createTaskForSort(2, 1),
        createTaskForSort(3, 2),
        createTaskForSort(4) // no priority
      ];
      
      const sorted = sortTasks(tasks);
      
      expect(sorted.map(t => t.id)).toEqual([2, 3, 1, 4]); // priority 1, 2, 3, then no priority
    });

    it('should sort tasks without priority by updated date (descending)', () => {
      const tasks: Task[] = [
        createTaskForSort(1, undefined, '2024-01-01T10:00:00Z'),
        createTaskForSort(2, undefined, '2024-01-01T12:00:00Z'), // most recent
        createTaskForSort(3, undefined, '2024-01-01T11:00:00Z')
      ];
      
      const sorted = sortTasks(tasks);
      
      expect(sorted.map(t => t.id)).toEqual([2, 3, 1]); // most recently updated first
    });

    it('should sort tasks with same priority by updated date (descending)', () => {
      const tasks: Task[] = [
        createTaskForSort(1, 1, '2024-01-01T10:00:00Z'),
        createTaskForSort(2, 1, '2024-01-01T12:00:00Z'), // same priority, more recent
        createTaskForSort(3, 1, '2024-01-01T11:00:00Z')
      ];
      
      const sorted = sortTasks(tasks);
      
      expect(sorted.map(t => t.id)).toEqual([2, 3, 1]); // most recently updated first among same priority
    });

    it('should handle mixed priority and non-priority tasks', () => {
      const tasks: Task[] = [
        createTaskForSort(1, undefined, '2024-01-01T15:00:00Z'), // no priority, very recent
        createTaskForSort(2, 2, '2024-01-01T10:00:00Z'), // priority 2
        createTaskForSort(3, 1, '2024-01-01T11:00:00Z'), // priority 1
        createTaskForSort(4, undefined, '2024-01-01T12:00:00Z') // no priority, recent
      ];
      
      const sorted = sortTasks(tasks);
      
      expect(sorted.map(t => t.id)).toEqual([3, 2, 1, 4]); // priority 1, priority 2, then by recent update
    });

    it('should not mutate original array', () => {
      const tasks: Task[] = [
        createTaskForSort(1, 2),
        createTaskForSort(2, 1),
        createTaskForSort(3, 3)
      ];
      
      const originalOrder = tasks.map(t => t.id);
      sortTasks(tasks);
      
      expect(tasks.map(t => t.id)).toEqual(originalOrder);
    });

    it('should handle empty array', () => {
      const sorted = sortTasks([]);
      
      expect(sorted).toEqual([]);
    });

    it('should handle single task', () => {
      const tasks = [createTaskForSort(1, 1)];
      const sorted = sortTasks(tasks);
      
      expect(sorted).toEqual(tasks);
    });

    it('should handle tasks with priority 0', () => {
      const tasks: Task[] = [
        createTaskForSort(1, 0),
        createTaskForSort(2, 1),
        createTaskForSort(3) // no priority
      ];
      
      const sorted = sortTasks(tasks);
      
      expect(sorted.map(t => t.id)).toEqual([1, 2, 3]); // priority 0 comes first
    });

    it('should sort correctly with complex scenario', () => {
      const tasks: Task[] = [
        createTaskForSort(1, 3, '2024-01-01T14:00:00Z'), // priority 3, recent
        createTaskForSort(2, undefined, '2024-01-01T16:00:00Z'), // no priority, very recent
        createTaskForSort(3, 1, '2024-01-01T10:00:00Z'), // priority 1, old
        createTaskForSort(4, 1, '2024-01-01T15:00:00Z'), // priority 1, recent
        createTaskForSort(5, 2, '2024-01-01T12:00:00Z'), // priority 2, medium
        createTaskForSort(6, undefined, '2024-01-01T11:00:00Z') // no priority, old
      ];
      
      const sorted = sortTasks(tasks);
      
      expect(sorted.map(t => t.id)).toEqual([4, 3, 5, 1, 2, 6]);
      // Priority 1 (recent first): 4, 3
      // Priority 2: 5
      // Priority 3: 1
      // No priority (recent first): 2, 6
    });
  });

  describe('updateTasksBatch', () => {
    let sampleBoard: Board;

    beforeEach(() => {
      sampleBoard = {
        name: 'Test Board',
        description: 'Test board',
        columns: [{ name: 'todo' }, { name: 'doing' }, { name: 'done' }],
        tasks: {
          1: {
            id: 1,
            title: 'Task One',
            description: 'First task',
            column: 'todo',
            labels: ['bug'],
            sprint: 'Sprint 1',
            storyPoints: 3,
            priority: 2,
            dates: {
              created: '2024-01-01T10:00:00Z',
              updated: '2024-01-01T10:00:00Z',
              moved: '2024-01-01T10:00:00Z'
            }
          },
          2: {
            id: 2,
            title: 'Task Two',
            description: 'Second task',
            column: 'doing',
            dates: {
              created: '2024-01-01T11:00:00Z',
              updated: '2024-01-01T11:00:00Z'
            }
          },
          3: {
            id: 3,
            title: 'Task Three',
            description: 'Third task',
            column: 'todo',
            priority: 1,
            dates: {
              created: '2024-01-01T12:00:00Z',
              updated: '2024-01-01T12:00:00Z'
            }
          }
        },
        metadata: { nextId: 4, version: '0.2' },
        dates: {
          created: '2024-01-01T09:00:00Z',
          updated: '2024-01-01T09:00:00Z',
          saved: '2024-01-01T09:00:00Z'
        }
      };
    });

    it('should update multiple tasks at once', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { title: 'Updated Task One', column: 'doing' },
        2: { priority: 1, storyPoints: 5 },
        3: { column: 'done', labels: ['feature'] }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { board: updatedBoard, tasks: updatedTasks } = result;

      expect(updatedTasks[1].title).toBe('Updated Task One');
      expect(updatedTasks[1].column).toBe('doing');
      expect(updatedTasks[1].id).toBe(1);

      expect(updatedTasks[2].priority).toBe(1);
      expect(updatedTasks[2].storyPoints).toBe(5);
      expect(updatedTasks[2].title).toBe('Task Two'); // preserved

      expect(updatedTasks[3].column).toBe('done');
      expect(updatedTasks[3].labels).toEqual(['feature']);
      expect(updatedTasks[3].priority).toBe(1); // preserved

      expect(updatedBoard.tasks[1]).toEqual(updatedTasks[1]);
      expect(updatedBoard.tasks[2]).toEqual(updatedTasks[2]);
      expect(updatedBoard.tasks[3]).toEqual(updatedTasks[3]);
    });

    it('should update task and board timestamps', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { title: 'Updated Title' },
        2: { column: 'done' }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { board: updatedBoard, tasks: updatedTasks } = result;

      const now = new Date().getTime();
      const task1Updated = new Date(updatedTasks[1].dates.updated).getTime();
      const task2Updated = new Date(updatedTasks[2].dates.updated).getTime();
      const boardUpdated = new Date(updatedBoard.dates.updated).getTime();

      expect(task1Updated).toBeGreaterThan(new Date(sampleBoard.tasks[1].dates.updated).getTime());
      expect(task2Updated).toBeGreaterThan(new Date(sampleBoard.tasks[2].dates.updated).getTime());
      expect(boardUpdated).toBeGreaterThan(new Date(sampleBoard.dates.updated).getTime());

      expect(task1Updated).toBeLessThanOrEqual(now);
      expect(task2Updated).toBeLessThanOrEqual(now);
      expect(boardUpdated).toBeLessThanOrEqual(now);
    });

    it('should update moved date when column changes', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { column: 'done' },
        2: { title: 'New Title' } // no column change
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { tasks: updatedTasks } = result;

      expect(updatedTasks[1].dates.moved).toBeDefined();
      expect(new Date(updatedTasks[1].dates.moved!).getTime()).toBeGreaterThan(
        new Date(sampleBoard.tasks[1].dates.moved!).getTime()
      );

      expect(updatedTasks[2].dates.moved).toBeUndefined(); // task 2 had no moved date originally
    });

    it('should preserve task IDs', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { id: 999, title: 'Try to change ID' },
        2: { id: 888, description: 'Try to change ID too' }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { tasks: updatedTasks } = result;

      expect(updatedTasks[1].id).toBe(1);
      expect(updatedTasks[2].id).toBe(2);
    });

    it('should preserve created dates', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { title: 'Updated' },
        2: { title: 'Also Updated' }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { tasks: updatedTasks } = result;

      expect(updatedTasks[1].dates.created).toBe(sampleBoard.tasks[1].dates.created);
      expect(updatedTasks[2].dates.created).toBe(sampleBoard.tasks[2].dates.created);
    });

    it('should throw error for non-existent task', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { title: 'Valid update' },
        999: { title: 'Invalid task ID' }
      };

      expect(() => updateTasksBatch(sampleBoard, updates)).toThrow(
        'Task with ID 999 not found on the board.'
      );
    });

    it('should handle single task update', () => {
      const updates: Record<number, Partial<Task>> = {
        2: { title: 'Single Update', priority: 3 }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { board: updatedBoard, tasks: updatedTasks } = result;

      expect(Object.keys(updatedTasks)).toEqual(['2']);
      expect(updatedTasks[2].title).toBe('Single Update');
      expect(updatedTasks[2].priority).toBe(3);

      expect(updatedBoard.tasks[1]).toEqual(sampleBoard.tasks[1]); // unchanged
      expect(updatedBoard.tasks[3]).toEqual(sampleBoard.tasks[3]); // unchanged
    });

    it('should handle empty updates record', () => {
      const updates: Record<number, Partial<Task>> = {};

      const result = updateTasksBatch(sampleBoard, updates);
      const { board: updatedBoard, tasks: updatedTasks } = result;

      expect(Object.keys(updatedTasks)).toEqual([]);
      expect(updatedBoard.tasks).toEqual(sampleBoard.tasks);
      
      // Board should still have updated timestamp
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThanOrEqual(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should not mutate original board', () => {
      const originalTasks = { ...sampleBoard.tasks };
      const originalDates = { ...sampleBoard.dates };

      const updates: Record<number, Partial<Task>> = {
        1: { title: 'Mutate Test' }
      };

      updateTasksBatch(sampleBoard, updates);

      expect(sampleBoard.tasks).toEqual(originalTasks);
      expect(sampleBoard.dates).toEqual(originalDates);
    });

    it('should handle partial task updates', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { description: 'New description only' },
        2: { labels: ['urgent', 'bug'] },
        3: { storyPoints: 8 }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { tasks: updatedTasks } = result;

      expect(updatedTasks[1].description).toBe('New description only');
      expect(updatedTasks[1].title).toBe('Task One'); // preserved
      expect(updatedTasks[1].column).toBe('todo'); // preserved

      expect(updatedTasks[2].labels).toEqual(['urgent', 'bug']);
      expect(updatedTasks[2].title).toBe('Task Two'); // preserved

      expect(updatedTasks[3].storyPoints).toBe(8);
      expect(updatedTasks[3].priority).toBe(1); // preserved
    });

    it('should return updated tasks in same format as board tasks', () => {
      const updates: Record<number, Partial<Task>> = {
        1: { title: 'Format Test' },
        2: { priority: 5 }
      };

      const result = updateTasksBatch(sampleBoard, updates);
      const { board: updatedBoard, tasks: updatedTasks } = result;

      expect(updatedTasks[1]).toEqual(updatedBoard.tasks[1]);
      expect(updatedTasks[2]).toEqual(updatedBoard.tasks[2]);
    });
  });
});
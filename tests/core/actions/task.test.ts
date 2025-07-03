import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { createTask, findTasks, getTask, updateTask } from '../../../src/core/actions/task';
import { Board } from '../../../src/core/types/knbn';
import { Brands } from '../../../src/core/utils/ts';
// @ts-ignore
import { createTempDir } from '../../test-utils';

describe('task actions', () => {
  let tempDir: string;
  let testFilepath: string;
  let sampleBoard: Board;

  beforeEach(() => {
    tempDir = createTempDir('task-actions-tests');
    testFilepath = path.join(tempDir, 'test-board.knbn');

    // Create a test board with sample tasks
    sampleBoard = {
      name: 'Test Board',
      description: 'Test board for task actions',
      columns: [{ name: 'todo' }, { name: 'doing' }, { name: 'done' }],
      tasks: {
        1: {
          id: 1,
          title: 'First Task',
          description: 'Description of first task',
          column: 'todo',
          labels: ['urgent', 'feature'],
          sprint: 'Sprint 1',
          priority: 1,
          dates: {
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-01T10:00:00Z'
          }
        },
        2: {
          id: 2,
          title: 'Second Task',
          description: 'Bug fix task',
          column: 'doing',
          labels: ['bug'],
          sprint: 'Sprint 1',
          priority: 2,
          dates: {
            created: '2024-01-01T11:00:00Z',
            updated: '2024-01-01T11:00:00Z'
          }
        },
        3: {
          id: 3,
          title: 'Completed Task',
          description: 'Already finished',
          column: 'done',
          labels: ['feature'],
          dates: {
            created: '2024-01-01T09:00:00Z',
            updated: '2024-01-01T12:00:00Z'
          }
        }
      },
      metadata: { nextId: 4, version: '0.2.0' },
      dates: {
        created: '2024-01-01T09:00:00Z',
        updated: '2024-01-01T09:00:00Z',
        saved: '2024-01-01T09:00:00Z'
      }
    };

    // Save the board to file
    const content = yaml.dump(sampleBoard);
    fs.writeFileSync(testFilepath, content, 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getTask', () => {
    it('should retrieve existing task by ID', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const task = getTask(filepath, 1);
      
      expect(task).toBeDefined();
      expect(task!.id).toBe(1);
      expect(task!.title).toBe('First Task');
      expect(task!.description).toBe('Description of first task');
    });

    it('should return undefined for non-existent task', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const task = getTask(filepath, 999);
      
      expect(task).toBeUndefined();
    });

    it('should load task with all properties', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const task = getTask(filepath, 1);
      
      expect(task!.labels).toEqual(['urgent', 'feature']);
      expect(task!.sprint).toBe('Sprint 1');
      expect(task!.priority).toBe(1);
      expect(task!.column).toBe('todo');
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => getTask(filepath, 1)).toThrow(
        'Failed to load board file:'
      );
    });
  });

  describe('findTasks', () => {
    it('should return all tasks when query is empty', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, '');
      
      expect(tasks).toHaveLength(3);
      // Should be sorted by priority then by updated date
      expect(tasks[0].id).toBe(1); // priority 1
      expect(tasks[1].id).toBe(2); // priority 2
      expect(tasks[2].id).toBe(3); // no priority, most recent updated
    });

    it('should find tasks by title', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'first');
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('First Task');
    });

    it('should find tasks by description', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'bug fix');
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Second Task');
    });

    it('should find tasks by sprint', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'sprint 1');
      
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.id)).toContain(1);
      expect(tasks.map(t => t.id)).toContain(2);
    });

    it('should find tasks by labels', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'feature');
      
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.id)).toContain(1);
      expect(tasks.map(t => t.id)).toContain(3);
    });

    it('should be case insensitive', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'FIRST');
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('First Task');
    });

    it('should handle partial matches', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'task');
      
      expect(tasks).toHaveLength(3); // All tasks have "task" in title
    });

    it('should filter by specific keys when provided', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      // Only search in title, not description
      const tasks = findTasks(filepath, 'bug', ['title']);
      
      expect(tasks).toHaveLength(0); // "bug" not in any title
    });

    it('should search in labels when keys include labels', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'urgent', ['labels']);
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(1);
    });

    it('should return empty array when no matches found', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'nonexistent');
      
      expect(tasks).toEqual([]);
    });

    it('should return sorted results', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const tasks = findTasks(filepath, 'task');
      
      // Should be sorted by priority first, then by updated date
      expect(tasks[0].priority).toBe(1);
      expect(tasks[1].priority).toBe(2);
      expect(tasks[2].priority).toBeUndefined();
    });
  });

  describe('createTask', () => {
    it('should create new task and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      const taskData = {
        title: 'New Task',
        description: 'New task description'
      };
      
      const result = createTask(filepath, taskData);
      
      expect(result.task.id).toBe(4); // Next available ID
      expect(result.task.title).toBe('New Task');
      expect(result.task.description).toBe('New task description');
      expect(result.task.column).toBe('todo'); // Default column
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.tasks[4]).toBeDefined();
      expect(savedBoard.metadata.nextId).toBe(5);
    });

    it('should create task with all properties', () => {
      const filepath = Brands.Filepath(testFilepath);
      const taskData = {
        title: 'Complex Task',
        description: 'Complex task with all properties',
        labels: ['urgent', 'backend'],
        sprint: 'Sprint 2',
        priority: 3,
        storyPoints: 8
      };
      
      const result = createTask(filepath, taskData);
      
      expect(result.task.title).toBe(taskData.title);
      expect(result.task.description).toBe(taskData.description);
      expect(result.task.labels).toEqual(taskData.labels);
      expect(result.task.sprint).toBe(taskData.sprint);
      expect(result.task.priority).toBe(taskData.priority);
      expect(result.task.storyPoints).toBe(taskData.storyPoints);
    });

    it('should update board metadata correctly', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const result = createTask(filepath, { title: 'Test' });
      
      expect(result.board.metadata.nextId).toBe(5);
      expect(new Date(result.board.dates.updated).getTime()).toBeGreaterThan(
        new Date(sampleBoard.dates.updated).getTime()
      );
    });

    it('should preserve existing tasks', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const result = createTask(filepath, { title: 'New Task' });
      
      expect(Object.keys(result.board.tasks)).toHaveLength(4);
      expect(result.board.tasks[1]).toBeDefined(); // Original task preserved
      expect(result.board.tasks[2]).toBeDefined();
      expect(result.board.tasks[3]).toBeDefined();
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => createTask(filepath, { title: 'Test' })).toThrow(
        'Failed to load board file:'
      );
    });

    it('should set creation and update dates', () => {
      const filepath = Brands.Filepath(testFilepath);
      const before = new Date().getTime();
      
      const result = createTask(filepath, { title: 'Date Test' });
      const after = new Date().getTime();
      
      const createdTime = new Date(result.task.dates.created).getTime();
      const updatedTime = new Date(result.task.dates.updated).getTime();
      
      expect(createdTime).toBeGreaterThanOrEqual(before);
      expect(createdTime).toBeLessThanOrEqual(after);
      expect(updatedTime).toBeGreaterThanOrEqual(before);
      expect(updatedTime).toBeLessThanOrEqual(after);
    });
  });

  describe('updateTask', () => {
    it('should update existing task and save to file', () => {
      const filepath = Brands.Filepath(testFilepath);
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };
      
      const updatedBoard = updateTask(filepath, 1, updates);
      
      expect(updatedBoard.tasks[1].title).toBe('Updated Title');
      expect(updatedBoard.tasks[1].description).toBe('Updated description');
      expect(updatedBoard.tasks[1].id).toBe(1); // ID preserved
      
      // Verify saved to file
      const content = fs.readFileSync(testFilepath, 'utf8');
      const savedBoard = yaml.load(content) as Board;
      expect(savedBoard.tasks[1].title).toBe('Updated Title');
    });

    it('should update task column and set moved date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const before = new Date().getTime();
      
      const updatedBoard = updateTask(filepath, 1, { column: 'doing' });
      const after = new Date().getTime();
      
      expect(updatedBoard.tasks[1].column).toBe('doing');
      
      const movedTime = new Date(updatedBoard.tasks[1].dates.moved!).getTime();
      expect(movedTime).toBeGreaterThanOrEqual(before);
      expect(movedTime).toBeLessThanOrEqual(after);
    });

    it('should update multiple properties at once', () => {
      const filepath = Brands.Filepath(testFilepath);
      const updates = {
        title: 'Multi-update Task',
        column: 'done',
        priority: 5,
        labels: ['updated', 'testing']
      };
      
      const updatedBoard = updateTask(filepath, 1, updates);
      const task = updatedBoard.tasks[1];
      
      expect(task.title).toBe(updates.title);
      expect(task.column).toBe(updates.column);
      expect(task.priority).toBe(updates.priority);
      expect(task.labels).toEqual(updates.labels);
    });

    it('should preserve unchanged properties', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalTask = sampleBoard.tasks[1];
      
      const updatedBoard = updateTask(filepath, 1, { title: 'New Title' });
      const task = updatedBoard.tasks[1];
      
      expect(task.description).toBe(originalTask.description);
      expect(task.sprint).toBe(originalTask.sprint);
      expect(task.labels).toEqual(originalTask.labels);
      expect(task.dates.created).toBe(originalTask.dates.created);
    });

    it('should update task updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalUpdated = sampleBoard.tasks[1].dates.updated;
      
      const updatedBoard = updateTask(filepath, 1, { title: 'New Title' });
      
      expect(new Date(updatedBoard.tasks[1].dates.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    it('should update board updated date', () => {
      const filepath = Brands.Filepath(testFilepath);
      const originalBoardUpdated = sampleBoard.dates.updated;
      
      const updatedBoard = updateTask(filepath, 1, { title: 'New Title' });
      
      expect(new Date(updatedBoard.dates.updated).getTime()).toBeGreaterThan(
        new Date(originalBoardUpdated).getTime()
      );
    });

    it('should throw error for non-existent task', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      expect(() => updateTask(filepath, 999, { title: 'Test' })).toThrow(
        'Task with ID 999 not found on the board.'
      );
    });

    it('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.knbn');
      const filepath = Brands.Filepath(nonExistentPath);
      
      expect(() => updateTask(filepath, 1, { title: 'Test' })).toThrow(
        'Failed to load board file:'
      );
    });

    it('should preserve other tasks unchanged', () => {
      const filepath = Brands.Filepath(testFilepath);
      
      const updatedBoard = updateTask(filepath, 1, { title: 'Updated' });
      
      expect(updatedBoard.tasks[2]).toEqual(sampleBoard.tasks[2]);
      expect(updatedBoard.tasks[3]).toEqual(sampleBoard.tasks[3]);
    });
  });
});
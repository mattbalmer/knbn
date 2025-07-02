import { Board, Task } from '../types/knbn';
import { getNow } from './misc';

export type CreateTaskParams = Partial<Omit<Task, 'id'>> & Pick<Task, 'id'>;
export function createTask(taskData: CreateTaskParams): Task {
  const now = getNow();

  return {
    id: taskData.id,
    title: taskData.title || '',
    description: taskData.description || '',
    column: taskData.column || '',
    labels: taskData.labels,
    sprint: taskData.sprint,
    storyPoints: taskData.storyPoints,
    priority: taskData.priority,
    dates: {
      created: taskData.dates?.created || now,
      updated: taskData.dates?.updated || now,
      moved: taskData.dates?.moved
    }
  };
}

export const updateTask = (board: Board, taskId: number, updates: Partial<Task>): Board => {
  const task = board.tasks[taskId];
  if (!task) {
    throw new Error(`Task with ID ${taskId} not found on the board.`);
  }

  const now = getNow();
  const columnChanged = updates.column && updates.column !== task.column;

  // Update the task with new values, keeping existing values for unspecified fields
  const updatedTask: Task = {
    ...task,
    ...updates,
    id: taskId, // Ensure ID doesn't change
    dates: {
      created: task.dates.created,
      updated: now,
      moved: (columnChanged ? now : task.dates.moved)
    }
  };

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: updatedTask,
    },
    dates: {
      ...board.dates,
      updated: now,
    },
  };
}

export const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // Tasks with priority come first, sorted by ascending priority
    if (a.priority !== undefined && b.priority === undefined) return -1;
    if (a.priority === undefined && b.priority !== undefined) return 1;
    
    // Both have priority - sort by ascending priority
    if (a.priority !== undefined && b.priority !== undefined) {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
    }
    
    // Same priority (or both undefined) - sort by recently modified (descending)
    const aUpdated = new Date(a.dates.updated).getTime();
    const bUpdated = new Date(b.dates.updated).getTime();
    return bUpdated - aUpdated;
  });
}
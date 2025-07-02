import { Task } from '../types/knbn';
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
    dates: {
      created: taskData.dates?.created || now,
      updated: taskData.dates?.updated || now,
      moved: taskData.dates?.moved
    }
  };
}
import { Task } from './types';

export function createTask(taskData: Partial<Task>, nextId: number): Task {
  const now = new Date().toISOString();
  
  return {
    id: nextId,
    title: taskData.title || 'Untitled Task',
    description: taskData.description || '',
    status: taskData.status || 'todo',
    labels: taskData.labels,
    assignee: taskData.assignee,
    storyPoints: taskData.storyPoints,
    created: now,
    updated: now,
    completed: taskData.completed
  };
}
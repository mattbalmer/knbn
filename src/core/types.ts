export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  labels?: string[];
  assignee?: string;
  storyPoints?: number;
  dates: {
    created: string;
    updated: string;
    moved?: string;
  };
}

export interface Board {
  configuration: {
    name: string;
    description: string;
    columns: Array<{ name: string }>;
  };
  tasks: Record<number, Task>;
  metadata: {
    nextId: number;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}
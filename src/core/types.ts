export interface Task {
  id: number;
  title: string;
  description: string;
  column: string;
  sprint?: string;
  labels?: string[];
  assignee?: string;
  storyPoints?: number;
  dates: {
    created: string;
    updated: string;
    moved?: string;
  };
}

export interface Column {
  name: string;
}

export interface Sprint {
  name: string;
  description?: string;
  capacity?: number;
  dates: {
    created: string;
    starts: string;
    ends?: string;
  };
}

export interface Board {
  configuration: {
    name: string;
    description: string;
    columns: Column[];
  };
  tasks: Record<number, Task>;
  sprints?: Sprint[];
  metadata: {
    nextId: number;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}
export interface Task_0_1 {
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

export interface Column_0_1 {
  name: string;
}

export interface Sprint_0_1 {
  name: string;
  description?: string;
  capacity?: number;
  dates: {
    created: string;
    starts: string;
    ends?: string;
  };
}

export interface Board_0_1 {
  configuration: {
    name: string;
    description: string;
    columns: Column_0_1[];
  };
  tasks: Record<number, Task_0_1>;
  sprints?: Sprint_0_1[];
  metadata: {
    nextId: number;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}
export interface Task_0_1_0 {
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

export interface Column_0_1_0 {
  name: string;
}

export interface Sprint_0_1_0 {
  name: string;
  description?: string;
  capacity?: number;
  dates: {
    created: string;
    starts: string;
    ends?: string;
  };
}

export interface Board_0_1_0 {
  configuration: {
    name: string;
    description: string;
    columns: Column_0_1_0[];
  };
  tasks: Record<number, Task_0_1_0>;
  sprints?: Sprint_0_1_0[];
  metadata: {
    nextId: number;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}
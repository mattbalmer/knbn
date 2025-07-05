export interface Task {
  id: number;
  title: string;
  description: string;
  column: string;
  sprint?: string;
  labels?: string[];
  storyPoints?: number;
  priority?: number;
  dates: {
    created: string;
    updated: string;
    moved?: string;
  };
}

export interface Column {
  name: string;
}

export interface Label {
  name: string;
  color?: string;
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
  name: string;
  description?: string;
  columns: Column[];
  tasks: Record<number, Task>;
  labels?: Label[];
  sprints?: Sprint[];
  metadata: {
    nextId: number;
    version: string;
  };
  dates: {
    created: string;
    updated: string;
    saved: string;
  };
}
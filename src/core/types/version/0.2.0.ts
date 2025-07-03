export interface Task_0_2_0 {
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

export interface Column_0_2_0 {
  name: string;
}

export interface Label_0_2_0 {
  name: string;
  color?: string;
}

export interface Sprint_0_2_0 {
  name: string;
  description?: string;
  capacity?: number;
  dates: {
    created: string;
    starts: string;
    ends?: string;
  };
}

export interface Board_0_2_0 {
  name: string;
  description?: string;
  columns: Column_0_2_0[];
  tasks: Record<number, Task_0_2_0>;
  labels?: Label_0_2_0[];
  sprints?: Sprint_0_2_0[];
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
import { Board } from '../types';
import { Board_0_1 } from '../types/version/0.1';
import { Board_0_2, Column_0_2, Label_0_2 } from '../types/version/0.2';
import { KNBN_BOARD_VERSION } from '../constants';

const BOARD_VERSIONS = ['0.1', '0.2'] as const;
type Satisfies<T, U> = T extends U ? T : never;
type BoardVersions = typeof BOARD_VERSIONS[number];
type BoardTypes = Satisfies<{
  '0.1': Board_0_1;
  '0.2': Board_0_2;
}, Record<BoardVersions, any>>;
type MigrationKey = `${keyof BoardTypes}->${keyof BoardTypes}`;

export const migrateBoard = (data: any): Board => {
  // iterate through the versions and migrate to the target version
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid board data for migration');
  }
  if (!data.metadata || !data.metadata.version) {
    throw new Error('Missing version information in board data');
  }
  if (data.metadata.version === KNBN_BOARD_VERSION) {
    return data as Board; // No migration needed
  }
  if (!Object.keys(data).length) {
    throw new Error('Empty board data cannot be migrated');
  }
  let board: any = structuredClone(data);
  while (board.metadata?.version !== KNBN_BOARD_VERSION) {
    const from = board.metadata.version as keyof BoardTypes;
    const nextVersion = BOARD_VERSIONS[BOARD_VERSIONS.indexOf(from) + 1];
    if (!nextVersion) {
      throw new Error(`No migration path found for version: ${from}`);
    }
    board = migrateBoardTo(board, nextVersion);
  }
  return board as Board;
}

export const migrateBoardTo = <V extends keyof BoardTypes>(data: any, to: V): BoardTypes[V] => {
  const from = data.metadata?.version;
  const migration = migrationFor(from, to);
  return migration(data);
}

const migrationFor = <F extends keyof BoardTypes, T extends keyof BoardTypes>(
  from: F,
  to: T
): ((data: BoardTypes[F]) => BoardTypes[T]) => {
  if (!from || !to) {
    throw new Error(`Invalid migration data: missing version information: ${from} -> ${to}`);
  }
  const migrationKey = `${from}->${to}` as MigrationKey;
  if (!migrations.hasOwnProperty(migrationKey)) {
    throw new Error(`No migration found for version: ${migrationKey}`);
  }
  // @ts-ignore
  const migration = migrations[migrationKey];
  return migration;
}

const migrations = {
  '0.1->0.2': (data: Board_0_1): Board_0_2 => {
    const columns: Column_0_2[] = data.configuration.columns;
    const labels: Label_0_2[] = Array.from(
      Object.values(data.tasks)
        .reduce((labels, task) => {
          if (task.labels) {
            task.labels.forEach(label => labels.add(label));
          }
          return labels;
        }, new Set<string>())
    )
      .map((name) => ({ name }));
    return {
      name: data.configuration.name,
      description: data.configuration.description,
      columns,
      tasks: data.tasks,
      labels: labels || undefined,
      sprints: data.sprints || undefined,
      metadata: {
        nextId: data.metadata.nextId,
        version: '0.2',
      },
      dates: {
        created: data.metadata.createdAt,
        updated: data.metadata.lastModified,
        saved: data.metadata.lastModified,
      },
    };
  },
  // Add more migrations as needed
} as const satisfies Partial<Record<MigrationKey, (data: any) => any>>;
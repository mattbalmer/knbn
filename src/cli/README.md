# KnBn CLI - AI Coding Agent Documentation

## Overview
The CLI directory implements the command-line interface for KnBn, providing user-friendly commands for kanban board management. It acts as a thin layer over the core business logic, handling user input, validation, and output formatting.

## Architecture for AI Agents

### Command Flow Pattern
```
User Input → Commander.js → Command File → Core Actions → File System
```

## Directory Structure

```
src/cli/
├── commands/        # Individual command implementations
├── utils/           # CLI-specific utilities
├── commander.ts     # Command registration and setup
└── index.ts         # Entry point with error handling
```

## Available Commands (Complete List)

### Board Commands
- `knbn` or `knbn list` - List available board files
- `knbn create-board [name]` - Create new board file

### Task Commands
- `knbn get-task <id>` - Get task details by ID
- `knbn list-tasks` - List tasks with filtering options
- `knbn create-task <title>` - Create new task
- `knbn update-task <id>` - Update existing task

### Column Commands
- `knbn list-columns` - List all columns
- `knbn create-column <name>` - Create new column
- `knbn update-column <name>` - Update column properties
- `knbn remove-column <name>` - Remove column
- `knbn move-column <name> <position>` - Move column to position

### Label Commands
- `knbn list-labels` - List all labels
- `knbn add-label <name>` - Create new label
- `knbn update-label <name>` - Update label properties
- `knbn remove-label <name>` - Remove label

### Sprint Commands
- `knbn list-sprints` - List all sprints
- `knbn add-sprint <name>` - Create new sprint
- `knbn update-sprint <name>` - Update sprint properties
- `knbn remove-sprint <name>` - Remove sprint

### Server Command
- `knbn serve` - Start web server (delegates to knbn-web package)

## Filtering and Search Options

### Task List Filtering
```typescript
// Command: knbn list-tasks [options]
.option('-q, --query <query>', 'Search query to filter tasks')
.option('-c, --column <column>', 'Filter by column')
.option('-l, --label <label>', 'Filter by label')
.option('-s, --sprint <sprint>', 'Filter by sprint')
.option('-p, --priority <priority>', 'Filter by priority (number)')

// Implementation:
let tasks = TaskActions.findTasks(boardFile, options.query || '');

// Apply additional filters
if (options.column) {
  tasks = tasks.filter(task => task.column === options.column);
}
// ... more filters
```

### Sprint List Filtering
```typescript
// Command: knbn list-sprints [options]
.option('--filter <filter>', 'Filter sprints by status (all, active, upcoming, completed)', 'all')

// Implementation using core actions:
switch (options.filter) {
  case 'active':
    sprints = SprintActions.getActiveSprints(boardFile);
    break;
  case 'upcoming':
    sprints = SprintActions.getUpcomingSprints(boardFile);
    break;
  // ...
}
```
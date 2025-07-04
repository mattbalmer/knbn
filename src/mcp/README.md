# KnBn MCP Server - AI Coding Agent Documentation

## Overview
The MCP directory implements a Model Context Protocol server that exposes KnBn's kanban board functionality through structured tools and resources. This enables AI assistants to interact with kanban boards programmatically using standardized MCP protocols.

## Architecture for AI Agents

### MCP Protocol Layer
```
AI Assistant ↔ MCP Protocol ↔ MCP Tools/Resources ↔ Core Actions ↔ File System
```

### Design Principles
- **Protocol Compliance**: Full adherence to MCP specification
- **Structured Output**: Consistent schemas for all tool responses  
- **Discoverability**: Self-documenting tools and resources
- **Error Handling**: Structured error responses with clear messages

## Directory Structure

```
src/mcp/
├── tools/            # MCP tools organized by functionality
│   ├── board/        # Board management tools
│   ├── tasks/        # Task management tools  
│   ├── columns/      # Column management tools
│   ├── labels/       # Label management tools
│   └── sprints/      # Sprint management tools
├── resources/        # MCP resources for data access
├── server.ts         # Main MCP server setup
└── patch.ts          # MCP SDK extensions and utilities
```

## MCP Tools API

### Tool Organization Pattern
Each tool category follows a consistent structure:
```
tools/[category]/
├── create.ts         # Create new entities
├── get.ts           # Get single entity by identifier  
├── list.ts          # List/filter entities
├── update.ts        # Update entity properties
├── remove.ts        # Remove entities
└── index.ts         # Tool registration aggregator
```

## Tool Usage Examples

### Board Management

#### Create Board
**Request:**
```
Tool: create_board
Arguments:
  name: "Project Alpha"
  description: "Development board for Project Alpha"
  filename: "alpha.knbn"
```

**Response:**
```
Board 'Project Alpha' created successfully in alpha.knbn
```

#### Get Board
**Request:**
```
Tool: get_board
Arguments:
  filename: "alpha.knbn"
```

**Response:**
```json
{
  "name": "Project Alpha",
  "description": "Development board for Project Alpha",
  "columns": ["To Do", "In Progress", "Done"],
  "tasks": [],
  "labels": [],
  "sprints": []
}
```

### Task Management

#### Create Task
**Request:**
```
Tool: create_task
Arguments:
  title: "Implement user authentication"
  description: "Add login and registration functionality"
  column: "To Do"
  priority: 1
  storyPoints: 5
  labels: ["backend", "security"]
  filename: "alpha.knbn"
```

**Response:**
```
Task 'Implement user authentication' created with ID 1
```

#### Update Task
**Request:**
```
Tool: update_task
Arguments:
  id: 1
  column: "In Progress"
  priority: 2
  filename: "alpha.knbn"
```

**Response:**
```
Task 1 updated successfully
```

#### List Tasks
**Request:**
```
Tool: list_tasks
Arguments:
  column: "In Progress"
  filename: "alpha.knbn"
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Implement user authentication",
    "description": "Add login and registration functionality",
    "column": "In Progress",
    "priority": 2,
    "storyPoints": 5,
    "labels": ["backend", "security"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Column Management

#### Create Column
**Request:**
```
Tool: create_column
Arguments:
  name: "Code Review"
  position: 2
  filename: "alpha.knbn"
```

**Response:**
```
Column 'Code Review' created at position 2
```

#### List Columns
**Request:**
```
Tool: list_columns
Arguments:
  includeTasks: true
  filename: "alpha.knbn"
```

**Response:**
```json
[
  {
    "name": "To Do",
    "taskCount": 3
  },
  {
    "name": "Code Review",
    "taskCount": 0
  },
  {
    "name": "In Progress",
    "taskCount": 1
  },
  {
    "name": "Done",
    "taskCount": 5
  }
]
```

### Label Management

#### Add Label
**Request:**
```
Tool: add_label
Arguments:
  name: "urgent"
  color: "red"
  filename: "alpha.knbn"
```

**Response:**
```
Label 'urgent' added with color 'red'
```

### Sprint Management

#### Add Sprint
**Request:**
```
Tool: add_sprint
Arguments:
  name: "Sprint 1"
  description: "Initial development sprint"
  starts: "2024-01-15T00:00:00Z"
  ends: "2024-01-29T23:59:59Z"
  capacity: 20
  filename: "alpha.knbn"
```

**Response:**
```
Sprint 'Sprint 1' added successfully
```

#### List Sprints
**Request:**
```
Tool: list_sprints
Arguments:
  filter: "active"
  filename: "alpha.knbn"
```

**Response:**
```json
[
  {
    "name": "Sprint 1",
    "description": "Initial development sprint",
    "starts": "2024-01-15T00:00:00Z",
    "ends": "2024-01-29T23:59:59Z",
    "capacity": 20,
    "status": "active"
  }
]
```


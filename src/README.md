# KnBn Core - AI Coding Agent Documentation

## Overview
The core directory contains the foundational business logic for the KnBn kanban CLI tool. This is the data layer that handles all board operations, file I/O, and business rules. All other layers (CLI, MCP) delegate to core for actual functionality.

## Architecture for AI Agents

### Data Flow Pattern
```
CLI/MCP → Core Actions → Core Utils → File System
```

### Key Principles
- **Immutable Operations**: Functions return new objects, never mutate inputs
- **Type Safety**: Comprehensive TypeScript types with strict validation
- **Error Handling**: Explicit error throwing with descriptive messages
- **File-based Storage**: YAML files (.knbn) for human-readable persistence

## Directory Structure

```
src/core/
├── actions/         # High-level business operations (public API)
├── constants/       # Application constants and versions
├── types/           # TypeScript type definitions
└── utils/           # Low-level utilities (internal helpers)
```

## Core Data Model

### Primary Types
All main types are location in `types/knbn.ts`
- Board
- Task
- Column
- Label
- Sprint

All except Board may be considered sub-resources of Board.
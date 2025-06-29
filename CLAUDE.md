# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnBn is a TypeScript-based kanban CLI tool for managing kanban boards from the command line. The web server functionality has been moved to a separate `knbn-web` package to keep this CLI lightweight.

## Architecture

- **Entry Point**: `src/cli/index.ts` - Main CLI application
- **Core Logic**: `src/core/` - Board and task management utilities
- **Build Output**: `dist/` directory contains compiled JavaScript
- **Configuration**: Standard TypeScript project with `tsconfig.json`

The application structure:
- CLI commands for task and board management
- Integration with separate `knbn-web` server for web interface
- Board data stored in `.knbn` files
- Uses ES2020 target with CommonJS modules

## Development Commands

```bash
# Build the project
yarn build
```

## Key Files

- `src/cli/index.ts` - Main CLI application entry point
- `src/core/` - Core functionality for board and task management
- `package.json` - Contains build scripts and dependencies
- `tsconfig.json` - TypeScript configuration with strict mode enabled
- `dist/` - Compiled output directory (auto-generated)

## Dependencies

- **Runtime**: js-yaml for board file parsing
- **Development**: TypeScript, ts-node, Jest for testing
- **External**: `knbn-web` CLI for web server functionality (separate package)

## Developer Notes
- Use `yarn` over `npm` where possible
- If in a feature branch (`feature/*`), git commit after every prompt. The commit message should follow the format below. Do not modify the user prompt.
  ```
  Prompt:
  <user_prompt>
  
  Summary:
  <summary_of_changes>
  ```
- Use `claude-test.knbn` by default when testing. This is okay to modify without asking permission.
- Never modify the file `.knbn` in this directory directly or without being prompted to. When prompter asks to modify ".knbn", use the CLI (npx knbn)
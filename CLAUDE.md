# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnBn is a TypeScript-based kanban CLI tool that runs as an Express web server. The project is in early development with a simple web interface that displays the current working directory.

## Architecture

- **Entry Point**: `src/index.ts` - Main Express server file
- **Build Output**: `dist/` directory contains compiled JavaScript
- **Configuration**: Standard TypeScript project with `tsconfig.json`

The application structure is minimal:
- Express server runs on port 9000
- Single route `/` serves HTML showing current working directory
- Uses ES2020 target with CommonJS modules

## Development Commands

```bash
# Build the project
yarn build

# Run in development (with ts-node)
yarn dev

# Run compiled version
yarn start
```

## Key Files

- `src/index.ts` - Main application entry point
- `package.json` - Contains build scripts and dependencies
- `tsconfig.json` - TypeScript configuration with strict mode enabled
- `dist/` - Compiled output directory (auto-generated)

## Dependencies

- **Runtime**: Express.js for web server
- **Development**: TypeScript, ts-node, type definitions for Express and Node.js

## Developer Notes
- Use `yarn` over `npm` where possible
- If in a feature branch (`feature/*`), git commit after every prompt. The commit message should follow the format below. Do not modify the user prompt.
  ```
  Prompt:
  <user_prompt>
  
  Summary:
  <summary_of_changes>
  ```
- Use `claude-test.knbn` by default when testing.
# Test Suite

This directory contains comprehensive tests for the KnBn kanban CLI tool.

## Test Structure

- `core/` - Unit tests for core functionality
  - `taskUtils.test.ts` - Tests for task creation utilities
  - `boardUtils.test.ts` - Tests for board file operations (load, save, find, add/update tasks)
- `cli/` - Integration tests for CLI commands
  - `cli.test.ts` - End-to-end tests for all CLI commands
- `fixtures/` - Test data files
  - `test-board.knbn` - Sample board with tasks
  - `empty-board.knbn` - Empty board for testing

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Test Coverage

The test suite achieves 100% coverage of core functionality:
- **taskUtils**: Task creation with defaults, partial data, and edge cases
- **boardUtils**: File operations, board loading/saving, task management, error handling

## Test Philosophy

Tests focus on **behavior over implementation**:
- Core tests verify the public API behavior and contracts
- CLI tests use actual command execution to test real user interactions
- Tests use temporary directories and files to avoid side effects
- Error cases and edge conditions are thoroughly tested

## Key Test Scenarios

### Core Functionality
- Task creation with various data combinations
- Board file discovery in different scenarios
- YAML parsing and validation
- Task updates with automatic timestamp management
- Error handling for invalid files and operations

### CLI Integration
- Command help and usage
- Task creation with different argument patterns
- Task updates with multiple field changes
- File path handling (auto-discovery vs explicit)
- Error handling and user feedback
- Multi-word argument parsing

## Test Utilities

The test suite includes utilities for:
- Temporary directory management
- Shell command execution with proper escaping
- Board file fixtures for consistent test data
- Path resolution for cross-platform compatibility
# KnBn

A TypeScript-based CLI for managing advanced TODOs, in a Kanban style, from the command line.

_This is an early, work-in-progress version of the project. Use accepting risk of breaking changes._

## Usage

For basic CLI usage, run via npx:

```bash
npx knbn -h
```

_Note: currently the default command `knbn` tries to run `knbn-web` - you will need to specify commands explicitly until this is updated._

## Web Interface

If you plan to use the web interface, install the separate `knbn-web` package:

```bash
npm i -g knbn-web
```

Then run:

```bash
knbn-web init
```

## Features

- Command-line kanban board management
- Task and board operations
- Board data stored in `.knbn` files
- Lightweight CLI with optional web interface (`knbn-web`)

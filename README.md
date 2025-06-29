# KnBn

A TypeScript-based CLI for managing advanced TODOs, in a Kanban style, from the command line.

_This is an early, work-in-progress version of the project. Use accepting risk of breaking changes._

## Usage

For basic CLI usage, run via npx:

```bash
npx knbn
```

## Web Interface

If you plan to use the web interface, install the separate `knbn-web` package:

```bash
npm i -g knbn-web
```

Then use either `knbn-web` or `knbn serve` to start the web server.
You can specify a custom port with the `-p` option:

```bash
knbn-web -p 8080
```

## Features

- Command-line kanban board management
- Task and board operations
- Board data stored in `.knbn` files
- Lightweight CLI with optional web interface (`knbn-web` or `knbn serve`)

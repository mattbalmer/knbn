# KnBn

A TypeScript-first tool for managing advanced TODOs, in a Kanban style, locally in your project.

_This is an early, work-in-progress version of the project. Use accepting risk of breaking changes._

## Overview

KnBn project contains four main packages, each in their own repo.

- [knbn-core](https://github.com/mattbalmer/knbn-web): Core logic and types
- [knbn-web](https://github.com/mattbalmer/knbn-web): Browser-based management UI  
- [knbn-mcp](https://github.com/mattbalmer/knbn-mcp): AI assistant integration via MCP
- [knbn-cli](https://github.com/mattbalmer/knbn-cli): Command-line tools for managing boards

## Usage

Any of the following options will work. Default board file is `.knbn`, but you can create as many as you like, with any name (eg. `project.knbn`).

### Web
```bash
npx knbn-web
# or
npm i -g knbn-web
knbn-web 
```

This will open the web interface in your default browser at `http://localhost:9000`, but you can specify a custom port with `-p` option.

## MCP Server
Configure your MCP client to use `knbn-mcp`. For example, with Claude Code:
```bash
claude mcp add knbn -- npx knbn-mcp
```

The server config JSON looks like:
```json
{
  "mcpServers": {
    "knbn": {
      "command": "npx",
      "args": ["knbn-mcp"]
    }
  }
}
```

### CLI
For basic CLI usage, run via npx or install globally.

```bash
npx knbn-cli
# or
npm i -g knbn-cli
knbn-cli 
```

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCreateTaskTool } from './create';
import { registerUpdateTaskTool } from './update';
import { registerListTasksTool } from './list';
import { registerGetTaskTool } from './get';

export const registerTaskTools = (server: McpServer) => {
  registerCreateTaskTool(server);
  registerUpdateTaskTool(server);
  registerListTasksTool(server);
  registerGetTaskTool(server);
};
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { registerStructuredTool } from '../../patch';
import { Brands } from '../../../core/utils/ts';
import path from 'path';
import { pcwd } from '../../../core/utils/files';
import { createBoard } from '../../../core/actions/board';
import { z } from 'zod';

export const registerCreateBoardTool = (server: McpServer) =>
  registerStructuredTool(server, 'create_board',
    {
      title: 'Create KnBn Board',
      description: 'Create a new .knbn board file',
      inputSchema: {
        name: z.string().describe('Board name'),
        description: z.string().optional().describe('Board description'),
        filename: z.string().optional().describe('Custom filename (defaults to .knbn)'),
      },
      outputSchema: {
        filepath: z.string(),
        board: z.object({
          name: z.string(),
          description: z.string().optional(),
          columns: z.array(z.object({
            name: z.string(),
          })),
          metadata: z.object({
            nextId: z.number(),
            version: z.string(),
          }),
        }),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename)) as any;

        const board = createBoard(filepath, {
          name: args.name,
          description: args.description,
        });

        return {
          structuredContent: {
            filepath: filename,
            board: {
              name: board.name,
              description: board.description,
              columns: board.columns,
              metadata: board.metadata,
            },
          },
        };
      } catch (error: any) {
        throw new Error(error?.message || error || 'Unknown error creating board');
      }
    }
  );

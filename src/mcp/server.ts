// Stdio MCP server exposing the NecroCrew engine to Kiro Crew.
// Run: npm run mcp
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ASSIGNMENT_MODES, EngineError, SKILL_CATEGORIES } from '@/types';
import { necrocrewAssign, necrocrewSimulate } from '@/mcp/necroCrew';

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

function run(fn: () => unknown): ToolResult {
  try {
    return { content: [{ type: 'text', text: JSON.stringify(fn()) }] };
  } catch (e) {
    const message = e instanceof EngineError ? `${e.code}: ${e.message}` : 'Internal error';
    return { content: [{ type: 'text', text: message }], isError: true };
  }
}

const server = new McpServer({ name: 'necrocrew', version: '0.1.0' });

server.registerTool(
  necrocrewAssign.name,
  {
    description: necrocrewAssign.description,
    inputSchema: { projectId: z.string(), mode: z.enum(ASSIGNMENT_MODES as [string, ...string[]]) },
  },
  ({ projectId, mode }) => run(() => necrocrewAssign.handler({ projectId, mode: mode as (typeof ASSIGNMENT_MODES)[number] })),
);

server.registerTool(
  necrocrewSimulate.name,
  {
    description: necrocrewSimulate.description,
    inputSchema: {
      projectId: z.string(),
      assignments: z.array(
        z.object({
          projectId: z.string(),
          memberId: z.string(),
          allocatedRate: z.number(),
          assignedSkills: z.array(z.enum(SKILL_CATEGORIES as [string, ...string[]])),
        }),
      ),
    },
  },
  ({ projectId, assignments }) =>
    run(() =>
      necrocrewSimulate.handler({
        projectId,
        assignments: assignments as Parameters<typeof necrocrewSimulate.handler>[0]['assignments'],
      }),
    ),
);

server.connect(new StdioServerTransport()).catch((e: unknown) => {
  console.error('Failed to start NecroCrew MCP server', e);
  process.exit(1);
});
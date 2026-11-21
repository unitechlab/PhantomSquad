import type { Assignment, AssignmentMode, SimulationResult } from '@/types';
import { runAssign, runSimulate } from '@/lib/tools';

/** Tool adapter for Kiro Crew. Pure functions over JSON-serialisable input and output. */
export interface NecroCrewTool<I, O> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: I) => O;
}

export const necrocrewAssign: NecroCrewTool<{ projectId: string; mode: AssignmentMode }, SimulationResult> = {
  name: 'necrocrew_assign',
  description: 'Auto-assign the optimal squad to a project and return the simulation result.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string' },
      mode: { type: 'string', enum: ['Balanced', 'Speedrun', 'Minimal Squad'] },
    },
    required: ['projectId', 'mode'],
  },
  handler: ({ projectId, mode }) => runAssign(projectId, mode),
};

export const necrocrewSimulate: NecroCrewTool<{ projectId: string; assignments: Assignment[] }, SimulationResult> = {
  name: 'necrocrew_simulate',
  description: 'Simulate burndown and completion date for the given assignments.',
  inputSchema: {
    type: 'object',
    properties: { projectId: { type: 'string' }, assignments: { type: 'array', items: { type: 'object' } } },
    required: ['projectId', 'assignments'],
  },
  handler: ({ projectId, assignments }) => runSimulate(projectId, assignments),
};

export const NECROCREW_TOOLS = [necrocrewAssign, necrocrewSimulate] as const;
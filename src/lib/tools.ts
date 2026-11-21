import type { Assignment, AssignmentMode, SimulationResult } from '@/types';
import { ASSIGNMENT_MODES, EngineError } from '@/types';
import { SEED_MEMBERS, SEED_PROJECTS } from '@/data/seed';
import { autoAssign, validateAssignments } from '@/lib/assignmentEngine';
import { simulate } from '@/lib/simulationEngine';

/** Shared by the API routes and the MCP adapter. Operates on the seed data (stateless). */

function findProject(projectId: unknown): (typeof SEED_PROJECTS)[number] {
  const project = SEED_PROJECTS.find((p) => p.id === projectId);
  if (!project) throw new EngineError(`Unknown projectId: ${String(projectId)}`, 'UNKNOWN_PROJECT');
  return project;
}

export function isAssignmentMode(value: unknown): value is AssignmentMode {
  return typeof value === 'string' && (ASSIGNMENT_MODES as string[]).includes(value);
}

function isAssignment(value: unknown): value is Assignment {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.projectId === 'string' &&
    typeof v.memberId === 'string' &&
    typeof v.allocatedRate === 'number' &&
    Array.isArray(v.assignedSkills)
  );
}

export function runAssign(projectId: unknown, mode: unknown): SimulationResult {
  const project = findProject(projectId);
  if (!isAssignmentMode(mode)) throw new EngineError('Invalid mode', 'INVALID_MODE');
  const assignments = autoAssign(project, SEED_MEMBERS, mode);
  return simulate(project, SEED_MEMBERS, assignments);
}

export function runSimulate(projectId: unknown, assignments: unknown): SimulationResult {
  const project = findProject(projectId);
  if (!Array.isArray(assignments) || !assignments.every(isAssignment)) {
    throw new EngineError('Invalid assignments', 'INVALID_ASSIGNMENTS');
  }
  const valid = assignments.filter((a) => a.projectId === project.id);
  validateAssignments(SEED_MEMBERS, valid);
  return simulate(project, SEED_MEMBERS, valid);
}
import type { Assignment, AssignmentMode } from '@/types';
import { EngineError } from '@/types';
import { autoAssign } from '@/lib/assignmentEngine';
import { forecast, isRunning, type GameState } from '@/lib/gameEngine';

/**
 * Staffs every running quest that has nobody assigned, and re-staffs quests with a stalled stream
 * (a skill nobody is working on). Used by tests and balance checks.
 */
export function staffNewQuests(state: GameState, mode: AssignmentMode): GameState {
  let assignments: Record<string, Assignment[]> = state.assignments;
  for (const project of state.projects) {
    if (!isRunning(state, project)) continue;
    const current = assignments[project.id] ?? [];
    const stalled = current.length > 0 && forecast({ ...state, assignments }, project.id).stalledSkills.length > 0;
    if (current.length > 0 && !stalled) continue;
    const others = Object.entries(assignments)
      .filter(([id]) => id !== project.id)
      .flatMap(([, list]) => list);
    try {
      const next = autoAssign(project, state.members, mode, others);
      if (!stalled || forecast({ ...state, assignments: { ...assignments, [project.id]: next } }, project.id).stalledSkills.length < forecast({ ...state, assignments }, project.id).stalledSkills.length) {
        assignments = { ...assignments, [project.id]: next };
      }
    } catch (e) {
      if (!(e instanceof EngineError)) throw e;
    }
  }
  return assignments === state.assignments ? state : { ...state, assignments };
}
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { ASSIGNMENT_MODES } from '@/types';
import { autoAssign, loadByMember } from '@/lib/assignmentEngine';
import { staffNewQuests } from '@/lib/autopilot';
import { createGame, forecast, stepDay, type GameState } from '@/lib/gameEngine';
import { arbMembers, arbProjects } from './arbitraries';

const NUM_RUNS = 200;
const MAX_STEPS = 80;
const FORECAST_DAYS = 200;

/** The harness keeps the game running so invariants are checked past a win or a bankruptcy. */
function advance(s: GameState): GameState {
  return { ...stepDay(s), outcome: 'playing', lostReason: null };
}

const arbScenario = fc.record({
  members: arbMembers(),
  projects: arbProjects(),
  mode: fc.constantFrom(...ASSIGNMENT_MODES),
});

describe('Property 5: money is conserved', () => {
  it('funds change by exactly income - salaries - penalties, all non-negative integers', () => {
    // Invariant: funds' = funds + income - salaries - penalties
    fc.assert(
      fc.property(arbScenario, ({ members, projects, mode }) => {
        let s = createGame(members, projects, null);
        for (let i = 0; i < MAX_STEPS; i++) {
          const before = s.funds;
          s = advance(staffNewQuests(s, mode));
          const h = s.history[s.history.length - 1];
          const ints = [h.income, h.salaries, h.penalties, s.funds].every(Number.isInteger);
          if (!ints || h.income < 0 || h.salaries < 0 || h.penalties < 0) return false;
          if (s.funds !== before + h.income - h.salaries - h.penalties) return false;
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 6: work only goes down', () => {
  it('remaining work never increases or goes negative, and finished quests stay finished', () => {
    // Invariant: 0 <= remaining' <= remaining, per stream
    fc.assert(
      fc.property(arbScenario, ({ members, projects, mode }) => {
        let s = createGame(members, projects, null);
        for (let i = 0; i < MAX_STEPS; i++) {
          const prev = s;
          s = advance(staffNewQuests(s, mode));
          for (const p of projects) {
            const a = prev.runs[p.id];
            const b = s.runs[p.id];
            if (a.completedOnDay !== null && b.completedOnDay !== a.completedOnDay) return false;
            for (let k = 0; k < a.streams.length; k++) {
              if (b.streams[k].remaining < 0 || b.streams[k].remaining > a.streams[k].remaining) return false;
            }
          }
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 7: rewards are paid once', () => {
  it('each quest pays out at most once, only when every stream is done, and then frees its squad', () => {
    // Invariant: banished events per quest <= 1, and the quest's assignments are empty afterwards
    fc.assert(
      fc.property(arbScenario, ({ members, projects, mode }) => {
        let s = createGame(members, projects, null);
        for (let i = 0; i < MAX_STEPS; i++) s = advance(staffNewQuests(s, mode));
        const events = s.history.flatMap((h) => h.events).filter((e) => e.kind === 'banished');
        return projects.every((p) => {
          const paid = events.filter((e) => e.projectId === p.id).length;
          const run = s.runs[p.id];
          const done = run.completedOnDay !== null;
          const allZero = run.streams.every((x) => x.remaining === 0);
          return paid === (done ? 1 : 0) && done === allZero && (!done || (s.assignments[p.id] ?? []).length === 0);
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 8: capacity holds during play', () => {
  it('no member is ever allocated more than their capacity', () => {
    // Invariant: Σ allocatedRate per member <= capacity on every day
    fc.assert(
      fc.property(arbScenario, ({ members, projects, mode }) => {
        let s = createGame(members, projects, null);
        for (let i = 0; i < MAX_STEPS; i++) {
          s = advance(staffNewQuests(s, mode));
          const load = loadByMember(Object.values(s.assignments).flat());
          if (!members.every((m) => (load.get(m.id) ?? 0) <= m.capacity)) return false;
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 9: the forecast is honest', () => {
  it('with a fixed squad and no training, the predicted finish day equals the real one', () => {
    // Invariant: forecast.finishDay === completedOnDay (or both never happen)
    fc.assert(
      fc.property(arbScenario, ({ members, projects, mode }) => {
        const base = createGame(members, projects, null);
        const assignments: GameState['assignments'] = {};
        for (const p of projects) {
          try {
            const others = Object.values(assignments).flat();
            assignments[p.id] = autoAssign(p, members, mode, others);
          } catch {
            assignments[p.id] = [];
          }
        }
        let s: GameState = { ...base, assignments };
        const predicted = Object.fromEntries(projects.map((p) => [p.id, forecast(s, p.id).finishDay]));
        for (let i = 0; i < FORECAST_DAYS; i++) s = advance(s);
        // A forecast beyond the days we simulated cannot be checked.
        return projects.every((p) => {
          const day = predicted[p.id];
          return day !== null && day >= FORECAST_DAYS ? true : s.runs[p.id].completedOnDay === day;
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 10: the game is deterministic', () => {
  it('the same state always gives the same next state', () => {
    // Invariant: stepDay(s) deep-equals stepDay(s)
    fc.assert(
      fc.property(arbScenario, fc.integer({ min: 0, max: 30 }), ({ members, projects, mode }, days) => {
        let s = createGame(members, projects, null);
        for (let i = 0; i < days; i++) s = advance(staffNewQuests(s, mode));
        return JSON.stringify(stepDay(s)) === JSON.stringify(stepDay(s));
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

import { SEED_MEMBERS, ALL_PROJECTS } from '../src/data/seed';
import { createGame, stepDay } from '../src/lib/gameEngine';
import { staffNewQuests } from '../src/lib/autopilot';
import { GOAL_FUNDS } from '../src/lib/gameConfig';
import type { AssignmentMode } from '../src/types';

function play(mode: AssignmentMode | null) {
  let s = createGame(SEED_MEMBERS, ALL_PROJECTS);
  let minFunds = s.funds;
  while (s.outcome === 'playing') {
    if (mode) s = staffNewQuests(s, mode);
    s = stepDay(s);
    minFunds = Math.min(minFunds, s.funds);
  }
  const done = Object.values(s.runs).filter((r) => r.completedOnDay !== null).length;
  const late = Object.values(s.runs).filter((r) => r.penaltyPaid > 0).length;
  return `${String(mode).padEnd(13)} outcome=${s.outcome} day=${s.day} funds=${s.funds} (goal ${GOAL_FUNDS}) min=${minFunds} done=${done}/${ALL_PROJECTS.length} lateQuests=${late}`;
}
for (const m of [null, 'Balanced', 'Speedrun', 'Minimal Squad'] as const) console.log(play(m));
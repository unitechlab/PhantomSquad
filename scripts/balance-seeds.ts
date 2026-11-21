import { SEED_MEMBERS, ALL_PROJECTS } from '../src/data/seed';
import { createGame, stepDay, gameRank } from '../src/lib/gameEngine';
import { staffNewQuests } from '../src/lib/autopilot';
import type { AssignmentMode } from '../src/types';

function play(mode: AssignmentMode, seed: number) {
  let s = createGame(SEED_MEMBERS, ALL_PROJECTS, seed);
  while (s.outcome === 'playing') s = stepDay(staffNewQuests(s, mode));
  return s;
}
for (const mode of ['Speedrun', 'Balanced', 'Minimal Squad'] as const) {
  const runs = Array.from({ length: 200 }, (_, i) => play(mode, 1000 + i * 7919));
  const won = runs.filter((r) => r.outcome === 'won');
  const days = won.map((r) => r.day).sort((a, b) => a - b);
  const funds = runs.map((r) => r.funds).sort((a, b) => a - b);
  const ranks: Record<string, number> = {};
  for (const r of runs) ranks[gameRank(r)] = (ranks[gameRank(r)] ?? 0) + 1;
  console.log(mode.padEnd(14), 'win', won.length + '/200', 'winDay min/med/max', days[0], days[Math.floor(days.length / 2)], days[days.length - 1], 'funds med', funds[100], 'ranks', JSON.stringify(ranks));
}
const base = play('Speedrun', null as unknown as number);
console.log('no-incident Speedrun', base.outcome, base.day, base.funds);

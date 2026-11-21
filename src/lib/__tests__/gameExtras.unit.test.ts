import { describe, expect, it } from 'vitest';
import { ALL_PROJECTS, SEED_MEMBERS, SEED_PROJECTS } from '@/data/seed';
import { autoAssign } from '@/lib/assignmentEngine';
import {
  COMBO_BONUS_RATE,
  COMBO_WINDOW_DAYS,
  GLITCH_WORKLOAD,
  GOAL_FUNDS,
  MILESTONES,
  RANK_A_MAX_DAY,
  RANK_S_MAX_DAY,
  SPONSOR_AMOUNT,
} from '@/lib/gameConfig';
import { comboStatus, createGame, gameRank, mostValuable, remainingWork, stepDay, type GameState } from '@/lib/gameEngine';
import type { Project } from '@/types';

const HAUNTED = SEED_PROJECTS[0];

function staffed(seed: number | null): GameState {
  const game = createGame(SEED_MEMBERS, [HAUNTED], seed);
  return { ...game, assignments: { [HAUNTED.id]: autoAssign(HAUNTED, game.members, 'Speedrun') } };
}

/** A quest small enough to finish on its first day. */
const TINY: Project = {
  ...HAUNTED,
  id: 'tiny',
  title: 'Tiny',
  requiredSkills: [{ skillName: 'AR', minLevel: 1, workload: 0.5, headcount: 1 }],
  totalWorkload: 0.5,
  reward: 1000,
  priority: 'Normal',
  startDate: '2026-10-19',
  deadline: '2026-10-19',
};

function tinyGame(): GameState {
  const game = createGame(SEED_MEMBERS, [TINY], null);
  return { ...game, assignments: { tiny: autoAssign(TINY, game.members, 'Speedrun') } };
}

describe('combo', () => {
  it('pays no bonus for the first quest of a chain', () => {
    const s = stepDay(tinyGame());
    const e = s.history[0].events.find((x) => x.kind === 'banished');
    expect(e?.combo).toBe(1);
    expect(e?.bonus).toBe(0);
  });
  it('adds a share of the reward for each step of an ongoing chain', () => {
    const g = { ...tinyGame(), combo: 2, lastBanishDay: 0 };
    const s = stepDay(g);
    const e = s.history[0].events.find((x) => x.kind === 'banished');
    expect(e?.combo).toBe(3);
    expect(e?.bonus).toBe(Math.round(1000 * COMBO_BONUS_RATE * 2));
  });
  it('restarts the chain when the window has passed', () => {
    const g = { ...tinyGame(), combo: 3, lastBanishDay: -(COMBO_WINDOW_DAYS + 1) };
    const e = stepDay(g).history[0].events.find((x) => x.kind === 'banished');
    expect(e?.combo).toBe(1);
    expect(e?.bonus).toBe(0);
  });
  it('reports the chain that can still be extended', () => {
    const s = stepDay(tinyGame());
    expect(comboStatus(s)).toEqual({ count: 1, daysLeft: COMBO_WINDOW_DAYS });
    expect(comboStatus({ ...s, day: s.day + COMBO_WINDOW_DAYS })).toBeNull();
    expect(comboStatus(createGame(SEED_MEMBERS, [], null))).toBeNull();
  });
});

describe('incidents', () => {
  function firstIncident(kind: 'moon' | 'glitch' | 'sponsor'): { seed: number; game: GameState } {
    for (let seed = 1; seed < 2000; seed++) {
      let g = staffed(seed);
      for (let d = 0; d < 12 && g.outcome === 'playing'; d++) {
        g = stepDay(g);
        if (g.history[g.history.length - 1].events.some((e) => e.kind === 'incident' && e.incident === kind)) return { seed, game: g };
      }
    }
    throw new Error(`no seed produced ${kind}`);
  }
  it('replays the same campaign for the same seed', () => {
    const run = (): GameState => {
      let g = staffed(4242);
      for (let i = 0; i < 20; i++) g = stepDay(g);
      return g;
    };
    expect(run().history).toEqual(run().history);
  });
  it('never happens when the seed is null', () => {
    let g = staffed(null);
    for (let i = 0; i < 40 && g.outcome === 'playing'; i++) g = stepDay(g);
    expect(g.history.some((h) => h.events.some((e) => e.kind === 'incident'))).toBe(false);
  });
  it('a sponsor adds its amount to the day income', () => {
    const { game } = firstIncident('sponsor');
    const day = game.history[game.history.length - 1];
    expect(day.income).toBeGreaterThanOrEqual(SPONSOR_AMOUNT);
  });
  it('a ghost glitch adds work to a stream of a running quest', () => {
    const { game } = firstIncident('glitch');
    const total = game.runs[HAUNTED.id].streams.reduce((sum, s) => sum + s.total, 0);
    expect(total).toBe(HAUNTED.totalWorkload + GLITCH_WORKLOAD);
  });
  it('a full moon speeds work up for its days', () => {
    const { seed, game } = firstIncident('moon');
    expect(game.moonDaysLeft).toBeGreaterThan(0);
    const before = remainingWork(game.runs[HAUNTED.id]);
    const boosted = stepDay(game);
    const plain = stepDay({ ...game, moonDaysLeft: 0, seed: null });
    expect(seed).toBeGreaterThan(0);
    expect(before - remainingWork(boosted.runs[HAUNTED.id])).toBeGreaterThan(before - remainingWork(plain.runs[HAUNTED.id]));
  });
});

describe('milestones', () => {
  it('fires once when funds first reach a milestone', () => {
    const g = { ...createGame(SEED_MEMBERS, [], null), funds: MILESTONES[0] + 10 };
    const once = stepDay(g);
    expect(once.milestones).toEqual([MILESTONES[0]]);
    expect(once.history[0].events.some((e) => e.kind === 'milestone' && e.amount === MILESTONES[0])).toBe(true);
    const twice = stepDay(once);
    expect(twice.history[1].events.some((e) => e.kind === 'milestone')).toBe(false);
  });
});

describe('gameRank', () => {
  const base = createGame(SEED_MEMBERS, ALL_PROJECTS, null);
  it('ranks a win by the day it happened', () => {
    expect(gameRank({ ...base, outcome: 'won', day: RANK_S_MAX_DAY })).toBe('S');
    expect(gameRank({ ...base, outcome: 'won', day: RANK_A_MAX_DAY })).toBe('A');
    expect(gameRank({ ...base, outcome: 'won', day: RANK_A_MAX_DAY + 1 })).toBe('B');
  });
  it('gives a near miss B and anything else C', () => {
    expect(gameRank({ ...base, outcome: 'lost', funds: GOAL_FUNDS * 0.95 })).toBe('B');
    expect(gameRank({ ...base, outcome: 'lost', funds: 1000 })).toBe('C');
  });
});

describe('mostValuable', () => {
  it('is null before anyone worked', () => {
    expect(mostValuable(createGame(SEED_MEMBERS, ALL_PROJECTS, null))).toBeNull();
  });
  it('adds up to the work that was done, and names the top creator', () => {
    let g = staffed(null);
    for (let i = 0; i < 6; i++) g = stepDay(g);
    const done = g.history.reduce((sum, h) => sum + Object.values(h.work).reduce((a, b) => a + (b ?? 0), 0), 0);
    const credited = Object.values(g.contribution).reduce((a, b) => a + b, 0);
    expect(credited).toBeCloseTo(done, 6);
    const top = mostValuable(g);
    expect(top).not.toBeNull();
    expect(Math.max(...Object.values(g.contribution))).toBe(top?.work);
  });
});

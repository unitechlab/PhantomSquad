import { describe, expect, it } from 'vitest';
import { SEED_MEMBERS, SEED_PROJECTS, ALL_PROJECTS } from '@/data/seed';
import {
  addProject,
  canTrain,
  createGame,
  dayIndex,
  forecast,
  memberActivity,
  startTraining,
  stepDay,
  type GameState,
} from '@/lib/gameEngine';
import { staffNewQuests } from '@/lib/autopilot';
import { autoAssign } from '@/lib/assignmentEngine';
import {
  EARLY_BONUS_MAX_DAYS,
  EARLY_BONUS_RATE,
  GAME_DAYS,
  GOAL_FUNDS,
  LATE_PENALTY_CAP,
  LATE_PENALTY_RATE,
  START_FUNDS,
  TRAIN_DAYS,
  computeReward,
  trainingCost,
} from '@/lib/gameConfig';
import { EngineError } from '@/types';
import type { Project } from '@/types';

const HAUNTED = SEED_PROJECTS[0];

function staffed(projectId: string, mode: 'Speedrun' | 'Balanced' = 'Speedrun'): GameState {
  const game = createGame(SEED_MEMBERS, ALL_PROJECTS);
  const project = game.projects.find((p) => p.id === projectId) as Project;
  return { ...game, assignments: { [projectId]: autoAssign(project, game.members, mode) } };
}

function playUntil(state: GameState, done: (s: GameState) => boolean, maxDays = 200): GameState {
  let s = state;
  for (let i = 0; i < maxDays && !done(s); i++) s = { ...stepDay(s), outcome: 'playing', lostReason: null };
  return s;
}

describe('createGame', () => {
  it('starts on day 0 with the start funds and one run per project', () => {
    const g = createGame(SEED_MEMBERS, ALL_PROJECTS);
    expect(g.day).toBe(0);
    expect(g.funds).toBe(START_FUNDS);
    expect(Object.keys(g.runs)).toHaveLength(ALL_PROJECTS.length);
    expect(g.projects.filter((p) => p.status === 'Active')).toHaveLength(3);
  });
  it('rewards follow the formula', () => {
    expect(HAUNTED.reward).toBe(computeReward(HAUNTED.totalWorkload, 'Critical'));
  });
});

describe('stepDay', () => {
  it('moves one day forward and records the day', () => {
    const next = stepDay(staffed(HAUNTED.id));
    expect(next.day).toBe(1);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].day).toBe(0);
  });

  it('with nobody assigned, work and salaries stay at zero', () => {
    const next = stepDay(createGame(SEED_MEMBERS, ALL_PROJECTS));
    expect(next.history[0].salaries).toBe(0);
    expect(Object.values(next.history[0].work).every((w) => w === 0)).toBe(true);
  });

  it('pays salaries in proportion to allocation', () => {
    const g = staffed(HAUNTED.id);
    const expected = g.assignments[HAUNTED.id].reduce(
      (sum, a) => sum + (g.members.find((m) => m.id === a.memberId)?.dailyCost ?? 0) * (a.allocatedRate / 100),
      0,
    );
    expect(stepDay(g).history[0].salaries).toBe(Math.round(expected));
  });

  it('pays the reward once, frees the squad and marks the quest Banished', () => {
    const done = playUntil(staffed(HAUNTED.id), (s) => s.runs[HAUNTED.id].completedOnDay !== null);
    const run = done.runs[HAUNTED.id];
    expect(run.completedOnDay).not.toBeNull();
    expect(done.assignments[HAUNTED.id]).toEqual([]);
    expect(done.projects.find((p) => p.id === HAUNTED.id)?.status).toBe('Banished');
    const payouts = done.history.flatMap((h) => h.events).filter((e) => e.kind === 'banished');
    expect(payouts).toHaveLength(1);
  });

  it('releases a creator once all their streams are done, while the quest is still open', () => {
    const g = staffed(HAUNTED.id);
    const directorOwner = g.assignments[HAUNTED.id].find((a) => a.assignedSkills.includes('Director'))!.memberId;
    const s = playUntil(g, (x) => x.runs[HAUNTED.id].streams.find((st) => st.skillName === 'Director')!.remaining === 0);
    expect(s.runs[HAUNTED.id].completedOnDay).toBeNull();
    expect(s.assignments[HAUNTED.id].some((a) => a.memberId === directorOwner)).toBe(false);
  });

  it('adds an early bonus per full day before the deadline, up to the cap', () => {
    const done = playUntil(staffed(HAUNTED.id), (s) => s.runs[HAUNTED.id].completedOnDay !== null);
    const finishDay = done.runs[HAUNTED.id].completedOnDay as number;
    const early = Math.max(0, Math.min(EARLY_BONUS_MAX_DAYS, dayIndex(HAUNTED.deadline) - finishDay));
    const payout = done.history.flatMap((h) => h.events).find((e) => e.kind === 'banished')?.amount;
    expect(payout).toBe(HAUNTED.reward + Math.round(HAUNTED.reward * EARLY_BONUS_RATE * early));
    expect(early).toBeGreaterThan(0);
  });

  it('charges a late penalty per day after the deadline, capped', () => {
    const late: Project = { ...HAUNTED, id: 'late', deadline: HAUNTED.startDate };
    const g0 = addProject(createGame(SEED_MEMBERS, []), late);
    const g = { ...g0, funds: 1_000_000, assignments: { late: autoAssign(late, g0.members, 'Balanced') } };
    const after = playUntil(g, (s) => s.runs.late.completedOnDay !== null);
    const perDay = Math.round(late.reward * LATE_PENALTY_RATE);
    expect(after.history[0].penalties).toBe(0); // the deadline day itself is still on time
    expect(after.history[1].penalties).toBe(perDay);
    expect(after.runs.late.penaltyPaid).toBeLessThanOrEqual(Math.round(late.reward * LATE_PENALTY_CAP));
  });

  it('ends the game as lost when funds go below zero', () => {
    const g = { ...staffed(HAUNTED.id), funds: 100 };
    const s = stepDay(g);
    expect(s.outcome).toBe('lost');
    expect(s.lostReason).toBe('bankrupt');
  });

  it('ends the game as won when funds reach the goal', () => {
    const g = { ...staffed(HAUNTED.id), funds: GOAL_FUNDS + 10_000 };
    expect(stepDay(g).outcome).toBe('won');
  });

  it('ends the game as soon as every quest is banished and the goal is out of reach', () => {
    const game = createGame(SEED_MEMBERS, [HAUNTED]);
    const start = { ...game, assignments: { [HAUNTED.id]: autoAssign(HAUNTED, game.members, 'Speedrun') } };
    let s = start;
    for (let i = 0; i < GAME_DAYS && s.outcome === 'playing'; i++) s = stepDay(s);
    expect(s.runs[HAUNTED.id].completedOnDay).not.toBeNull();
    expect(s.outcome).toBe('lost');
    expect(s.lostReason).toBe('cleared');
    expect(s.day).toBeLessThan(GAME_DAYS);
  });
  it('ends the game as lost when time runs out', () => {
    const g = { ...createGame(SEED_MEMBERS, []), day: GAME_DAYS - 1 };
    const s = stepDay(g);
    expect(s.outcome).toBe('lost');
    expect(s.lostReason).toBe('timeup');
  });

  it('does nothing after the game is over', () => {
    const over = { ...createGame(SEED_MEMBERS, ALL_PROJECTS), outcome: 'won' as const };
    expect(stepDay(over)).toBe(over);
  });

  it('is deterministic', () => {
    const g = staffed(HAUNTED.id);
    expect(stepDay(g)).toEqual(stepDay(g));
  });
});

describe('training', () => {
  const luna = SEED_MEMBERS[0];
  const mint = SEED_MEMBERS.find((m) => m.id === 'mint')!;
  const level = (g: GameState, id: string, skill: string): number =>
    g.members.find((m) => m.id === id)!.skills.find((s) => s.skillName === skill)!.level;

  it('costs funds immediately and raises the level after TRAIN_DAYS', () => {
    let g = createGame(SEED_MEMBERS, ALL_PROJECTS);
    g = startTraining(g, mint.id, 'VR');
    expect(g.funds).toBe(START_FUNDS - trainingCost(3));
    for (let i = 0; i < TRAIN_DAYS - 1; i++) g = stepDay(g);
    expect(level(g, mint.id, 'VR')).toBe(3);
    g = stepDay(g);
    expect(level(g, mint.id, 'VR')).toBe(4);
    expect(g.training[mint.id]).toBeUndefined();
  });

  it('a training member produces no output', () => {
    const g0 = staffed('cyber-ghost-vr');
    const worker = g0.assignments['cyber-ghost-vr'][0].memberId;
    const trainee = startTraining(g0, worker, 'AR');
    expect(memberActivity(trainee, worker).kind).toBe('training');
    const normal = stepDay(g0).history[0].work;
    const trained = stepDay(trainee).history[0].work;
    const sum = (w: Record<string, number | undefined>): number => Object.values(w).reduce<number>((a, b) => a + (b ?? 0), 0);
    expect(sum(trained)).toBeLessThan(sum(normal));
  });

  it('rejects max level, double training and lack of funds', () => {
    const g = createGame(SEED_MEMBERS, ALL_PROJECTS);
    expect(canTrain(g, luna.id, 'AR')).toMatch(/max/i);
    expect(canTrain({ ...g, funds: 10 }, mint.id, 'VR')).toMatch(/funds/i);
    const busy = startTraining(g, mint.id, 'VR');
    expect(canTrain(busy, mint.id, 'AR')).toMatch(/already/i);
    expect(() => startTraining({ ...g, funds: 10 }, mint.id, 'VR')).toThrow(EngineError);
  });
});

describe('forecast', () => {
  it('reports skills nobody is working on', () => {
    const g = createGame(SEED_MEMBERS, ALL_PROJECTS);
    expect(forecast(g, HAUNTED.id).finishDay).toBeNull();
    expect(forecast(g, HAUNTED.id).stalledSkills).toHaveLength(3);
  });
  it('matches the actual finish day', () => {
    const g = staffed(HAUNTED.id);
    const predicted = forecast(g, HAUNTED.id).finishDay;
    const done = playUntil(g, (s) => s.runs[HAUNTED.id].completedOnDay !== null);
    expect(done.runs[HAUNTED.id].completedOnDay).toBe(predicted);
  });
});

describe('balance baseline', () => {
  /** Staffs every new quest with one mode and plays to the end. */
  function autopilot(mode: 'Speedrun' | 'Balanced' | 'Minimal Squad'): GameState {
    let s = createGame(SEED_MEMBERS, ALL_PROJECTS);
    while (s.outcome === 'playing') s = stepDay(staffNewQuests(s, mode));
    return s;
  }
  const banished = (s: GameState): number => Object.values(s.runs).filter((r) => r.completedOnDay !== null).length;

  it('Speedrun on every quest reaches the goal and finishes all quests', () => {
    const s = autopilot('Speedrun');
    expect(s.outcome).toBe('won');
    expect(banished(s)).toBe(ALL_PROJECTS.length);
  });
  it('Balanced on every quest survives but ends short of the goal', () => {
    const s = autopilot('Balanced');
    expect(s.outcome).toBe('lost');
    expect(s.lostReason).toBe('cleared');
    expect(banished(s)).toBeGreaterThanOrEqual(5);
  });
  it('Minimal Squad on every quest runs out of money before the first reward', () => {
    const s = autopilot('Minimal Squad');
    expect(s.lostReason).toBe('bankrupt');
  });
  it('doing nothing loses', () => {
    let s = createGame(SEED_MEMBERS, ALL_PROJECTS);
    while (s.outcome === 'playing') s = stepDay(s);
    expect(s.outcome).toBe('lost');
  });
});


import type { Assignment, Member, Project, SkillCategory } from '@/types';
import { EngineError } from '@/types';
import { dailyOutput } from '@/lib/assignmentEngine';
import { DAY_EPSILON, addDays, dayDiff } from '@/lib/simulationEngine';
import {
  COMBO_BONUS_RATE,
  COMBO_MAX_STEPS,
  COMBO_WINDOW_DAYS,
  DEFAULT_SEED,
  GLITCH_WORKLOAD,
  INCIDENT_CHANCE,
  INCIDENT_FIRST_DAY,
  MILESTONES,
  MOON_BOOST,
  MOON_DAYS,
  RANK_A_MAX_DAY,
  RANK_NEAR_MISS,
  RANK_S_MAX_DAY,
  SPONSOR_AMOUNT,
  EARLY_BONUS_MAX_DAYS,
  EARLY_BONUS_RATE,
  GAME_DAYS,
  GAME_START_DATE,
  GOAL_FUNDS,
  LATE_PENALTY_CAP,
  LATE_PENALTY_RATE,
  MAX_SKILL_LEVEL,
  START_FUNDS,
  TRAIN_DAYS,
  trainingCost,
} from '@/lib/gameConfig';

/** Pure, day-by-day game rules. No React, no randomness: the same state always gives the same next day. */

export interface StreamRun {
  skillName: SkillCategory;
  total: number;
  remaining: number;
}

export interface ProjectRun {
  projectId: string;
  streams: StreamRun[];
  /** Day index on which the last stream finished, or null while open. */
  completedOnDay: number | null;
  penaltyPaid: number;
}

export interface Training {
  skill: SkillCategory;
  daysLeft: number;
}

export type GameOutcome = 'playing' | 'won' | 'lost';
export type LostReason = 'bankrupt' | 'timeup' | 'cleared';

export type IncidentKind = 'moon' | 'glitch' | 'sponsor';
export interface GameEvent {
  kind: 'started' | 'banished' | 'late' | 'trained' | 'incident' | 'milestone';
  incident?: IncidentKind;
  /** Position in the combo chain on a banished event (1 = no chain). */
  combo?: number;
  /** Combo share of the payout on a banished event. */
  bonus?: number;
  projectId?: string;
  memberId?: string;
  skill?: SkillCategory;
  amount?: number;
}

export interface DaySummary {
  /** Day index that was worked (0 = first day). */
  day: number;
  income: number;
  salaries: number;
  penalties: number;
  funds: number;
  work: Partial<Record<SkillCategory, number>>;
  events: GameEvent[];
}

export interface GameState {
  /** Days already played. The next step works on this day index. */
  day: number;
  funds: number;
  members: Member[];
  projects: Project[];
  assignments: Record<string, Assignment[]>;
  runs: Record<string, ProjectRun>;
  training: Record<string, Training>;
  outcome: GameOutcome;
  lostReason: LostReason | null;
  history: DaySummary[];
  /** Drives the random incidents. null turns incidents off (used by the rule-level property tests). */
  seed: number | null;
  /** Length of the current banish chain, and the day index of its last quest (null before the first). */
  combo: number;
  lastBanishDay: number | null;
  /** Days of the Full Moon boost still to come. */
  moonDaysLeft: number;
  /** Person-days of work done per creator, for the MVP. */
  contribution: Record<string, number>;
  /** Milestones already celebrated. */
  milestones: number[];
}

export function dayIndex(date: string): number {
  return dayDiff(GAME_START_DATE, date);
}

export function dayToDate(day: number): string {
  return addDays(GAME_START_DATE, day);
}

export const projectStartDay = (p: Project): number => dayIndex(p.startDate);
export const projectDeadlineDay = (p: Project): number => dayIndex(p.deadline);

export function createRun(project: Project): ProjectRun {
  return {
    projectId: project.id,
    streams: project.requiredSkills.map((r) => ({ skillName: r.skillName, total: r.workload, remaining: r.workload })),
    completedOnDay: null,
    penaltyPaid: 0,
  };
}

export function createGame(members: Member[], projects: Project[], seed: number | null = DEFAULT_SEED): GameState {
  const state: GameState = {
    day: 0,
    funds: START_FUNDS,
    members,
    projects: projects.map((p) => ({ ...p, status: 'Pending' })),
    assignments: {},
    runs: Object.fromEntries(projects.map((p) => [p.id, createRun(p)])),
    training: {},
    outcome: 'playing',
    lostReason: null,
    history: [],
    seed,
    combo: 0,
    lastBanishDay: null,
    moonDaysLeft: 0,
    contribution: {},
    milestones: [],
  };
  return { ...state, projects: refreshStatuses(state) };
}

export function addProject(state: GameState, project: Project): GameState {
  const next = {
    ...state,
    projects: [...state.projects, { ...project, status: 'Pending' as const }],
    runs: { ...state.runs, [project.id]: createRun(project) },
  };
  return { ...next, projects: refreshStatuses(next) };
}

function refreshStatuses(state: GameState): Project[] {
  return state.projects.map((p) => {
    const run = state.runs[p.id];
    const status: Project['status'] = run?.completedOnDay != null ? 'Banished' : projectStartDay(p) <= state.day ? 'Active' : 'Pending';
    return p.status === status ? p : { ...p, status };
  });
}

const isOpen = (s: StreamRun): boolean => s.remaining > DAY_EPSILON;

export function isRunning(state: GameState, project: Project): boolean {
  const run = state.runs[project.id];
  return run !== undefined && run.completedOnDay === null && projectStartDay(project) <= state.day;
}

export interface Activity {
  kind: 'training' | 'working' | 'idle';
  skill?: SkillCategory;
  projectId?: string;
}

/** What a member is doing on the next working day. Shared by the field view and the day step. */
export function memberActivity(state: GameState, memberId: string): Activity {
  const training = state.training[memberId];
  if (training) return { kind: 'training', skill: training.skill };
  for (const project of state.projects) {
    if (!isRunning(state, project)) continue;
    const a = state.assignments[project.id]?.find((x) => x.memberId === memberId);
    if (!a) continue;
    const stream = state.runs[project.id].streams.find((s) => isOpen(s) && a.assignedSkills.includes(s.skillName));
    if (stream) return { kind: 'working', skill: stream.skillName, projectId: project.id };
  }
  return { kind: 'idle' };
}

/** Who produces how much on one stream today (before the Full Moon boost). */
function streamParts(state: GameState, projectId: string, skill: SkillCategory): { memberId: string; out: number }[] {
  const byId = new Map(state.members.map((m) => [m.id, m]));
  const parts: { memberId: string; out: number }[] = [];
  for (const a of state.assignments[projectId] ?? []) {
    if (!a.assignedSkills.includes(skill) || state.training[a.memberId]) continue;
    const m = byId.get(a.memberId);
    if (m) parts.push({ memberId: m.id, out: dailyOutput(m, skill, a.allocatedRate / a.assignedSkills.length) });
  }
  return parts;
}

function streamOutputToday(state: GameState, projectId: string, skill: SkillCategory): number {
  return streamParts(state, projectId, skill).reduce((sum, x) => sum + x.out, 0);
}

/** Deterministic number in [0, 1) from the seed, the day and a salt. */
export function rollUnit(seed: number, day: number, salt: number): number {
  let h = (seed ^ Math.imul(day + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** The chain the player can still extend, or null. `daysLeft` counts the day about to be worked. */
export function comboStatus(state: Pick<GameState, 'day' | 'lastBanishDay' | 'combo'>): { count: number; daysLeft: number } | null {
  if (state.lastBanishDay === null || state.combo < 1) return null;
  const daysLeft = COMBO_WINDOW_DAYS - (state.day - state.lastBanishDay) + 1;
  return daysLeft > 0 ? { count: state.combo, daysLeft } : null;
}

export type Rank = 'S' | 'A' | 'B' | 'C';
/** S/A/B for a win by speed; B for a near miss (at least 90% of the goal); C otherwise. */
export function gameRank(state: GameState): Rank {
  if (state.outcome === 'won') return state.day <= RANK_S_MAX_DAY ? 'S' : state.day <= RANK_A_MAX_DAY ? 'A' : 'B';
  return state.funds >= GOAL_FUNDS * RANK_NEAR_MISS ? 'B' : 'C';
}

/** The creator with the most person-days of finished work, or null before anyone worked. */
export function mostValuable(state: GameState): { memberId: string; work: number } | null {
  let best: { memberId: string; work: number } | null = null;
  for (const m of state.members) {
    const work = state.contribution[m.id] ?? 0;
    if (work > DAY_EPSILON && (best === null || work > best.work)) best = { memberId: m.id, work };
  }
  return best;
}
export function stepDay(state: GameState): GameState {
  if (state.outcome !== 'playing') return state;
  const day = state.day;

  const runs: Record<string, ProjectRun> = { ...state.runs };
  const assignments: Record<string, Assignment[]> = { ...state.assignments };
  const work: Partial<Record<SkillCategory, number>> = {};
  const paidShare = new Map<string, number>();
  const events: GameEvent[] = [];
  let income = 0;
  let penalties = 0;
  const contribution: Record<string, number> = { ...state.contribution };
  let combo = state.combo;
  let lastBanishDay = state.lastBanishDay;

  // Random incident of the day, drawn from the seed so the same seed replays the same campaign.
  const baseRuns: Record<string, ProjectRun> = { ...state.runs };
  let incident: IncidentKind | null = null;
  const seed = state.seed;
  if (seed !== null && day >= INCIDENT_FIRST_DAY && state.moonDaysLeft === 0 && rollUnit(seed, day, 1) < INCIDENT_CHANCE) {
    const pick = rollUnit(seed, day, 2);
    incident = pick < 1 / 3 ? 'moon' : pick < 2 / 3 ? 'glitch' : 'sponsor';
  }
  if (incident === 'glitch' && seed !== null) {
    const open = state.projects.filter((p) => isRunning(state, p) && baseRuns[p.id].streams.some(isOpen));
    if (open.length === 0) {
      incident = null;
    } else {
      const target = open[Math.floor(rollUnit(seed, day, 3) * open.length)];
      const openStreams = baseRuns[target.id].streams.filter(isOpen);
      const hit = openStreams[Math.floor(rollUnit(seed, day, 4) * openStreams.length)];
      baseRuns[target.id] = {
        ...baseRuns[target.id],
        streams: baseRuns[target.id].streams.map((s) =>
          s === hit ? { ...s, total: s.total + GLITCH_WORKLOAD, remaining: s.remaining + GLITCH_WORKLOAD } : s,
        ),
      };
      events.push({ kind: 'incident', incident: 'glitch', projectId: target.id, skill: hit.skillName, amount: GLITCH_WORKLOAD });
    }
  }
  if (incident === 'sponsor') {
    income += SPONSOR_AMOUNT;
    events.push({ kind: 'incident', incident: 'sponsor', amount: SPONSOR_AMOUNT });
  }
  if (incident === 'moon') events.push({ kind: 'incident', incident: 'moon' });
  const boost = incident === 'moon' || state.moonDaysLeft > 0 ? MOON_BOOST : 1;
  const moonDaysLeft = incident === 'moon' ? MOON_DAYS - 1 : Math.max(0, state.moonDaysLeft - 1);

  for (const project of state.projects) {
    const run = baseRuns[project.id];
    if (!run || run.completedOnDay !== null) continue;
    const startDay = projectStartDay(project);
    if (startDay > day) continue;
    if (startDay === day) events.push({ kind: 'started', projectId: project.id });

    const list = state.assignments[project.id] ?? [];
    // Salaries cover everyone who still has open work in their assigned streams today.
    for (const a of list) {
      const hasOpen = run.streams.some((s) => isOpen(s) && a.assignedSkills.includes(s.skillName));
      if (hasOpen) paidShare.set(a.memberId, (paidShare.get(a.memberId) ?? 0) + a.allocatedRate / 100);
    }

    const streams = run.streams.map((s) => {
      if (!isOpen(s)) return s;
      const parts = streamParts(state, project.id, s.skillName);
      const output = parts.reduce((sum, x) => sum + x.out, 0) * boost;
      const done = Math.min(output, s.remaining);
      if (output > 0) for (const x of parts) contribution[x.memberId] = (contribution[x.memberId] ?? 0) + (x.out * boost * done) / output;
      work[s.skillName] = (work[s.skillName] ?? 0) + done;
      const remaining = s.remaining - done;
      return { ...s, remaining: remaining <= DAY_EPSILON ? 0 : remaining };
    });

    const finished = streams.length > 0 && streams.every((s) => !isOpen(s));
    const deadlineDay = projectDeadlineDay(project);
    let penaltyPaid = run.penaltyPaid;

    if (day > deadlineDay) {
      const cap = Math.round(project.reward * LATE_PENALTY_CAP);
      const penalty = Math.max(0, Math.min(Math.round(project.reward * LATE_PENALTY_RATE), cap - penaltyPaid));
      if (penalty > 0) {
        penalties += penalty;
        penaltyPaid += penalty;
        events.push({ kind: 'late', projectId: project.id, amount: penalty });
      }
    }

    if (finished) {
      const earlyDays = Math.max(0, Math.min(EARLY_BONUS_MAX_DAYS, deadlineDay - day));
      const chained = lastBanishDay !== null && day - lastBanishDay <= COMBO_WINDOW_DAYS;
      combo = chained ? combo + 1 : 1;
      lastBanishDay = day;
      const comboBonus = Math.round(project.reward * COMBO_BONUS_RATE * Math.min(combo - 1, COMBO_MAX_STEPS));
      const payout = project.reward + Math.round(project.reward * EARLY_BONUS_RATE * earlyDays) + comboBonus;
      income += payout;
      events.push({ kind: 'banished', projectId: project.id, amount: payout, combo, bonus: comboBonus });
      assignments[project.id] = []; // the squad is free for the next quest
      runs[project.id] = { ...run, streams, completedOnDay: day, penaltyPaid };
    } else {
      runs[project.id] = { ...run, streams, penaltyPaid };
      // A creator whose streams are all done is released, so the next quest can use them.
      const keep = list.filter((a) => a.assignedSkills.some((sk) => streams.some((s) => s.skillName === sk && isOpen(s))));
      if (keep.length !== list.length) assignments[project.id] = keep;
    }
  }

  let salaries = 0;
  for (const m of state.members) salaries += m.dailyCost * Math.min(1, paidShare.get(m.id) ?? 0);
  salaries = Math.round(salaries);

  // Training: the day just worked counts, and the level rises when the last day ends.
  const training: Record<string, Training> = {};
  let members = state.members;
  for (const [memberId, t] of Object.entries(state.training)) {
    const daysLeft = t.daysLeft - 1;
    if (daysLeft > 0) {
      training[memberId] = { ...t, daysLeft };
      continue;
    }
    members = members.map((m) =>
      m.id === memberId
        ? { ...m, skills: m.skills.map((s) => (s.skillName === t.skill ? { ...s, level: Math.min(MAX_SKILL_LEVEL, s.level + 1) } : s)) }
        : m,
    );
    events.push({ kind: 'trained', memberId, skill: t.skill });
  }

  const funds = state.funds + income - salaries - penalties;
  const milestones = [...state.milestones];
  for (const m of MILESTONES) {
    if (funds >= m && !milestones.includes(m)) {
      milestones.push(m);
      events.push({ kind: 'milestone', amount: m });
    }
  }
  const nextDay = day + 1;
  let outcome: GameOutcome = 'playing';
  let lostReason: LostReason | null = null;
  if (funds < 0) {
    outcome = 'lost';
    lostReason = 'bankrupt';
  } else if (funds >= GOAL_FUNDS) {
    outcome = 'won';
  } else if (state.projects.length > 0 && state.projects.every((p) => runs[p.id]?.completedOnDay != null)) {
    // Nothing is left to earn, so waiting out the calendar would only drain the player's patience.
    outcome = 'lost';
    lostReason = 'cleared';
  } else if (nextDay >= GAME_DAYS) {
    outcome = 'lost';
    lostReason = 'timeup';
  }

  const next: GameState = {
    ...state,
    day: nextDay,
    funds,
    members,
    assignments,
    runs,
    training,
    outcome,
    lostReason,
    combo,
    lastBanishDay,
    moonDaysLeft,
    contribution,
    milestones,
    history: [...state.history, { day, income, salaries, penalties, funds, work, events }],
  };
  return { ...next, projects: refreshStatuses(next) };
}

export function canTrain(state: GameState, memberId: string, skill: SkillCategory): string | null {
  const member = state.members.find((m) => m.id === memberId);
  if (!member) return 'Unknown member';
  if (state.outcome !== 'playing') return 'The game is over';
  if (state.training[memberId]) return `${member.name} is already training`;
  const level = member.skills.find((s) => s.skillName === skill)?.level ?? 0;
  if (level >= MAX_SKILL_LEVEL) return 'Already at max level';
  if (state.funds < trainingCost(level)) return 'Not enough funds';
  return null;
}

export function startTraining(state: GameState, memberId: string, skill: SkillCategory): GameState {
  const problem = canTrain(state, memberId, skill);
  if (problem) throw new EngineError(problem, 'CANNOT_TRAIN');
  const member = state.members.find((m) => m.id === memberId) as Member;
  const level = member.skills.find((s) => s.skillName === skill)?.level ?? 0;
  return {
    ...state,
    funds: state.funds - trainingCost(level),
    training: { ...state.training, [memberId]: { skill, daysLeft: TRAIN_DAYS } },
  };
}

export interface Forecast {
  /** Day index of the last working day, or null if the quest cannot finish with this squad. */
  finishDay: number | null;
  /** Positive when the forecast is after the deadline. */
  lateDays: number;
  /** Streams that still have work but nobody working on them. */
  stalledSkills: SkillCategory[];
}

/** Predicts when a quest ends if the current squad keeps working at today's output. */
export function forecast(state: GameState, projectId: string): Forecast {
  const project = state.projects.find((p) => p.id === projectId);
  const run = state.runs[projectId];
  if (!project || !run) return { finishDay: null, lateDays: 0, stalledSkills: [] };
  const deadline = projectDeadlineDay(project);
  if (run.completedOnDay !== null) {
    return { finishDay: run.completedOnDay, lateDays: Math.max(0, run.completedOnDay - deadline), stalledSkills: [] };
  }
  const stalledSkills: SkillCategory[] = [];
  let slowest = 0;
  for (const s of run.streams.filter(isOpen)) {
    const out = streamOutputToday({ ...state, training: {} }, projectId, s.skillName);
    if (!(out > 0)) {
      stalledSkills.push(s.skillName);
      continue;
    }
    slowest = Math.max(slowest, Math.ceil(s.remaining / out - DAY_EPSILON));
  }
  if (stalledSkills.length > 0) return { finishDay: null, lateDays: 0, stalledSkills };
  const firstDay = Math.max(state.day, projectStartDay(project));
  const finishDay = firstDay + Math.max(slowest, 1) - 1;
  return { finishDay, lateDays: Math.max(0, finishDay - deadline), stalledSkills };
}

export function remainingWork(run: ProjectRun | undefined): number {
  return run ? run.streams.reduce((sum, s) => sum + s.remaining, 0) : 0;
}







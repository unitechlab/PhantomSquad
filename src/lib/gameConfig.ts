import type { ProjectPriority, SkillCategory } from '@/types';

/** Tunable game rules. The How to Play text reads these values, so they cannot drift apart. */
export const GAME_START_DATE = '2026-10-19';
export const GAME_DAYS = 60;
export const START_FUNDS = 20000;
export const GOAL_FUNDS = 110000;

export const MAX_SKILL_LEVEL = 5;
export const TRAIN_DAYS = 2;
/** Cost to raise a skill from level N to N+1, indexed by N (0 to 4). */
export const TRAIN_COSTS: readonly number[] = [600, 1000, 1600, 2400, 3600];

export const REWARD_PER_PERSON_DAY = 350;
export const PRIORITY_MULTIPLIER: Record<ProjectPriority, number> = {
  Critical: 1.3,
  High: 1.15,
  Normal: 1,
};
/** Share of the reward paid as a bonus for each full day finished before the deadline. */
export const EARLY_BONUS_RATE = 0.02;
export const EARLY_BONUS_MAX_DAYS = 10;
/** Share of the reward lost for each day the quest is still open after its deadline. */
export const LATE_PENALTY_RATE = 0.04;
/** Penalties stop growing once they reach this share of the reward. */
export const LATE_PENALTY_CAP = 0.5;

/** Combo: a quest banished within this many days of the previous one extends the chain. */
export const COMBO_WINDOW_DAYS = 3;
/** Extra share of the reward per combo step (the second quest in a chain is step 1). */
export const COMBO_BONUS_RATE = 0.05;
export const COMBO_MAX_STEPS = 4;
/** Funds levels that trigger a celebration on the way to the goal. */
export const MILESTONES: readonly number[] = [50000, 80000];
/** Random incidents. They are drawn from a seed, so the same seed always replays the same campaign. */
export const DEFAULT_SEED = 20261019;
export const INCIDENT_FIRST_DAY = 4;
export const INCIDENT_CHANCE = 0.12;
export const MOON_DAYS = 3;
export const MOON_BOOST = 1.2;
export const GLITCH_WORKLOAD = 3;
export const SPONSOR_AMOUNT = 1500;
/** Rank thresholds for a won campaign (day of the win) and for a near miss. */
export const RANK_S_MAX_DAY = 46;
export const RANK_A_MAX_DAY = 52;
export const RANK_NEAR_MISS = 0.9;

export const GAME_SPEEDS = [1, 2, 4, 8] as const;
export type GameSpeed = (typeof GAME_SPEEDS)[number];
export const BASE_DAY_MS = 1000;

export function computeReward(totalWorkload: number, priority: ProjectPriority): number {
  const raw = totalWorkload * REWARD_PER_PERSON_DAY * PRIORITY_MULTIPLIER[priority];
  return Math.round(raw / 100) * 100;
}

export function trainingCost(level: number): number {
  return TRAIN_COSTS[Math.min(Math.max(level, 0), TRAIN_COSTS.length - 1)];
}

export type SkillRecord<T> = Partial<Record<SkillCategory, T>>;


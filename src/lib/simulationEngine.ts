import type { Assignment, DailyBurndown, Member, Project, SimulationResult, SkillCategory } from '@/types';
import { EngineError } from '@/types';
import { streamOutput, teamDailyOutput } from '@/lib/assignmentEngine';

export const MAX_SIMULATION_DAYS = 1825;
const MS_PER_DAY = 86_400_000;
/** Absorbs floating-point residue when a stream finishes on an exact day boundary. */
export const DAY_EPSILON = 1e-9;

function parseDate(value: string): number {
  const t = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(t)) throw new EngineError(`Invalid date: ${value}`, 'INVALID_DATE');
  return t;
}

export function addDays(date: string, days: number): string {
  return new Date(parseDate(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function dayDiff(from: string, to: string): number {
  return Math.round((parseDate(to) - parseDate(from)) / MS_PER_DAY);
}

export interface SimulateOptions {
  /** Work still open per skill. Streams not listed use their full workload. */
  remaining?: Partial<Record<SkillCategory, number>>;
  /** First working day. Defaults to the project's start date. */
  startDate?: string;
}

/**
 * Each skill stream is worked only by the members assigned to it, and the quest is done when
 * every stream is done. Days needed = the slowest stream.
 */
export function simulate(
  project: Project,
  members: Member[],
  assignments: Assignment[],
  options: SimulateOptions = {},
): SimulationResult {
  const startDate = options.startDate ?? project.startDate;
  const streams = project.requiredSkills.map((r) => ({
    skill: r.skillName,
    work: options.remaining?.[r.skillName] ?? r.workload,
    output: streamOutput(members, assignments, r.skillName),
  }));

  let estimatedDays = 0;
  for (const s of streams) {
    if (s.work <= 0) continue;
    if (!(s.output > 0)) throw new EngineError(`No one is working on ${s.skill}`, 'STREAM_UNSTAFFED');
    estimatedDays = Math.max(estimatedDays, s.work / s.output);
  }
  const wholeDays = Math.ceil(estimatedDays - DAY_EPSILON);
  if (wholeDays > MAX_SIMULATION_DAYS) {
    throw new EngineError('Project would take longer than the simulation horizon', 'TOO_LONG');
  }

  // Finishing after n working days means the last working day is start + n - 1.
  const estimatedCompletionDate = addDays(startDate, Math.max(wholeDays, 1) - 1);
  const isOverDeadline = parseDate(estimatedCompletionDate) > parseDate(project.deadline);

  const deadlineDays = Math.max(dayDiff(startDate, project.deadline), 0);
  const horizon = Math.min(Math.max(wholeDays, deadlineDays), MAX_SIMULATION_DAYS);
  const totalOpen = streams.reduce((sum, s) => sum + Math.max(s.work, 0), 0);
  const dailyBurndown: DailyBurndown[] = [];
  for (let d = 0; d <= horizon; d++) {
    const remainingWorkload = streams.reduce((sum, s) => sum + Math.max(0, s.work - s.output * d), 0);
    dailyBurndown.push({ date: addDays(startDate, d), remainingWorkload: d === 0 ? totalOpen : remainingWorkload });
  }

  return {
    projectId: project.id,
    assignments,
    estimatedDays,
    estimatedCompletionDate,
    isOverDeadline,
    dailyBurndown,
    totalDailyOutput: teamDailyOutput(members, assignments),
  };
}
import type {
  Assignment,
  AssignmentMode,
  Member,
  Project,
  RequiredSkill,
  SkillCategory,
} from '@/types';
import { EngineError } from '@/types';

export const MIN_RATE = 10;
export const MAX_RATE = 100;
export const BALANCED_TARGET_RATE = 70;

const SKILL_LEVEL_COEFFICIENTS: readonly number[] = [0, 0.4, 0.6, 0.8, 1.0, 1.2];

export function skillLevelCoefficient(level: number): number {
  const index = Math.min(Math.max(Math.floor(level), 0), SKILL_LEVEL_COEFFICIENTS.length - 1);
  return SKILL_LEVEL_COEFFICIENTS[index];
}

export function getSkillLevel(member: Member, skill: SkillCategory): number {
  return member.skills.find((s) => s.skillName === skill)?.level ?? 0;
}

export function dailyOutput(member: Member, skill: SkillCategory, rate: number): number {
  if (rate <= 0) return 0;
  return (rate / 100) * member.efficiency * skillLevelCoefficient(getSkillLevel(member, skill));
}

/** Output of one assignment. The rate is split evenly across its assigned skills. */
export function assignmentOutput(member: Member, assignment: Assignment): number {
  const count = assignment.assignedSkills.length;
  if (count === 0) return 0;
  const share = assignment.allocatedRate / count;
  return assignment.assignedSkills.reduce((sum, skill) => sum + dailyOutput(member, skill, share), 0);
}

/** Output per day on one skill stream: each member's rate is split evenly across their assigned skills. */
export function streamOutput(members: Member[], assignments: Assignment[], skill: SkillCategory): number {
  const byId = new Map(members.map((m) => [m.id, m]));
  let total = 0;
  for (const a of assignments) {
    if (!a.assignedSkills.includes(skill)) continue;
    const m = byId.get(a.memberId);
    if (m) total += dailyOutput(m, skill, a.allocatedRate / a.assignedSkills.length);
  }
  return total;
}

export function teamDailyOutput(members: Member[], assignments: Assignment[]): number {
  const byId = new Map(members.map((m) => [m.id, m]));
  return assignments.reduce((sum, a) => {
    const m = byId.get(a.memberId);
    return m ? sum + assignmentOutput(m, a) : sum;
  }, 0);
}

export function computeEstimatedDays(totalWorkload: number, output: number): number {
  if (!(output > 0)) throw new EngineError('Daily output must be positive', 'NO_OUTPUT');
  const days = totalWorkload / output;
  if (!Number.isFinite(days) || days <= 0) {
    throw new EngineError('Estimated days must be finite and positive', 'NOT_SATISFIABLE');
  }
  return days;
}

export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return MIN_RATE;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(rate)));
}

/** Total rate already allocated to each member by assignments on other projects. */
export function loadByMember(assignments: Assignment[]): Map<string, number> {
  const load = new Map<string, number>();
  for (const a of assignments) load.set(a.memberId, (load.get(a.memberId) ?? 0) + a.allocatedRate);
  return load;
}

function isEligible(member: Member, req: RequiredSkill): boolean {
  const level = getSkillLevel(member, req.skillName);
  return level >= Math.max(req.minLevel, 1);
}

interface Planner {
  load: Map<string, number>;
  result: Map<string, Assignment>;
  projectId: string;
}

function available(member: Member, planner: Planner): number {
  return member.capacity - (planner.load.get(member.id) ?? 0);
}

/** Adds `skill` to the member's assignment, creating it at `rate` if needed. Returns false if impossible. */
function place(member: Member, skill: SkillCategory, desiredRate: number, planner: Planner): boolean {
  const existing = planner.result.get(member.id);
  if (existing) {
    if (!existing.assignedSkills.includes(skill)) existing.assignedSkills.push(skill);
    return true;
  }
  const rate = Math.min(clampRate(desiredRate), Math.floor(available(member, planner)));
  if (rate < MIN_RATE) return false;
  planner.result.set(member.id, {
    projectId: planner.projectId,
    memberId: member.id,
    allocatedRate: rate,
    assignedSkills: [skill],
  });
  planner.load.set(member.id, (planner.load.get(member.id) ?? 0) + rate);
  return true;
}

function candidatesFor(req: RequiredSkill, members: Member[], planner: Planner): Member[] {
  return members.filter(
    (m) => isEligible(m, req) && (planner.result.has(m.id) || available(m, planner) >= MIN_RATE),
  );
}

function countAssigned(req: RequiredSkill, planner: Planner): number {
  let n = 0;
  for (const a of planner.result.values()) if (a.assignedSkills.includes(req.skillName)) n++;
  return n;
}

function assignStreams(
  project: Project,
  members: Member[],
  planner: Planner,
  sort: (a: Member, b: Member, req: RequiredSkill, planner: Planner) => number,
  rateFor: (member: Member, planner: Planner) => number,
): void {
  for (const req of project.requiredSkills) {
    const sorted = candidatesFor(req, members, planner)
      .filter((m) => !planner.result.get(m.id)?.assignedSkills.includes(req.skillName))
      .sort((a, b) => sort(a, b, req, planner) || a.id.localeCompare(b.id));
    for (const m of sorted) {
      if (countAssigned(req, planner) >= req.headcount) break;
      place(m, req.skillName, rateFor(m, planner), planner);
    }
  }
}

function assignMinimal(project: Project, members: Member[], planner: Planner): void {
  const need = new Map(project.requiredSkills.map((r) => [r.skillName, r.headcount]));
  const open = (): RequiredSkill[] => project.requiredSkills.filter((r) => (need.get(r.skillName) ?? 0) > 0);
  for (;;) {
    const streams = open();
    if (streams.length === 0) return;
    let best: { member: Member; covers: RequiredSkill[]; level: number } | undefined;
    for (const m of members) {
      if (planner.result.has(m.id) || available(m, planner) < MIN_RATE) continue;
      const covers = streams.filter((r) => isEligible(m, r));
      if (covers.length === 0) continue;
      const level = covers.reduce((s, r) => s + getSkillLevel(m, r.skillName), 0);
      if (
        !best ||
        covers.length > best.covers.length ||
        (covers.length === best.covers.length && level > best.level) ||
        (covers.length === best.covers.length && level === best.level && m.id < best.member.id)
      ) {
        best = { member: m, covers, level };
      }
    }
    if (!best) return;
    for (const r of best.covers) {
      if (place(best.member, r.skillName, MAX_RATE, planner)) {
        need.set(r.skillName, (need.get(r.skillName) ?? 0) - 1);
      }
    }
  }
}

/**
 * Builds assignments for `project`.
 * `otherAssignments` are assignments on other projects; they consume member capacity.
 */
export function autoAssign(
  project: Project,
  members: Member[],
  mode: AssignmentMode,
  otherAssignments: Assignment[] = [],
): Assignment[] {
  const planner: Planner = {
    load: loadByMember(otherAssignments.filter((a) => a.projectId !== project.id)),
    result: new Map(),
    projectId: project.id,
  };

  if (mode === 'Balanced') {
    assignStreams(
      project,
      members,
      planner,
      (a, b, _req, p) => (p.load.get(a.id) ?? 0) - (p.load.get(b.id) ?? 0),
      () => BALANCED_TARGET_RATE,
    );
  } else if (mode === 'Speedrun') {
    assignStreams(
      project,
      members,
      planner,
      (a, b, req) =>
        getSkillLevel(b, req.skillName) - getSkillLevel(a, req.skillName) || b.efficiency - a.efficiency,
      (m, p) => available(m, p),
    );
  } else {
    assignMinimal(project, members, planner);
  }

  const assignments = [...planner.result.values()];
  if (assignments.length === 0) {
    throw new EngineError('No eligible member with free capacity for this project', 'NOT_SATISFIABLE');
  }
  validateAssignments(members, assignments, otherAssignments.filter((a) => a.projectId !== project.id));
  return assignments;
}

/** Throws EngineError if a rate is out of range or a member exceeds capacity. */
export function validateAssignments(
  members: Member[],
  assignments: Assignment[],
  otherAssignments: Assignment[] = [],
): void {
  const load = loadByMember([...otherAssignments, ...assignments]);
  for (const a of assignments) {
    if (!(a.allocatedRate >= MIN_RATE && a.allocatedRate <= MAX_RATE)) {
      throw new EngineError(`Rate ${a.allocatedRate} is outside ${MIN_RATE}-${MAX_RATE}`, 'INVALID_RATE');
    }
  }
  for (const m of members) {
    if ((load.get(m.id) ?? 0) > m.capacity) {
      throw new EngineError(`${m.name} is over capacity`, 'OVER_CAPACITY');
    }
  }
}
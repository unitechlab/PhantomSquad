import { describe, it } from 'vitest';
import fc from 'fast-check';
import {
  autoAssign,
  dailyOutput,
  loadByMember,
  streamOutput,
  teamDailyOutput,
} from '@/lib/assignmentEngine';
import { simulate } from '@/lib/simulationEngine';
import { ASSIGNMENT_MODES, EngineError, SKILL_CATEGORIES } from '@/types';
import type { Assignment, Member, Project } from '@/types';
import { arbMember, arbMembers, arbProjects, arbSkill } from './arbitraries';

const NUM_RUNS = 200;

/** Runs auto-assign for every project in order, skipping projects nobody can staff. */
function assignAll(projects: Project[], members: Member[], mode: (typeof ASSIGNMENT_MODES)[number]): Assignment[] {
  const all: Assignment[] = [];
  for (const p of projects) {
    try {
      all.push(...autoAssign(p, members, mode, all));
    } catch (e) {
      if (!(e instanceof EngineError)) throw e;
    }
  }
  return all;
}

describe('Property 1: capacity invariant', () => {
  it('total allocated rate never exceeds capacity, in any mode', () => {
    // Invariant: Σ allocatedRate per member <= member.capacity
    fc.assert(
      fc.property(arbMembers(), arbProjects(), fc.constantFrom(...ASSIGNMENT_MODES), (members, projects, mode) => {
        const load = loadByMember(assignAll(projects, members, mode));
        return members.every((m) => (load.get(m.id) ?? 0) <= m.capacity);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 2: finite completion', () => {
  it('any positive workload with an eligible positive-rate assignment completes in finite days', () => {
    // Invariant: estimatedDays is finite and > 0
    fc.assert(
      fc.property(
        arbMember(0),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 10, max: 100 }),
        (member, workload, rate) => {
          const skill = SKILL_CATEGORIES.find((s) => member.skills.find((e) => e.skillName === s)!.level >= 1);
          if (!skill) return true;
          const project: Project = {
            id: 'p',
            title: 'p',
            requiredSkills: [{ skillName: skill, minLevel: 1, workload, headcount: 1 }],
            totalWorkload: workload,
            reward: 1000,
            startDate: '2026-10-19',
            deadline: '2026-12-31',
            priority: 'Normal',
            status: 'Pending',
          };
          const a: Assignment = { projectId: 'p', memberId: member.id, allocatedRate: rate, assignedSkills: [skill] };
          try {
            const r = simulate(project, [member], [a]);
            return Number.isFinite(r.estimatedDays) && r.estimatedDays > 0;
          } catch (e) {
            // Only the simulation horizon may reject a valid input.
            return e instanceof EngineError && e.code === 'TOO_LONG';
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 3: monotonicity', () => {
  it('adding assignments never increases output (never lengthens the schedule)', () => {
    // Invariant: output(A) <= output(B) for A ⊆ B
    fc.assert(
      fc.property(arbMembers(), arbProjects(), fc.constantFrom(...ASSIGNMENT_MODES), (members, projects, mode) => {
        const assignments = assignAll(projects.slice(0, 1), members, mode);
        for (let k = 0; k <= assignments.length; k++) {
          const subset = assignments.slice(0, k);
          if (teamDailyOutput(members, subset) > teamDailyOutput(members, assignments) + 1e-9) return false;
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('adding assignments never lowers the output of any single stream', () => {
    // Invariant: streamOutput(A, skill) <= streamOutput(B, skill) for A ⊆ B
    fc.assert(
      fc.property(arbMembers(), arbProjects(), fc.constantFrom(...ASSIGNMENT_MODES), (members, projects, mode) => {
        const assignments = assignAll(projects.slice(0, 1), members, mode);
        return SKILL_CATEGORIES.every((skill) =>
          assignments.every((_, k) => streamOutput(members, assignments.slice(0, k), skill) <= streamOutput(members, assignments, skill) + 1e-9),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('raising a rate never lowers output', () => {
    // Invariant: output is non-decreasing in allocatedRate
    fc.assert(
      fc.property(arbMember(0), arbSkill(), fc.integer({ min: 10, max: 99 }), (member, skill, rate) => {
        return dailyOutput(member, skill, rate + 1) >= dailyOutput(member, skill, rate);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Property 4: zero-skill guard', () => {
  it('a member with level 0 in every skill produces zero output', () => {
    // Invariant: dailyOutput === 0 when skill level is 0
    fc.assert(
      fc.property(arbMember(0), arbSkill(), fc.integer({ min: 1, max: 100 }), (member, skill, rate) => {
        const zero: Member = { ...member, skills: member.skills.map((s) => ({ ...s, level: 0 })) };
        return dailyOutput(zero, skill, rate) === 0;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
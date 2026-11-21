import { describe, expect, it } from 'vitest';
import {
  autoAssign,
  clampRate,
  computeEstimatedDays,
  dailyOutput,
  skillLevelCoefficient,
  validateAssignments,
} from '@/lib/assignmentEngine';
import { addDays, simulate } from '@/lib/simulationEngine';
import { SEED_MEMBERS, SEED_PROJECTS } from '@/data/seed';
import { ASSIGNMENT_MODES, EngineError, SKILL_CATEGORIES } from '@/types';

describe('seed data', () => {
  it('has 8 members and 3 projects covering all skills', () => {
    expect(SEED_MEMBERS).toHaveLength(8);
    expect(SEED_PROJECTS).toHaveLength(3);
    for (const skill of SKILL_CATEGORIES) {
      expect(SEED_MEMBERS.some((m) => m.skills.some((s) => s.skillName === skill && s.level >= 3))).toBe(true);
    }
  });
  it('totalWorkload equals the sum of stream workloads', () => {
    for (const p of SEED_PROJECTS) {
      expect(p.totalWorkload).toBe(p.requiredSkills.reduce((s, r) => s + r.workload, 0));
    }
  });
});

describe('skillLevelCoefficient', () => {
  it('maps levels to coefficients and clamps', () => {
    expect(skillLevelCoefficient(0)).toBe(0);
    expect(skillLevelCoefficient(5)).toBe(1.2);
    expect(skillLevelCoefficient(99)).toBe(1.2);
    expect(skillLevelCoefficient(-3)).toBe(0);
  });
});

describe('dailyOutput', () => {
  it('multiplies rate, efficiency and coefficient', () => {
    const rave = SEED_MEMBERS.find((m) => m.id === 'rave')!;
    expect(dailyOutput(rave, '3D Modeling', 50)).toBeCloseTo(0.5 * 1.2 * 1.0);
  });
  it('is zero for non-positive rate', () => {
    expect(dailyOutput(SEED_MEMBERS[0], 'AR', 0)).toBe(0);
  });
});

describe('computeEstimatedDays', () => {
  it('divides workload by output', () => {
    expect(computeEstimatedDays(10, 2)).toBe(5);
  });
  it('throws on zero output', () => {
    expect(() => computeEstimatedDays(10, 0)).toThrow(EngineError);
  });
});

describe('clampRate', () => {
  it('keeps rates within 10-100', () => {
    expect(clampRate(-5)).toBe(10);
    expect(clampRate(250)).toBe(100);
    expect(clampRate(NaN)).toBe(10);
  });
});

describe('autoAssign', () => {
  for (const project of SEED_PROJECTS) {
    for (const mode of ASSIGNMENT_MODES) {
      it(`${mode} staffs "${project.title}" within capacity`, () => {
        const assignments = autoAssign(project, SEED_MEMBERS, mode);
        expect(assignments.length).toBeGreaterThan(0);
        expect(() => validateAssignments(SEED_MEMBERS, assignments)).not.toThrow();
        const result = simulate(project, SEED_MEMBERS, assignments);
        expect(Number.isFinite(result.estimatedDays)).toBe(true);
      });
    }
  }

  it('Minimal Squad uses no more people than Balanced', () => {
    for (const project of SEED_PROJECTS) {
      const minimal = autoAssign(project, SEED_MEMBERS, 'Minimal Squad').length;
      const balanced = autoAssign(project, SEED_MEMBERS, 'Balanced').length;
      expect(minimal).toBeLessThanOrEqual(balanced);
    }
  });

  it('respects capacity used by other projects', () => {
    const [first, second] = SEED_PROJECTS;
    const a = autoAssign(first, SEED_MEMBERS, 'Speedrun');
    const b = autoAssign(second, SEED_MEMBERS, 'Speedrun', a);
    expect(() => validateAssignments(SEED_MEMBERS, b, a)).not.toThrow();
  });

  it('throws when nobody is eligible', () => {
    const project = { ...SEED_PROJECTS[0], requiredSkills: [{ skillName: 'AR' as const, minLevel: 5, workload: 10, headcount: 1 }] };
    expect(() => autoAssign(project, [SEED_MEMBERS[2]], 'Balanced')).toThrow(EngineError);
  });
});

describe('validateAssignments', () => {
  it('rejects over-capacity totals', () => {
    const m = SEED_MEMBERS[0];
    const mk = (projectId: string) => ({ projectId, memberId: m.id, allocatedRate: 60, assignedSkills: ['AR' as const] });
    expect(() => validateAssignments([m], [mk('a'), mk('b')])).toThrow(EngineError);
  });
});

describe('simulate', () => {
  it('flags projects finishing after the deadline', () => {
    const project = { ...SEED_PROJECTS[0], deadline: SEED_PROJECTS[0].startDate };
    const result = simulate(project, SEED_MEMBERS, autoAssign(project, SEED_MEMBERS, 'Speedrun'));
    expect(result.isOverDeadline).toBe(true);
  });
  it('burndown starts at total workload and ends at zero', () => {
    const project = SEED_PROJECTS[0];
    const result = simulate(project, SEED_MEMBERS, autoAssign(project, SEED_MEMBERS, 'Speedrun'));
    expect(result.dailyBurndown[0].remainingWorkload).toBe(project.totalWorkload);
    expect(result.dailyBurndown.at(-1)!.remainingWorkload).toBe(0);
  });
  it('throws when the assignment produces no output', () => {
    expect(() => simulate(SEED_PROJECTS[0], SEED_MEMBERS, [])).toThrow(EngineError);
  });
});

describe('addDays', () => {
  it('adds calendar days across month ends', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
  });
});
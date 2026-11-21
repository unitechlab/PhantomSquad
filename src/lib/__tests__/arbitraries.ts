import fc from 'fast-check';
import { SKILL_CATEGORIES } from '@/types';
import type { Member, Project, SkillCategory } from '@/types';
import { computeReward } from '@/lib/gameConfig';
import { dayToDate } from '@/lib/gameEngine';

export const arbSkill = (): fc.Arbitrary<SkillCategory> => fc.constantFrom(...SKILL_CATEGORIES);

export function arbMember(index: number): fc.Arbitrary<Member> {
  return fc
    .record({
      levels: fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 6, maxLength: 6 }),
      capacity: fc.integer({ min: 20, max: 100 }),
      efficiency: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      dailyCost: fc.integer({ min: 50, max: 200 }),
    })
    .map(({ levels, capacity, efficiency, dailyCost }) => ({
      id: `m${index}`,
      name: `M${index}`,
      title: 't',
      mainRole: 'r',
      capacity,
      efficiency,
      dailyCost,
      characterId: 'luna' as const,
      skills: SKILL_CATEGORIES.map((skillName, i) => ({ skillName, level: levels[i] })),
    }));
}

export const arbMembers = (): fc.Arbitrary<Member[]> =>
  fc.integer({ min: 1, max: 10 }).chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => arbMember(i))));

/** A quest that starts within the first 20 days and has 5 to 40 days until its deadline. */
export function arbProject(index: number): fc.Arbitrary<Project> {
  const stream = fc.record({
    skillName: arbSkill(),
    minLevel: fc.integer({ min: 1, max: 4 }),
    workload: fc.integer({ min: 1, max: 60 }),
    headcount: fc.integer({ min: 1, max: 3 }),
  });
  return fc
    .record({
      streams: fc.array(stream, { minLength: 1, maxLength: 4 }),
      startDay: fc.integer({ min: 0, max: 20 }),
      length: fc.integer({ min: 5, max: 40 }),
      priority: fc.constantFrom('Critical' as const, 'High' as const, 'Normal' as const),
    })
    .map(({ streams, startDay, length, priority }) => {
      // One stream per skill, so a skill never appears twice in a project.
      const requiredSkills = streams.filter((s, i) => streams.findIndex((x) => x.skillName === s.skillName) === i);
      const totalWorkload = requiredSkills.reduce((sum, r) => sum + r.workload, 0);
      return {
        id: `p${index}`,
        title: `P${index}`,
        requiredSkills,
        totalWorkload,
        reward: computeReward(totalWorkload, priority),
        startDate: dayToDate(startDay),
        deadline: dayToDate(startDay + length),
        priority,
        status: 'Pending' as const,
      };
    });
}

export const arbProjects = (): fc.Arbitrary<Project[]> =>
  fc.integer({ min: 1, max: 4 }).chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => arbProject(i))));
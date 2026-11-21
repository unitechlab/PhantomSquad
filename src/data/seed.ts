import type { CharacterId, Member, Project, SkillCategory } from '@/types';
import { SKILL_CATEGORIES } from '@/types';
import { computeReward } from '@/lib/gameConfig';

function skills(levels: Partial<Record<SkillCategory, number>>): Member['skills'] {
  return SKILL_CATEGORIES.map((skillName) => ({ skillName, level: levels[skillName] ?? 0 }));
}

function member(
  id: CharacterId,
  name: string,
  title: string,
  mainRole: string,
  dailyCost: number,
  levels: Partial<Record<SkillCategory, number>>,
  efficiency = 1.0,
): Member {
  return { id, characterId: id, name, title, mainRole, dailyCost, capacity: 100, efficiency, skills: skills(levels) };
}

export const SEED_MEMBERS: Member[] = [
  member('luna', 'Luna', 'Archmage of WebAR', 'AR / WebAR Engineer', 110, { AR: 5, '3D Modeling': 2, VR: 1, '2D UX Design': 1, Director: 1 }),
  member('seven', 'Seven', 'Voidweaver of Immersive Realms', 'VR Engineer', 110, { VR: 5, Director: 2, AR: 2, '3D Modeling': 1, '2D UX Design': 1, 'Video Editing': 1 }),
  member('verna', 'Verna', '3D Mesh Necromancer', '3D Modeler', 110, { '3D Modeling': 5, AR: 3, VR: 1, '2D UX Design': 2, 'Video Editing': 1 }),
  member('azria', 'Azria', 'Pink Sigil Illuminator', '2D UX Designer', 100, { '2D UX Design': 5, 'Video Editing': 2, '3D Modeling': 1, AR: 1, Director: 1 }),
  member('crow', 'Crow', 'Lens Wraith of the Night Reel', 'Video Editor', 100, { 'Video Editing': 5, '2D UX Design': 3, Director: 1, '3D Modeling': 1, VR: 1 }),
  member('serefi', 'Serefi', 'Silver Conductor of Souls', 'Director', 120, { Director: 5, '2D UX Design': 2, 'Video Editing': 2, AR: 1, VR: 1 }),
  member('mint', 'Mint', 'Green Circuit Alchemist', 'AI / Technical Creator', 110, { AR: 3, VR: 3, '3D Modeling': 3, '2D UX Design': 1, 'Video Editing': 1, Director: 2 }, 1.1),
  member('rave', 'Rave', 'Crimson Ace of All Trades', 'Ace Creator', 180, { AR: 3, VR: 3, '3D Modeling': 4, '2D UX Design': 4, 'Video Editing': 3, Director: 3 }, 1.2),
];

function project(
  id: string,
  title: string,
  priority: Project['priority'],
  startDate: string,
  deadline: string,
  requiredSkills: Project['requiredSkills'],
): Project {
  const totalWorkload = requiredSkills.reduce((sum, r) => sum + r.workload, 0);
  return {
    id,
    title,
    priority,
    startDate,
    deadline,
    requiredSkills,
    totalWorkload,
    reward: computeReward(totalWorkload, priority),
    status: 'Pending',
  };
}

export const SEED_PROJECTS: Project[] = [
  project('haunted-mall-webar', 'Haunted Mall WebAR Rally', 'Critical', '2026-10-19', '2026-11-13', [
    { skillName: 'AR', minLevel: 3, workload: 24, headcount: 2 },
    { skillName: '3D Modeling', minLevel: 3, workload: 18, headcount: 1 },
    { skillName: 'Director', minLevel: 2, workload: 6, headcount: 1 },
  ]),
  project('cyber-ghost-vr', 'Cyber-Ghost VR Exhibition', 'High', '2026-10-19', '2026-11-20', [
    { skillName: 'VR', minLevel: 3, workload: 30, headcount: 2 },
    { skillName: 'Director', minLevel: 3, workload: 9, headcount: 1 },
    { skillName: '3D Modeling', minLevel: 2, workload: 12, headcount: 1 },
  ]),
  project('specter-promo-video', 'Specter Promo Video', 'Normal', '2026-10-19', '2026-11-06', [
    { skillName: 'Video Editing', minLevel: 3, workload: 18, headcount: 1 },
    { skillName: '2D UX Design', minLevel: 3, workload: 12, headcount: 1 },
    { skillName: 'Director', minLevel: 2, workload: 5, headcount: 1 },
  ]),
];

/** Quests that arrive later in the 60-day campaign. */
export const CAMPAIGN_PROJECTS: Project[] = [
  project('phantom-museum-ar', 'Phantom Museum AR Guide', 'High', '2026-10-29', '2026-11-20', [
    { skillName: 'AR', minLevel: 3, workload: 18, headcount: 1 },
    { skillName: '2D UX Design', minLevel: 3, workload: 12, headcount: 1 },
    { skillName: 'Director', minLevel: 2, workload: 5, headcount: 1 },
  ]),
  project('moonlit-concert', 'Moonlit Metaverse Concert', 'Critical', '2026-11-10', '2026-12-08', [
    { skillName: 'VR', minLevel: 3, workload: 24, headcount: 2 },
    { skillName: 'Video Editing', minLevel: 3, workload: 18, headcount: 1 },
    { skillName: '3D Modeling', minLevel: 3, workload: 15, headcount: 1 },
    { skillName: 'Director', minLevel: 3, workload: 8, headcount: 1 },
  ]),
  project('grave-shift-launch', 'Grave Shift App Launch', 'Normal', '2026-11-22', '2026-12-16', [
    { skillName: '2D UX Design', minLevel: 4, workload: 18, headcount: 1 },
    { skillName: 'AR', minLevel: 3, workload: 15, headcount: 1 },
    { skillName: 'Director', minLevel: 3, workload: 6, headcount: 1 },
    { skillName: 'Video Editing', minLevel: 2, workload: 9, headcount: 1 },
  ]),
];

export const ALL_PROJECTS: Project[] = [...SEED_PROJECTS, ...CAMPAIGN_PROJECTS];
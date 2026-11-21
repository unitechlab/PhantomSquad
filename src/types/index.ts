export type SkillCategory =
  | 'AR'
  | 'VR'
  | '3D Modeling'
  | '2D UX Design'
  | 'Video Editing'
  | 'Director';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'AR',
  'VR',
  '3D Modeling',
  '2D UX Design',
  'Video Editing',
  'Director',
];

export type CharacterId =
  | 'luna'
  | 'seven'
  | 'verna'
  | 'azria'
  | 'crow'
  | 'serefi'
  | 'mint'
  | 'rave';

export const CHARACTER_IDS: CharacterId[] = [
  'luna',
  'seven',
  'verna',
  'azria',
  'crow',
  'serefi',
  'mint',
  'rave',
];

export interface SkillEntry {
  skillName: SkillCategory;
  level: number; // 0-5
}

export interface Member {
  id: string;
  name: string;
  title: string;
  mainRole: string;
  capacity: number; // max utilisation (%), default 100
  skills: SkillEntry[];
  efficiency: number; // work multiplier, default 1.0
  dailyCost: number; // salary per day at 100% allocation
  characterId: CharacterId;
}

export interface RequiredSkill {
  skillName: SkillCategory;
  minLevel: number;
  workload: number; // person-days
  headcount: number;
}

export type ProjectPriority = 'Critical' | 'High' | 'Normal';
export type ProjectStatus = 'Pending' | 'Simulating' | 'Active' | 'Banished';

export interface Project {
  id: string;
  title: string;
  requiredSkills: RequiredSkill[];
  totalWorkload: number;
  reward: number; // paid on completion
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  priority: ProjectPriority;
  status: ProjectStatus;
}

export interface Assignment {
  projectId: string;
  memberId: string;
  allocatedRate: number; // 10-100 (%)
  assignedSkills: SkillCategory[];
}

export type AssignmentMode = 'Balanced' | 'Speedrun' | 'Minimal Squad';
export const ASSIGNMENT_MODES: AssignmentMode[] = ['Balanced', 'Speedrun', 'Minimal Squad'];

export interface DailyBurndown {
  date: string; // YYYY-MM-DD
  remainingWorkload: number;
}

export interface SimulationResult {
  projectId: string;
  assignments: Assignment[];
  estimatedDays: number;
  estimatedCompletionDate: string;
  isOverDeadline: boolean;
  dailyBurndown: DailyBurndown[];
  totalDailyOutput: number; // person-days per calendar day
}

export class EngineError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'ENGINE_ERROR',
  ) {
    super(message);
    this.name = 'EngineError';
  }
}
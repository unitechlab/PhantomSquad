import manifestJson from '../../public/assets/manifest.json';
import type { CharacterId, SkillCategory } from '@/types';

export interface AssetEntry {
  src: string;
  width: number;
  height: number;
}

const manifest = manifestJson as unknown as Record<string, AssetEntry>;

/** Set by next.config.mjs when the static build is hosted in a sub-folder (empty at the site root). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function withBase(entry: AssetEntry): AssetEntry {
  return BASE_PATH ? { ...entry, src: `${BASE_PATH}${entry.src}` } : entry;
}

export function asset(key: string): AssetEntry {
  const entry = manifest[key];
  if (!entry) throw new Error(`Missing asset: ${key}`);
  return withBase(entry);
}

/** Finished card art for the built-in quests (title, priority, dates and reward are part of the picture). Custom quests have none. */
export function questArt(projectId: string): AssetEntry | null {
  const entry = manifest[`quests/${projectId}.webp`];
  return entry ? withBase(entry) : null;
}

export type CharacterKind = 'face' | 'mini' | 'full';

export function characterAsset(id: CharacterId, kind: CharacterKind): AssetEntry {
  return asset(`characters/${id}/${kind}.webp`);
}

/** Skill icon sheet order is documented in design.md §9.5. */
const SKILL_ICON_INDEX: Record<SkillCategory, number> = {
  '2D UX Design': 1,
  AR: 2,
  VR: 3,
  '3D Modeling': 4,
  'Video Editing': 6,
  Director: 8,
};

export function skillIconAsset(skill: SkillCategory): AssetEntry {
  return asset(`skills/skill-${SKILL_ICON_INDEX[skill]}.webp`);
}

export const DEATH_MARCH_ICON = 'skills/skill-7.webp';
export const BALANCED_ICON = 'skills/skill-5.webp';

/** Badge sheet order: 1 crown, 2 trophy, 3 star emblem, 4 star, 5 shield. */
export const BADGE_BY_PRIORITY = {
  Critical: 'badges/badge-1.webp',
  High: 'badges/badge-4.webp',
  Normal: 'badges/badge-5.webp',
} as const;
export const BADGE_BANISHED = 'badges/badge-2.webp';

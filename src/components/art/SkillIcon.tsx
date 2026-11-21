import Image from 'next/image';
import type { SkillCategory } from '@/types';
import { skillIconAsset } from '@/lib/assets';

export function SkillIcon({ skill, size = 24 }: { skill: SkillCategory; size?: number }): JSX.Element {
  const a = skillIconAsset(skill);
  return <Image src={a.src} alt={skill} width={size} height={size} style={{ width: size, height: size }} />;
}
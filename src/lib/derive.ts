import type { Assignment, Member } from '@/types';

export function memberLevel(member: Member): number {
  return member.skills.reduce((sum, s) => sum + s.level, 0);
}

export function memberLoad(memberId: string, assignments: Record<string, Assignment[]>): number {
  return Object.values(assignments)
    .flat()
    .filter((a) => a.memberId === memberId)
    .reduce((sum, a) => sum + a.allocatedRate, 0);
}

export function memberAccentVar(member: Member): string {
  return `var(--color-char-${member.characterId})`;
}
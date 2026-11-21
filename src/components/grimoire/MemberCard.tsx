import type { Member } from '@/types';
import { Portrait } from '@/components/art/Portrait';
import { LevelBadge } from '@/components/art/LevelBadge';
import { memberAccentVar, memberLevel } from '@/lib/derive';
import { useL10n } from '@/hooks/useL10n';

export function MemberCard({ member, onOpen }: { member: Member; onOpen: () => void }): JSX.Element {
  const { t, memberName, memberTitle, memberRole } = useL10n();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('grimoire.open', { name: memberName(member), title: memberTitle(member) })}
      className="flex items-center gap-3 rounded-lg border border-shadow bg-crypt p-3 text-left hover:border-specter hover:shadow-specter"
    >
      <span
        className="shrink-0 overflow-hidden rounded-md border-2"
        style={{ borderColor: memberAccentVar(member) }}
      >
        <Portrait id={member.characterId} name="" kind="face" width={72} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-bone">{memberName(member)}</span>
        <span className="block text-sm italic text-specter-text">{memberTitle(member)}</span>
        <span className="block text-sm text-ash">{memberRole(member)}</span>
      </span>
      <LevelBadge level={memberLevel(member)} />
    </button>
  );
}
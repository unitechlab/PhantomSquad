'use client';
import Link from 'next/link';
import type { Member } from '@/types';
import { Portrait } from '@/components/art/Portrait';
import { SkillIcon } from '@/components/art/SkillIcon';
import { useL10n } from '@/hooks/useL10n';
import { memberAccentVar } from '@/lib/derive';
import { formatGold } from '@/lib/format';

const PORTRAIT_WIDTH = 168;
const TOP_SKILLS = 3;

/** One creator's profile on the About page: portrait, story, strengths and cost. */
export function CharacterCard({ member }: { member: Member }): JSX.Element {
  const { t, skill, character } = useL10n();
  const text = character(member.characterId);
  const top = [...member.skills]
    .filter((s) => s.level > 0)
    .sort((a, b) => b.level - a.level)
    .slice(0, TOP_SKILLS);
  const faster = Math.round((member.efficiency - 1) * 100);
  return (
    <article
      aria-labelledby={`about-${member.id}`}
      className="flex flex-col gap-4 rounded-lg border border-shadow bg-crypt p-4 sm:flex-row"
    >
      <div className="shrink-0 space-y-2 self-start" style={{ width: PORTRAIT_WIDTH }}>
        <span className="block overflow-hidden rounded-md border-2" style={{ borderColor: memberAccentVar(member) }}>
          <Portrait id={member.characterId} name={text.name} kind="full" width={PORTRAIT_WIDTH - 4} />
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <header>
          <h3 id={`about-${member.id}`} className="text-xl font-bold normal-case tracking-normal text-bone">
            {text.name}
          </h3>
          <p className="italic text-specter-text">{text.title}</p>
          <p className="text-sm text-ash">{text.role}</p>
        </header>
        <p className="font-bold text-bone">{text.tagline}</p>
        {text.bio.map((p) => (
          <p key={p} className="text-bone">
            {p}
          </p>
        ))}
        <blockquote className="border-l-2 border-specter pl-3 italic text-ash">“{text.quote}”</blockquote>
        <p className="text-sm text-bone">
          <span className="text-ash">{t('about.bestFor')}: </span>
          {text.bestFor}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-ash">{t('about.signature')}</p>
          <ul className="flex flex-wrap gap-2">
            {top.map((s) => (
              <li key={s.skillName} className="flex items-center gap-1 rounded bg-shadow px-2 py-1 text-bone">
                <SkillIcon skill={s.skillName} size={18} />
                {skill(s.skillName)}
                <span className={`font-mono ${s.level === 5 ? 'text-ecto' : 'text-bone'}`}>
                  {t('common.lv')}
                  {s.level}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-sm text-ash">
          {t('about.salary', { cost: formatGold(member.dailyCost) })}
          {faster > 0 && ` · ${t('about.efficiency', { percent: faster })}`}
        </p>
        <Link href="/grimoire" className="inline-block text-sm text-specter-text underline">
          {t('about.openGrimoire')}
        </Link>
      </div>
    </article>
  );
}

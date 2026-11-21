import type { Member } from '@/types';
import { SKILL_CATEGORIES } from '@/types';
import { SkillIcon } from '@/components/art/SkillIcon';
import { useL10n } from '@/hooks/useL10n';

const WEAK_LEVEL = 3;

export function SkillHeatmap({ members }: { members: Member[] }): JSX.Element {
  const { t, skill, memberName } = useL10n();
  const weak = SKILL_CATEGORIES.filter(
    (c) => Math.max(...members.map((m) => m.skills.find((s) => s.skillName === c)?.level ?? 0)) < WEAK_LEVEL,
  );
  return (
    <section aria-labelledby="matrix-title" className="rounded-lg border border-specter/30 bg-crypt p-4">
      <h2 id="matrix-title" className="mb-3 text-lg">
        {t('grimoire.matrix')}
      </h2>
      {weak.length > 0 && (
        <p role="alert" className="mb-3 text-crimson-text">
          {t('grimoire.weak', { skills: weak.map(skill).join(', '), level: WEAK_LEVEL - 1 })}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="p-1 text-left text-sm text-ash">{t('grimoire.creator')}</th>
              {SKILL_CATEGORIES.map((c) => (
                <th key={c} className="min-w-12 p-1 text-sm font-normal text-ash">
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skill={c} size={28} />
                    <span>{skill(c)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <th scope="row" className="pr-3 text-left text-sm font-normal text-bone">
                  {memberName(m)}
                </th>
                {SKILL_CATEGORIES.map((c) => {
                  const level = m.skills.find((s) => s.skillName === c)?.level ?? 0;
                  return (
                    <td
                      key={c}
                      aria-label={t('grimoire.cell', { name: memberName(m), skill: skill(c), level })}
                      className="relative h-12 w-12 overflow-hidden rounded-sm bg-shadow text-center align-middle"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-ecto"
                        style={{ opacity: level / 5 }}
                      />
                      <span className="relative font-mono text-sm text-bone">
                        {level === 0 ? <span className="opacity-40">💀</span> : level}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
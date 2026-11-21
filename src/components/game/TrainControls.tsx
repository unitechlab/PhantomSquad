'use client';
import type { Member } from '@/types';
import { SKILL_CATEGORIES } from '@/types';
import { SkillIcon } from '@/components/art/SkillIcon';
import { canTrain } from '@/lib/gameEngine';
import { MAX_SKILL_LEVEL, TRAIN_DAYS, trainingCost } from '@/lib/gameConfig';
import { formatGold } from '@/lib/format';
import { useL10n } from '@/hooks/useL10n';
import { useGameState, useNecroCrew } from '@/store/useNecroCrew';

/** Skill levels of one member with a "train +1" button per skill. */
export function TrainControls({ member }: { member: Member }): JSX.Element {
  const { t, skill: skillName, memberName, error } = useL10n();
  const game = useGameState();
  const train = useNecroCrew((s) => s.train);
  const current = game.members.find((m) => m.id === member.id) ?? member;
  const training = game.training[member.id];
  return (
    <div className="space-y-2">
      {training && (
        <p className="text-sm text-bone">
          {t('train.active', { name: memberName(current), skill: skillName(training.skill), n: training.daysLeft })}
        </p>
      )}
      <ul className="space-y-1">
        {SKILL_CATEGORIES.map((skill) => {
          const level = current.skills.find((s) => s.skillName === skill)?.level ?? 0;
          const maxed = level >= MAX_SKILL_LEVEL;
          const reason = maxed ? null : canTrain(game, member.id, skill);
          return (
            <li key={skill} className="flex items-center gap-3 text-sm">
              <SkillIcon skill={skill} size={22} />
              <span className="w-32 text-ash">{skillName(skill)}</span>
              <span className="w-12 font-mono text-bone">
                {t('common.lv')}
                {level}
              </span>
              {maxed ? (
                <span className="text-ecto">{t('common.max')}</span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => train(member.id, skill)}
                    disabled={reason !== null}
                    aria-label={t('train.aria', {
                      skill: skillName(skill),
                      name: memberName(current),
                      from: level,
                      to: level + 1,
                      cost: formatGold(trainingCost(level)),
                      days: TRAIN_DAYS,
                    })}
                    className={`rounded-md border px-2 py-1 ${
                      reason === null ? 'border-ecto text-ecto hover:bg-ecto hover:text-void' : 'border-shadow text-ash'
                    }`}
                  >
                    {t('train.button', { cost: formatGold(trainingCost(level)) })}
                  </button>
                  {reason && <span className="text-ash">{error(reason)}</span>}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

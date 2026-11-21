'use client';

import type { Member } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Portrait } from '@/components/art/Portrait';
import { RadarChart } from '@/components/charts/RadarChart';
import { TrainControls } from '@/components/game/TrainControls';
import { useState } from 'react';
import { SKILL_CATEGORIES } from '@/types';
import { MAX_SKILL_LEVEL } from '@/lib/gameConfig';
import { useNecroCrew } from '@/store/useNecroCrew';
import { memberAccentVar } from '@/lib/derive';
import { formatGold } from '@/lib/format';
import { useL10n } from '@/hooks/useL10n';

export function MemberModal({ member, onClose }: { member: Member; onClose: () => void }): JSX.Element {
  const { t, memberName, memberTitle, memberRole, skill } = useL10n();
  const setSkillLevel = useNecroCrew((s) => s.setSkillLevel);
  const [editing, setEditing] = useState(false);
  const live = useNecroCrew((s) => s.members.find((m) => m.id === member.id)) ?? member;
  return (
    <Modal title={`${memberName(live)}: ${memberTitle(live)}`} onClose={onClose}>
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <Portrait id={live.characterId} name={memberName(live)} kind="full" width={240} priority />
        </div>
        <div className="space-y-4">
          <p className="italic text-specter-text">
            {t('grimoire.salary', { role: memberRole(live), cost: formatGold(live.dailyCost) })}
          </p>
          <div className="flex flex-wrap items-start gap-6">
            <RadarChart skills={live.skills} color={memberAccentVar(live)} />
            <TrainControls member={live} />
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 text-ash">
              <input type="checkbox" checked={editing} onChange={(e) => setEditing(e.target.checked)} />
              {t('grimoire.edit')}
            </label>
            {editing && (
              <div className="space-y-2">
                <p className="text-ash">{t('grimoire.editHint')}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {SKILL_CATEGORIES.map((c) => {
                    const level = live.skills.find((k) => k.skillName === c)?.level ?? 0;
                    return (
                      <li key={c} className="flex items-center gap-2">
                        <span className="w-32 text-bone">{skill(c)}</span>
                        <select
                          aria-label={t('grimoire.editLevel', { name: memberName(live), skill: skill(c) })}
                          value={level}
                          onChange={(e) => setSkillLevel(live.id, c, Number(e.target.value))}
                          className="rounded-md border border-shadow bg-void px-2 py-1 font-mono text-bone"
                        >
                          {Array.from({ length: MAX_SKILL_LEVEL + 1 }, (_, n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
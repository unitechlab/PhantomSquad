'use client';
import { useState } from 'react';
import { Portrait } from '@/components/art/Portrait';
import { TrainControls } from '@/components/game/TrainControls';
import { TRAIN_DAYS } from '@/lib/gameConfig';
import { memberAccentVar } from '@/lib/derive';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';

const PORTRAIT_WIDTH = 128;

export function TrainingPanel(): JSX.Element {
  const { t, memberName, memberTitle, memberRole } = useL10n();
  const members = useNecroCrew((s) => s.members);
  const [memberId, setMemberId] = useState(members[0].id);
  const member = members.find((m) => m.id === memberId) ?? members[0];
  return (
    <section aria-labelledby="train-title" className="space-y-3 rounded-lg border border-specter/30 bg-crypt p-4">
      <h2 id="train-title" className="text-lg">
        {t('train.title')}
      </h2>
      <p className="text-sm text-ash">{t('train.intro', { days: TRAIN_DAYS })}</p>
      <label className="flex items-center gap-2 text-sm text-ash">
        {t('train.creator')}
        <select
          value={member.id}
          onChange={(e) => setMemberId(e.target.value)}
          className="rounded-md border border-shadow bg-void px-2 py-1 text-bone"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {memberName(m)} ({memberRole(m)})
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-start gap-4">
        <figure className="shrink-0 space-y-1 text-center" style={{ width: PORTRAIT_WIDTH }}>
          <span className="block overflow-hidden rounded-md border-2" style={{ borderColor: memberAccentVar(member) }}>
            <Portrait id={member.characterId} name={memberName(member)} kind="full" width={PORTRAIT_WIDTH - 4} />
          </span>
          <figcaption>
            <span className="block text-base font-bold text-bone">{memberName(member)}</span>
            <span className="block text-sm italic text-specter-text">{memberTitle(member)}</span>
          </figcaption>
        </figure>
        <div className="min-w-0 flex-1">
          <TrainControls member={member} />
        </div>
      </div>
    </section>
  );
}

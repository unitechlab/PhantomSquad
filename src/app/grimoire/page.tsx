'use client';

import { useState } from 'react';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';
import { SkillHeatmap } from '@/components/grimoire/SkillHeatmap';
import { MemberCard } from '@/components/grimoire/MemberCard';
import { MemberModal } from '@/components/grimoire/MemberModal';

export default function GrimoirePage(): JSX.Element {
  const { t } = useL10n();
  const members = useNecroCrew((s) => s.members);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = members.find((m) => m.id === openId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">{t('grimoire.title')}</h1>
      <SkillHeatmap members={members} />
      <section aria-labelledby="creators-title">
        <h2 id="creators-title" className="mb-3 text-lg">
          {t('grimoire.creators')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>
      </section>
      {open && <MemberModal member={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import type { TextKey } from '@/data/i18n';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';

const PRESETS: { label: TextKey; projectId: string }[] = [
  { label: 'quests.preset.ar', projectId: 'haunted-mall-webar' },
  { label: 'quests.preset.vr', projectId: 'cyber-ghost-vr' },
  { label: 'quests.preset.video', projectId: 'specter-promo-video' },
];

export function PresetButtons(): JSX.Element {
  const router = useRouter();
  const { t } = useL10n();
  const selectProject = useNecroCrew((s) => s.selectProject);
  const summon = useNecroCrew((s) => s.summon);

  return (
    <div className="flex flex-wrap gap-3">
      {PRESETS.map((p) => (
        <button
          key={p.projectId}
          type="button"
          onClick={() => {
            selectProject(p.projectId);
            summon(p.projectId);
            router.push('/simulator');
          }}
          className="rounded-md border border-ecto px-4 py-2 text-sm uppercase tracking-[0.08em] text-ecto hover:bg-ecto hover:text-void"
        >
          {t(p.label)}
        </button>
      ))}
    </div>
  );
}
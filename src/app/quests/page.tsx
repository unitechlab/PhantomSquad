'use client';

import { useState } from 'react';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';
import { QuestCard } from '@/components/quests/QuestCard';
import { PresetButtons } from '@/components/quests/PresetButtons';
import { QuestFormModal } from '@/components/quests/QuestFormModal';

export default function QuestsPage(): JSX.Element {
  const { t } = useL10n();
  const projects = useNecroCrew((s) => s.projects);
  const runs = useNecroCrew((s) => s.runs);
  const selectProject = useNecroCrew((s) => s.selectProject);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">{t('quests.title')}</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-md border border-specter px-4 py-2 text-sm uppercase tracking-[0.08em] text-bone hover:shadow-specter"
        >
          {t('quests.new')}
        </button>
      </div>
      <section aria-labelledby="quick-title" className="space-y-3">
        <h2 id="quick-title" className="text-lg">
          {t('quests.quick')}
        </h2>
        <PresetButtons />
      </section>
      <section aria-labelledby="list-title" className="space-y-3">
        <h2 id="list-title" className="text-lg">
          {t('quests.list')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <QuestCard key={p.id} project={p} run={runs[p.id]} onSelect={() => selectProject(p.id)} />
          ))}
        </div>
      </section>
      {formOpen && <QuestFormModal onClose={() => setFormOpen(false)} />}
    </div>
  );
}

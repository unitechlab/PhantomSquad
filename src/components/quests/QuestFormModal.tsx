'use client';

import { useState } from 'react';
import type { Project, ProjectPriority, RequiredSkill, SkillCategory } from '@/types';
import { SKILL_CATEGORIES } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';
import { computeReward } from '@/lib/gameConfig';

interface StreamDraft {
  enabled: boolean;
  minLevel: number;
  workload: number;
  headcount: number;
}

const EMPTY: StreamDraft = { enabled: false, minLevel: 3, workload: 20, headcount: 1 };

export function QuestFormModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t, skill, priority: priorityLabel } = useL10n();
  const addProject = useNecroCrew((s) => s.addProject);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('2026-10-19');
  const [deadline, setDeadline] = useState('2026-11-30');
  const [priority, setPriority] = useState<ProjectPriority>('Normal');
  const [streams, setStreams] = useState<Record<SkillCategory, StreamDraft>>(
    () => Object.fromEntries(SKILL_CATEGORIES.map((c) => [c, EMPTY])) as Record<SkillCategory, StreamDraft>,
  );
  const [error, setError] = useState<string | null>(null);

  const patch = (c: SkillCategory, p: Partial<StreamDraft>): void =>
    setStreams((prev) => ({ ...prev, [c]: { ...prev[c], ...p } }));

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    const requiredSkills: RequiredSkill[] = SKILL_CATEGORIES.filter((c) => streams[c].enabled).map((c) => ({
      skillName: c,
      minLevel: streams[c].minLevel,
      workload: streams[c].workload,
      headcount: streams[c].headcount,
    }));
    if (!title.trim()) return setError(t('form.err.name'));
    if (requiredSkills.length === 0) return setError(t('form.err.streams'));
    if (requiredSkills.some((r) => !(r.workload > 0) || !(r.headcount >= 1))) {
      return setError(t('form.err.numbers'));
    }
    if (deadline < startDate) return setError(t('form.err.dates'));
    const totalWorkload = requiredSkills.reduce((s, r) => s + r.workload, 0);
    const project: Project = {
      id: `custom-${crypto.randomUUID()}`,
      title: title.trim(),
      requiredSkills,
      totalWorkload,
      reward: computeReward(totalWorkload, priority),
      startDate,
      deadline,
      priority,
      status: 'Pending',
    };
    addProject(project);
    onClose();
  };

  const field = 'rounded-md border border-shadow bg-void px-2 py-1 text-bone';

  return (
    <Modal title={t('form.title')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-ash">
            {t('form.name')}
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ash">
            {t('form.priority')}
            <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)}>
              <option value="Critical">{priorityLabel('Critical')}</option>
              <option value="High">{priorityLabel('High')}</option>
              <option value="Normal">{priorityLabel('Normal')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-ash">
            {t('form.start')}
            <input type="date" className={field} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ash">
            {t('form.deadline')}
            <input type="date" className={field} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm text-ash">{t('form.streams')}</legend>
          {SKILL_CATEGORIES.map((c) => (
            <div key={c} className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex w-44 items-center gap-2">
                <input type="checkbox" checked={streams[c].enabled} onChange={(e) => patch(c, { enabled: e.target.checked })} />
                {skill(c)}
              </label>
              <label className="flex items-center gap-1 text-ash">
                {t('form.minLevel')}
                <input type="number" min={1} max={5} className={`${field} w-16`} value={streams[c].minLevel} onChange={(e) => patch(c, { minLevel: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-1 text-ash">
                {t('form.personDays')}
                <input type="number" min={1} className={`${field} w-20`} value={streams[c].workload} onChange={(e) => patch(c, { workload: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-1 text-ash">
                {t('form.headcount')}
                <input type="number" min={1} max={8} className={`${field} w-16`} value={streams[c].headcount} onChange={(e) => patch(c, { headcount: Number(e.target.value) })} />
              </label>
            </div>
          ))}
        </fieldset>
        <p className="text-sm text-ash">
          {t('form.reward')}{' '}
          <span className="font-mono text-ecto">
            {computeReward(
              SKILL_CATEGORIES.filter((c) => streams[c].enabled).reduce((s, c) => s + (streams[c].workload || 0), 0),
              priority,
            ).toLocaleString('en-US')}
          </span>
        </p>
        {error && (
          <p role="alert" className="text-crimson-text">
            {error}
          </p>
        )}
        <button type="submit" className="rounded-md border border-ecto px-4 py-2 text-sm uppercase tracking-[0.08em] text-ecto hover:bg-ecto hover:text-void">
          {t('form.submit')}
        </button>
      </form>
    </Modal>
  );
}
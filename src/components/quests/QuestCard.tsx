'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Project, ProjectStatus } from '@/types';
import { AssetImage } from '@/components/art/AssetImage';
import { StatusBar } from '@/components/art/StatusBar';
import { ParticleBurst } from '@/components/art/ParticleBurst';
import { BADGE_BANISHED, BADGE_BY_PRIORITY, questArt } from '@/lib/assets';
import { formatGold } from '@/lib/format';
import { useL10n } from '@/hooks/useL10n';
import { remainingWork, type ProjectRun } from '@/lib/gameEngine';

const STATUS_CLASS: Record<ProjectStatus, string> = {
  Pending: 'bg-ash text-void',
  Simulating: 'border border-specter bg-shadow text-bone status-simulating',
  Active: 'bg-ecto text-void',
  Banished: 'bg-shadow text-ash',
};

const PRIORITY_CLASS = {
  Critical: 'border border-crimson bg-shadow text-bone',
  High: 'border border-specter bg-shadow text-bone',
  Normal: 'bg-shadow text-bone',
} as const;

interface QuestCardProps {
  project: Project;
  run: ProjectRun | undefined;
  onSelect: () => void;
}

export function QuestCard({ project, run, onSelect }: QuestCardProps): JSX.Element {
  const { t, date, status, priority, questTitle } = useL10n();
  const title = questTitle(project);
  const banished = project.status === 'Banished';
  const [burst, setBurst] = useState(0);
  const wasBanished = useRef(banished);
  // Burst only on the transition into Banished, so revisiting the page does not replay it.
  useEffect(() => {
    if (banished && !wasBanished.current) setBurst((b) => b + 1);
    wasBanished.current = banished;
  }, [banished]);

  const remaining = remainingWork(run);
  const art = questArt(project.id);

  if (art) {
    const alt = t('quests.alt', {
      title,
      priority: priority(project.priority),
      start: date(project.startDate),
      end: date(project.deadline),
      reward: formatGold(project.reward),
    });
    return (
      <article className="relative overflow-hidden rounded-lg border border-shadow bg-crypt">
        <div className="relative">
          <Image
            src={art.src}
            alt={alt}
            width={art.width}
            height={art.height}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className={`h-auto w-full transition-[filter,opacity] duration-200 ease-out ${banished ? 'opacity-50 grayscale' : ''}`}
          />
          {banished && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-md border-2 border-ecto bg-void px-4 py-1 text-lg font-bold uppercase tracking-[0.08em] text-ecto">
              {t('quests.stamp')}
            </span>
          )}
          <ParticleBurst trigger={burst} />
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className={`rounded px-2 py-1 ${STATUS_CLASS[project.status]}`}>{status(project.status)}</span>
            <Link
              href="/simulator"
              onClick={onSelect}
              className="ml-auto rounded-md border border-specter px-3 py-2 text-sm text-bone hover:shadow-specter"
            >
              {t('quests.open')}
            </Link>
          </div>
          <StatusBar
            kind="hp"
            label={t('quests.remaining', { title })}
            value={remaining}
            max={project.totalWorkload}
            caption={t('common.personDays', { done: Math.round(remaining), total: project.totalWorkload })}
          />
        </div>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-shadow bg-crypt p-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40">
        <AssetImage assetKey="ui/map-thumb.webp" width={240} alt="" className="h-full w-full object-cover" />
      </div>
      <ParticleBurst trigger={burst} />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <AssetImage assetKey={banished ? BADGE_BANISHED : BADGE_BY_PRIORITY[project.priority]} width={40} alt="" />
          <div className="flex-1">
            <h3 className={`text-base ${banished ? 'text-ash line-through' : 'text-bone'}`}>
              {banished && <span aria-hidden="true">💀 </span>}
              {title}
            </h3>
            <p className="font-mono text-sm text-ash">
              {date(project.startDate)} → {date(project.deadline)}
            </p>
          </div>
          <p className="text-right font-mono text-sm text-ecto" title={t('quests.baseReward')}>
            {formatGold(project.reward)}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className={`rounded px-2 py-1 ${PRIORITY_CLASS[project.priority]}`}>{priority(project.priority)}</span>
          <span className={`rounded px-2 py-1 ${STATUS_CLASS[project.status]}`}>{status(project.status)}</span>
        </div>
        <StatusBar
          kind="hp"
          label={t('quests.remaining', { title })}
          value={remaining}
          max={project.totalWorkload}
          caption={t('common.personDays', { done: Math.round(remaining), total: project.totalWorkload })}
        />
        <Link
          href="/simulator"
          onClick={onSelect}
          className="inline-block rounded-md border border-specter px-3 py-2 text-sm text-bone hover:shadow-specter"
        >
          {t('quests.open')}
        </Link>
      </div>
    </article>
  );
}

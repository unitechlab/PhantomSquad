'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/types';
import { AssetImage } from '@/components/art/AssetImage';
import { SkillIcon } from '@/components/art/SkillIcon';
import { BADGE_BANISHED, BADGE_BY_PRIORITY, questArt } from '@/lib/assets';
import { dayToDate, forecast, isRunning, projectDeadlineDay, projectStartDay, type GameState } from '@/lib/gameEngine';
import { formatGold } from '@/lib/format';
import { useL10n } from '@/hooks/useL10n';
import { useGameState, useNecroCrew } from '@/store/useNecroCrew';

/** How many days ahead a not-yet-started quest counts as "coming soon" and stays on the board. */
const SOON_WINDOW_DAYS = 7;
const PRIORITY_ORDER: Record<Project['priority'], number> = { Critical: 0, High: 1, Normal: 2 };

function Status({ game, project }: { game: GameState; project: Project }): JSX.Element {
  const { t, date, skill } = useL10n();
  const run = game.runs[project.id];
  if (run.completedOnDay !== null) {
    return <span className="text-ash">{t('board.banishedOn', { date: date(dayToDate(run.completedOnDay)) })}</span>;
  }
  const start = projectStartDay(project);
  if (start > game.day) {
    return <span className="text-ash">{t('board.arrives', { date: date(project.startDate), n: start - game.day })}</span>;
  }
  const f = forecast(game, project.id);
  const dueIn = projectDeadlineDay(project) - game.day;
  const due = dueIn >= 0 ? t('board.dueIn', { n: dueIn + 1 }) : t('board.overdueBy', { n: -dueIn });
  if (f.stalledSkills.length > 0) {
    return <span className="text-crimson-text">{t('board.stalled', { due, skills: f.stalledSkills.map(skill).join(', ') })}</span>;
  }
  if (f.lateDays > 0) {
    return <span className="text-crimson-text">{t('board.late', { due, n: f.lateDays })}</span>;
  }
  return <span className="text-ecto">{t('board.onTrack', { due, date: date(dayToDate(f.finishDay ?? game.day)) })}</span>;
}

/** A quest in trouble is already past its deadline, or is forecast to finish after it. */
function isInTrouble(game: GameState, project: Project): boolean {
  if (!isRunning(game, project)) return false;
  return game.day > projectDeadlineDay(project) || forecast(game, project.id).lateDays > 0;
}

function QuestRow({ game, project }: { game: GameState; project: Project }): JSX.Element {
  const { t, date, skill, priority, questTitle } = useL10n();
  const selectedId = useNecroCrew((s) => s.selectedProjectId);
  const selectProject = useNecroCrew((s) => s.selectProject);
  const run = game.runs[project.id];
  const banished = run.completedOnDay !== null;
  const selected = project.id === selectedId;
  const trouble = isInTrouble(game, project);
  return (
    <button
      type="button"
      onClick={() => selectProject(project.id)}
      aria-pressed={selected}
      className={`w-full space-y-2 rounded-lg border p-3 text-left ${
        trouble ? 'death-march border-crimson' : selected ? 'border-specter' : 'border-shadow hover:border-specter/60'
      } ${selected ? 'bg-shadow' : 'bg-crypt'}`}
    >
      <span className="flex items-start gap-3">
        {questArt(project.id) ? (
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-shadow">
            <Image
              src={questArt(project.id)?.src ?? ''}
              alt=""
              fill
              sizes="56px"
              className={`object-cover ${banished ? 'opacity-50 grayscale' : ''}`}
              style={{ objectPosition: '60% 75%' }}
            />
          </span>
        ) : (
          <AssetImage assetKey={banished ? BADGE_BANISHED : BADGE_BY_PRIORITY[project.priority]} width={32} alt="" />
        )}
        <span className="flex-1">
          <span className={`block font-bold ${banished ? 'text-ash line-through' : 'text-bone'}`}>{questTitle(project)}</span>
          <span className="block text-sm text-ash">
            {t('board.priorityLine', { priority: priority(project.priority), date: date(project.deadline) })}
          </span>
        </span>
        <span className="text-right font-mono text-sm text-ecto">{formatGold(project.reward)}</span>
      </span>
      {!banished && (
        <span className="block space-y-1">
          {run.streams.map((s) => (
            <span key={s.skillName} className="flex items-center gap-2 text-sm">
              <SkillIcon skill={s.skillName} size={18} />
              <span className="w-28 truncate text-ash">{skill(s.skillName)}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-sm bg-shadow">
                <span
                  className={`block h-full transition-[width] duration-300 ease-out ${s.remaining === 0 ? 'bg-ash' : 'bg-ecto'}`}
                  style={{ width: `${(1 - s.remaining / s.total) * 100}%` }}
                />
              </span>
              <span className="w-20 text-right font-mono text-bone">
                {(s.total - s.remaining).toFixed(0)}/{s.total}
              </span>
            </span>
          ))}
        </span>
      )}
      <span className="block text-sm">
        <Status game={game} project={project} />
        {isRunning(game, project) && (game.assignments[project.id]?.length ?? 0) === 0 && (
          <span className="block text-ash">{t('board.nobody')}</span>
        )}
      </span>
    </button>
  );
}

export function ProjectBoard(): JSX.Element {
  const { t } = useL10n();
  const game = useGameState();
  // Active quests first (most urgent on top), then the ones arriving soon. Done and far-off quests leave the board.
  const active = game.projects
    .filter((p) => isRunning(game, p))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || projectDeadlineDay(a) - projectDeadlineDay(b));
  const soon = game.projects
    .filter((p) => game.runs[p.id].completedOnDay === null && projectStartDay(p) > game.day && projectStartDay(p) - game.day <= SOON_WINDOW_DAYS)
    .sort((a, b) => projectStartDay(a) - projectStartDay(b));
  const done = game.projects.filter((p) => game.runs[p.id].completedOnDay !== null);
  const later = game.projects.filter(
    (p) => game.runs[p.id].completedOnDay === null && projectStartDay(p) > game.day + SOON_WINDOW_DAYS,
  ).length;
  return (
    <section aria-labelledby="board-title" className="space-y-3 rounded-lg border border-specter/30 bg-crypt p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="board-title" className="text-lg">
          {t('board.title')}
        </h2>
        <Link href="/quests" className="text-sm text-specter-text underline">
          {t('board.all')}
        </Link>
      </div>
      {active.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm uppercase tracking-[0.08em] text-ash">{t('board.working')}</h3>
          <ul className="space-y-3">
            {active.map((p) => (
              <li key={p.id}>
                <QuestRow game={game} project={p} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-ash">{t('board.none')}</p>
      )}
      {soon.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm uppercase tracking-[0.08em] text-ash">{t('board.soon')}</h3>
          <ul className="space-y-3">
            {soon.map((p) => (
              <li key={p.id}>
                <QuestRow game={game} project={p} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {later > 0 && <p className="text-sm text-ash">{t('board.later', { n: later })}</p>}
      {done.length > 0 && (
        <details className="rounded-lg border border-shadow">
          <summary className="cursor-pointer px-3 py-2 text-sm text-ash">
            {t('board.done', { done: done.length, total: game.projects.length })}
          </summary>
          <ul className="space-y-3 p-3 pt-0">
            {done.map((p) => (
              <li key={p.id}>
                <QuestRow game={game} project={p} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

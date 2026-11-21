'use client';
import { useMemo } from 'react';
import type { Project, SimulationResult, SkillCategory } from '@/types';
import { BurndownChart } from '@/components/charts/BurndownChart';
import { dayToDate, projectStartDay, type GameState } from '@/lib/gameEngine';
import { simulate } from '@/lib/simulationEngine';
import { useL10n } from '@/hooks/useL10n';
import { useGameState } from '@/store/useNecroCrew';

function buildForecast(game: GameState, project: Project): SimulationResult | null {
  const run = game.runs[project.id];
  if (!run || run.completedOnDay !== null) return null;
  const remaining: Partial<Record<SkillCategory, number>> = Object.fromEntries(run.streams.map((s) => [s.skillName, s.remaining]));
  try {
    return simulate(project, game.members, game.assignments[project.id] ?? [], {
      remaining,
      startDate: dayToDate(Math.max(game.day, projectStartDay(project))),
    });
  } catch {
    return null; // a stream has no one on it; the board already says so
  }
}

export function QuestForecast({ project }: { project: Project }): JSX.Element {
  const { t, rich, questTitle } = useL10n();
  const game = useGameState();
  const result = useMemo(() => buildForecast(game, project), [game, project]);
  return (
    <section
      aria-labelledby="forecast-title"
      className={`space-y-3 rounded-lg border bg-crypt p-4 ${result?.isOverDeadline ? 'death-march border-crimson' : 'border-specter/30'}`}
    >
      <h2 id="forecast-title" className="text-lg">
        {t('forecast.title', { title: questTitle(project) })}
      </h2>
      {game.runs[project.id]?.completedOnDay != null ? (
        <p className="text-sm text-ash">{t('forecast.banished')}</p>
      ) : result ? (
        <>
          <p className="text-sm text-bone">
            {rich('forecast.pace', {
              date: <span className={`font-mono ${result.isOverDeadline ? 'text-crimson-text' : 'text-ecto'}`}>{result.estimatedCompletionDate}</span>,
              deadline: <span className="font-mono">{project.deadline}</span>,
            })}
          </p>
          <BurndownChart result={result} deadline={project.deadline} />
        </>
      ) : (
        <p className="text-sm text-ash">{t('forecast.unstaffed')}</p>
      )}
    </section>
  );
}

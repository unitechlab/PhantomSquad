'use client';

import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';
import { useGameClock } from '@/hooks/useGameClock';
import { useGameSounds } from '@/hooks/useGameSounds';
import { GameHud } from '@/components/game/GameHud';
import { StudioField } from '@/components/game/StudioField';
import { ProjectBoard } from '@/components/game/ProjectBoard';
import { QuestForecast } from '@/components/game/QuestForecast';
import { TrainingPanel } from '@/components/game/TrainingPanel';
import { Ledger } from '@/components/game/Ledger';
import { GameResult } from '@/components/game/GameResult';
import { AssignmentPanel } from '@/components/simulator/AssignmentPanel';

export default function SimulatorPage(): JSX.Element {
  const { t, error: localizeError } = useL10n();
  useGameClock();
  useGameSounds();
  const projects = useNecroCrew((s) => s.projects);
  const members = useNecroCrew((s) => s.members);
  const selectedId = useNecroCrew((s) => s.selectedProjectId);
  const assignments = useNecroCrew((s) => s.assignments);
  const error = useNecroCrew((s) => s.error);

  const project = projects.find((p) => p.id === selectedId) ?? projects[0];
  const list = assignments[project.id] ?? [];

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t('nav.studio')}</h1>
      <GameHud />
      {error && (
        <p role="alert" className="rounded-md border border-crimson px-3 py-2 text-crimson-text">
          {localizeError(error)}
        </p>
      )}
      <StudioField />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ProjectBoard />
          <TrainingPanel />
        </div>
        <div className="space-y-4">
          <AssignmentPanel projectId={project.id} assignments={list} members={members} />
          <QuestForecast project={project} />
          <Ledger />
        </div>
      </div>
      <GameResult />
    </div>
  );
}

'use client';
import { GAME_DAYS, GAME_SPEEDS, GOAL_FUNDS, MILESTONES, START_FUNDS } from '@/lib/gameConfig';
import { comboStatus, dayToDate } from '@/lib/gameEngine';
import { formatGold, formatSigned } from '@/lib/format';
import Link from 'next/link';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';
import { playChime } from '@/lib/sound';
import { ImpactButton } from '@/components/ui/ImpactButton';

const LOW_FUNDS = 5000;

export function GameHud(): JSX.Element {
  const { t, date } = useL10n();
  const day = useNecroCrew((s) => s.day);
  const funds = useNecroCrew((s) => s.funds);
  const outcome = useNecroCrew((s) => s.outcome);
  const history = useNecroCrew((s) => s.history);
  const playing = useNecroCrew((s) => s.playing);
  const speed = useNecroCrew((s) => s.speed);
  const setPlaying = useNecroCrew((s) => s.setPlaying);
  const setSpeed = useNecroCrew((s) => s.setSpeed);
  const advanceDay = useNecroCrew((s) => s.advanceDay);
  const resetGame = useNecroCrew((s) => s.resetGame);
  const muted = useNecroCrew((s) => s.muted);
  const combo = useNecroCrew((s) => s.combo);
  const lastBanishDay = useNecroCrew((s) => s.lastBanishDay);
  const moonDaysLeft = useNecroCrew((s) => s.moonDaysLeft);
  const reached = useNecroCrew((s) => s.milestones);
  const chain = comboStatus({ day, lastBanishDay, combo });
  const toggleMute = useNecroCrew((s) => s.toggleMute);
  const lostReason = useNecroCrew((s) => s.lostReason);
  const resultOpen = useNecroCrew((s) => s.resultOpen);
  const setResultOpen = useNecroCrew((s) => s.setResultOpen);
  const last = history[history.length - 1];
  const net = last ? last.income - last.salaries - last.penalties : 0;
  const over = outcome !== 'playing';
  // The bar shows progress from the starting funds to the goal, so day 0 reads 0%, not "already 18% done".
  const goalRatio = Math.min(1, Math.max(0, (funds - START_FUNDS) / (GOAL_FUNDS - START_FUNDS)));
  const shownDay = Math.min(day, GAME_DAYS);
  const restart = (): void => {
    if (!over && day > 0 && !window.confirm(t('hud.restartConfirm'))) return;
    resetGame();
  };
  const button = 'rounded-md border px-3 py-1.5 text-sm';
  const onToggleSound = (): void => {
    if (muted) playChime();
    toggleMute();
  };
  const won = outcome === 'won';
  const overLine = won
    ? t('hud.over.won', { day })
    : lostReason === 'bankrupt'
      ? t('hud.over.bankrupt')
      : lostReason === 'cleared'
        ? t('hud.over.cleared')
        : t('hud.over.timeup', { days: GAME_DAYS });
  return (
    <section aria-label={t('hud.status')} className="space-y-3 rounded-lg border border-specter/30 bg-crypt px-4 py-3">
      {over && (
        <div
          role="status"
          className={`flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 ${won ? 'border-ecto' : 'border-crimson'}`}
        >
          <span className="text-sm text-bone">{overLine}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <ImpactButton
              type="button"
              onClick={resetGame}
              className={`${button} font-bold uppercase tracking-[0.08em] border-ecto text-ecto shadow-ecto hover:bg-ecto hover:text-void`}
            >
              {t('hud.newCampaign')}
            </ImpactButton>
            {!resultOpen && (
              <ImpactButton type="button" onClick={() => setResultOpen(true)} className={`${button} border-shadow text-bone hover:border-specter`}>
                {t('hud.viewSummary')}
              </ImpactButton>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-sm text-ash">{t('hud.day')}</p>
          <p className="font-mono text-lg leading-tight text-bone">
            {shownDay} <span className="text-sm text-ash">/ {GAME_DAYS}</span>{' '}
            <span className="text-sm text-ash">{date(dayToDate(shownDay))}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-ash">{t('hud.funds')}</p>
          <p className={`font-mono text-lg leading-tight ${funds < LOW_FUNDS ? 'text-crimson-text' : 'text-ecto'}`}>
            {formatGold(funds)}{' '}
            <span className="text-sm text-ash" aria-live="polite">
              {last ? (
                <span className={net < 0 ? 'text-crimson-text' : 'text-ecto'}>{t('hud.perDay', { amount: formatSigned(net) })}</span>
              ) : (
                ''
              )}
            </span>
          </p>
        </div>
        <div className="min-w-64 flex-1">
          <p className="flex justify-between text-sm text-ash">
            <span className="flex flex-wrap items-center gap-2">
              {t('hud.goal', { percent: Math.round(goalRatio * 100) })}
              {chain && (
                <span className="rounded border border-specter px-1.5 text-bone">
                  {t('hud.combo', { count: chain.count, days: chain.daysLeft })}
                </span>
              )}
              {moonDaysLeft > 0 && <span className="rounded border border-specter px-1.5 text-bone">{t('hud.moon', { days: moonDaysLeft })}</span>}
            </span>
            <span className="shrink-0 whitespace-nowrap font-mono">{formatGold(GOAL_FUNDS)}</span>
          </p>
          <div
            role="progressbar"
            aria-label={t('hud.progress')}
            aria-valuemin={START_FUNDS}
            aria-valuemax={GOAL_FUNDS}
            aria-valuenow={Math.max(START_FUNDS, funds)}
            className="relative mt-1 h-2 overflow-hidden rounded-sm bg-shadow"
          >
            <div className="h-full bg-specter transition-[width] duration-300 ease-out" style={{ width: `${goalRatio * 100}%` }} />
            {MILESTONES.map((m) => (
              <span
                key={m}
                aria-hidden="true"
                className={`absolute top-0 h-full w-0.5 ${reached.includes(m) ? 'bg-ecto' : 'bg-ash'}`}
                style={{ left: `${(Math.max(0, m - START_FUNDS) / (GOAL_FUNDS - START_FUNDS)) * 100}%` }}
              />
            ))}
          </div>
          <span className="sr-only">
            {t('hud.milestones', {
              list: MILESTONES.map((m) => t(reached.includes(m) ? 'hud.reached' : 'hud.notYet', { amount: formatGold(m) })).join(', '),
            })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImpactButton
            type="button"
            onClick={() => setPlaying(!playing)}
            disabled={over}
            aria-pressed={playing}
            className={`${button} font-bold uppercase tracking-[0.08em] ${
              over ? 'border-shadow text-ash' : 'border-ecto text-ecto shadow-ecto hover:bg-ecto hover:text-void'
            }`}
          >
            {playing ? t('hud.pause') : t('hud.play')}
          </ImpactButton>
          <button
            type="button"
            onClick={advanceDay}
            disabled={over || playing}
            className={`${button} ${over || playing ? 'border-shadow text-ash' : 'border-shadow text-bone hover:border-specter'}`}
          >
            {t('hud.step')}
          </button>
          <div role="radiogroup" aria-label={t('hud.speed')} className="flex gap-1">
            {GAME_SPEEDS.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={speed === v}
                onClick={() => setSpeed(v)}
                className={`${button} ${speed === v ? 'border-specter bg-shadow text-bone' : 'border-shadow text-ash hover:text-bone'}`}
              >
                {v}x
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={!muted}
            className={`${button} ${muted ? 'border-crimson text-crimson-text' : 'border-shadow text-bone'}`}
          >
            {muted ? t('hud.soundOff') : t('hud.soundOn')}
          </button>
          {!over && (
            <button type="button" onClick={restart} className={`${button} border-shadow text-ash hover:text-bone`}>
              {t('hud.restart')}
            </button>
          )}
          <Link href="/guide" className="px-1 text-sm text-specter-text underline">
            {t('hud.guide')}
          </Link>
        </div>
      </div>
    </section>
  );
}

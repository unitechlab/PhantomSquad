'use client';
import { Portrait } from '@/components/art/Portrait';
import { Modal } from '@/components/ui/Modal';
import { GAME_DAYS, GOAL_FUNDS, START_FUNDS } from '@/lib/gameConfig';
import { formatGold } from '@/lib/format';
import { gameRank, mostValuable, type Rank } from '@/lib/gameEngine';
import { useL10n } from '@/hooks/useL10n';
import { useGameState, useNecroCrew } from '@/store/useNecroCrew';
import { ImpactButton } from '@/components/ui/ImpactButton';
import Link from 'next/link';

const RANK_STYLE: Record<Rank, string> = {
  S: 'border-ecto text-ecto shadow-ecto',
  A: 'border-specter text-specter-text',
  B: 'border-ash text-bone',
  C: 'border-crimson text-crimson-text',
};

/** End-of-campaign summary. Closing it keeps the final field on screen. */
export function GameResult(): JSX.Element | null {
  const { t, memberName } = useL10n();
  const outcome = useNecroCrew((s) => s.outcome);
  const lostReason = useNecroCrew((s) => s.lostReason);
  const funds = useNecroCrew((s) => s.funds);
  const day = useNecroCrew((s) => s.day);
  const runs = useNecroCrew((s) => s.runs);
  const projects = useNecroCrew((s) => s.projects);
  const resetGame = useNecroCrew((s) => s.resetGame);
  const resultOpen = useNecroCrew((s) => s.resultOpen);
  const setResultOpen = useNecroCrew((s) => s.setResultOpen);
  const game = useGameState();
  if (outcome === 'playing' || !resultOpen) return null;
  const close = (): void => setResultOpen(false);
  const banished = projects.filter((p) => runs[p.id].completedOnDay !== null).length;
  const won = outcome === 'won';
  const rank = gameRank(game);
  const mvp = mostValuable(game);
  const mvpMember = game.members.find((m) => m.id === mvp?.memberId);
  const reason = won ? 'won' : lostReason === 'bankrupt' ? 'bankrupt' : lostReason === 'cleared' ? 'cleared' : 'timeup';
  const title = t(`result.title.${reason}`);
  const body = t(`result.body.${reason}`, {
    goal: formatGold(GOAL_FUNDS),
    day,
    days: GAME_DAYS,
    funds: formatGold(funds),
  });
  return (
    <Modal title={title} onClose={close}>
      <div className="space-y-4">
        <p className="text-bone">{body}</p>
        <div className="flex items-center gap-4 rounded-lg border border-shadow p-3">
          <span
            role="img"
            aria-label={t('result.rank', { rank })}
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 font-mono text-5xl font-bold ${RANK_STYLE[rank]}`}
          >
            {rank}
          </span>
          <div className="space-y-1">
            <p className="text-bone">{t('result.rank', { rank })}</p>
            <p className="text-sm text-ash">{t(`result.rank.${rank}`)}</p>
          </div>
        </div>
        {mvpMember && mvp && (
          <div className="flex items-center gap-3 rounded-lg border border-shadow p-3">
            <Portrait id={mvpMember.characterId} name={memberName(mvpMember)} kind="face" width={56} />
            <div>
              <p className="text-sm text-ash">{t('result.mvp')}</p>
              <p className="text-bone">{t('result.mvpWork', { name: memberName(mvpMember), work: mvp.work.toFixed(1) })}</p>
            </div>
          </div>
        )}
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ash">{t('result.finalFunds')}</dt>
          <dd className="font-mono text-bone">{formatGold(funds)}</dd>
          <dt className="text-ash">{t('result.profit')}</dt>
          <dd className={`font-mono ${funds - START_FUNDS >= 0 ? 'text-ecto' : 'text-crimson-text'}`}>{formatGold(funds - START_FUNDS)}</dd>
          <dt className="text-ash">{t('result.banished')}</dt>
          <dd className="font-mono text-bone">
            {banished} / {projects.length}
          </dd>
        </dl>
        <p className="text-sm text-ash">{won ? t('result.outro.won') : t('result.outro.lost')}</p>
        <div className="flex flex-wrap gap-3">
          <ImpactButton
            type="button"
            onClick={resetGame}
            className="rounded-md border border-ecto px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-ecto shadow-ecto hover:bg-ecto hover:text-void"
          >
            {t('result.newCampaign')}
          </ImpactButton>
          <Link
            href="/guide"
            onClick={close}
            className="rounded-md border border-specter px-4 py-2 text-sm uppercase tracking-[0.08em] text-bone hover:shadow-specter"
          >
            {t('result.guide')}
          </Link>
          <ImpactButton type="button" onClick={close} className="rounded-md border border-shadow px-4 py-2 text-sm text-ash hover:text-bone">
            {t('result.review')}
          </ImpactButton>
        </div>
      </div>
    </Modal>
  );
}

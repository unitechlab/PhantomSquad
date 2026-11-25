'use client';
import type { GameEvent } from '@/lib/gameEngine';
import { dayToDate } from '@/lib/gameEngine';
import { formatGold } from '@/lib/format';
import { useL10n, type L10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';

const ROWS = 10;

function describe(e: GameEvent, l: L10n, titleOf: (id?: string) => string, nameOf: (id?: string) => string): string | null {
  const { t, skill } = l;
  switch (e.kind) {
    case 'started':
      return t('event.started', { title: titleOf(e.projectId) });
    case 'banished':
      return (e.bonus ?? 0) > 0
        ? t('event.banishedCombo', { title: titleOf(e.projectId), amount: formatGold(e.amount ?? 0), combo: e.combo ?? 1, bonus: formatGold(e.bonus ?? 0) })
        : t('event.banished', { title: titleOf(e.projectId), amount: formatGold(e.amount ?? 0) });
    case 'late':
      return t('event.late', { title: titleOf(e.projectId) });
    case 'incident':
      return e.incident === 'moon'
        ? t('event.moon')
        : e.incident === 'glitch'
          ? t('event.glitch', { title: titleOf(e.projectId), amount: e.amount ?? 0, skill: e.skill ? skill(e.skill) : '' })
          : t('event.sponsor', { amount: formatGold(e.amount ?? 0) });
    case 'milestone':
      return t('event.milestone', { amount: formatGold(e.amount ?? 0) });
    case 'trained':
      return t('event.trained', { name: nameOf(e.memberId), skill: e.skill ? skill(e.skill) : '' });
  }
}

export function Ledger(): JSX.Element {
  const l = useL10n();
  const { t, date } = l;
  const history = useNecroCrew((s) => s.history);
  const projects = useNecroCrew((s) => s.projects);
  const members = useNecroCrew((s) => s.members);
  const titleOf = (id?: string): string => {
    const p = projects.find((x) => x.id === id);
    return p ? l.questTitle(p) : '';
  };
  const nameOf = (id?: string): string => {
    const m = members.find((x) => x.id === id);
    return m ? l.memberName(m) : '';
  };
  const rows = history.slice(-ROWS).reverse();
  return (
    <section aria-labelledby="ledger-title" className="space-y-3 rounded-lg border border-specter/30 bg-crypt p-4">
      <h2 id="ledger-title" className="text-lg">
        {t('ledger.title')}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ash">{t('ledger.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ash">
              <tr>
                <th className="whitespace-nowrap py-1 pr-3 font-normal">{t('ledger.day')}</th>
                <th className="whitespace-nowrap py-1 pr-3 text-right font-normal">{t('ledger.income')}</th>
                <th className="whitespace-nowrap py-1 pr-3 text-right font-normal">{t('ledger.salaries')}</th>
                <th className="whitespace-nowrap py-1 pr-3 text-right font-normal">{t('ledger.penalties')}</th>
                <th className="whitespace-nowrap py-1 pr-3 text-right font-normal">{t('ledger.funds')}</th>
                <th className="py-1 font-normal">{t('ledger.events')}</th>
              </tr>
            </thead>
            <tbody className="font-mono text-bone">
              {rows.map((h) => (
                <tr key={h.day} className="border-t border-shadow align-top">
                  <td className="whitespace-nowrap py-1 pr-3">
                    {h.day} <span className="text-ash">{date(dayToDate(h.day))}</span>
                  </td>
                  <td className="whitespace-nowrap py-1 pr-3 text-right text-ecto">{h.income > 0 ? formatGold(h.income) : '-'}</td>
                  <td className="whitespace-nowrap py-1 pr-3 text-right">{h.salaries > 0 ? formatGold(h.salaries) : '-'}</td>
                  <td className="whitespace-nowrap py-1 pr-3 text-right text-crimson-text">{h.penalties > 0 ? formatGold(h.penalties) : '-'}</td>
                  <td className="whitespace-nowrap py-1 pr-3 text-right">{formatGold(h.funds)}</td>
                  <td className="py-1 font-sans text-ash">
                    {h.events.map((e) => describe(e, l, titleOf, nameOf)).filter(Boolean).join(t('ledger.join'))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

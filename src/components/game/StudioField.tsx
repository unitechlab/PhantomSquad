'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { SKILL_CATEGORIES, type SkillCategory } from '@/types';
import { AssetImage } from '@/components/art/AssetImage';
import { CoinBurst } from '@/components/art/CoinBurst';
import { ParticleBurst } from '@/components/art/ParticleBurst';
import { FieldMember } from '@/components/game/FieldMember';
import { asset } from '@/lib/assets';
import { STATIONS, layoutMembers, stationFor, type StationId } from '@/lib/fieldLayout';
import { useL10n, type L10n } from '@/hooks/useL10n';
import { dayToDate, isRunning, memberActivity, projectDeadlineDay, projectStartDay, type GameEvent, type GameState } from '@/lib/gameEngine';
import { formatGold } from '@/lib/format';
import { playAlert, playChime, playCoins, playCombo, playGlitch, playMilestone, playMoon, playStart } from '@/lib/sound';
import { useGameState, useNecroCrew } from '@/store/useNecroCrew';

/** A room is 31% x 30% of the field, centred on its station point. Matches the rooms in company-house.webp. */
const ROOM_WIDTH = 31;
const ROOM_HEIGHT = 30;
const ROW_Y_INCOMING = 77;
const FIELD_BACKGROUND = 'scenes/company-house.webp';
/** Keeps the whole picture on one screen: height is the viewport minus the nav bar and the status bar. */
const FIELD_MAX_WIDTH = 'max(720px, calc((100vh - 190px) * 1.5))';
/** Tailwind cannot apply opacity to the CSS-variable colours, so the dark panel is mixed here. */
const PANEL_STYLE = { backgroundColor: 'color-mix(in srgb, var(--color-void) 82%, transparent)' } as const;
const WALK_SECONDS_AT_1X = 0.7;
const MIN_WALK_SECONDS = 0.08;
const BANNER_MS = 2600;
const BAT_MS = 1800;
const NOTICE_MS = 3200;
const SHAKE_PX = 7;
const START_MS = 900;

interface Notice {
  key: string;
  text: string;
  tone: 'good' | 'warn';
}

/** Headline for a milestone or incident event. */
function noticeFor(e: GameEvent, questTitle: string, l: L10n): Notice | null {
  const { t } = l;
  if (e.kind === 'milestone') return { key: `m${e.amount}`, text: t('notice.milestone', { amount: formatGold(e.amount ?? 0) }), tone: 'good' };
  if (e.kind !== 'incident') return null;
  if (e.incident === 'moon') return { key: 'moon', text: t('notice.moon'), tone: 'good' };
  if (e.incident === 'sponsor') return { key: 'sponsor', text: t('notice.sponsor', { amount: formatGold(e.amount ?? 0) }), tone: 'good' };
  return {
    key: 'glitch',
    text: t('notice.glitch', { title: questTitle, amount: e.amount ?? 0, skill: e.skill ? l.skill(e.skill) : '' }),
    tone: 'warn',
  };
}

/** English titles are cut to two words. Japanese titles have no spaces, so CSS truncates them. */
function shortTitle(title: string, lang: L10n['lang']): string {
  return lang === 'ja' ? title : title.split(' ').slice(0, 2).join(' ');
}

function openStreams(game: GameState, skill: SkillCategory, l: L10n): { id: string; title: string; remaining: number; total: number }[] {
  const rows: { id: string; title: string; remaining: number; total: number }[] = [];
  for (const p of game.projects) {
    if (!isRunning(game, p)) continue;
    const s = game.runs[p.id].streams.find((x) => x.skillName === skill && x.remaining > 0);
    if (s) rows.push({ id: p.id, title: shortTitle(l.questTitle(p), l.lang), remaining: s.remaining, total: s.total });
  }
  return rows;
}

function Room({ station, children, active }: { station: StationId; children?: React.ReactNode; active: boolean }): JSX.Element {
  const { station: stationLabel } = useL10n();
  const { x, y } = STATIONS[station];
  return (
    <div
      className={`absolute rounded-lg border-2 ${active ? 'border-ecto' : 'border-transparent'}`}
      style={{ left: `${x - ROOM_WIDTH / 2}%`, top: `${y - ROOM_HEIGHT / 2}%`, width: `${ROOM_WIDTH}%`, height: `${ROOM_HEIGHT}%` }}
    >
      <span className="sr-only">{stationLabel(station)}</span>
      {children}
    </div>
  );
}

/** Small dark panel at the bottom of a room, so text stays readable on the picture. */
function Chip({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="absolute inset-x-2 bottom-2 rounded-md px-2 py-1" style={PANEL_STYLE}>{children}</div>;
}

export function StudioField(): JSX.Element {
  const l10n = useL10n();
  const { t } = l10n;
  const game = useGameState();
  const playing = useNecroCrew((s) => s.playing);
  const speed = useNecroCrew((s) => s.speed);
  const muted = useNecroCrew((s) => s.muted);
  const summonCount = useNecroCrew((s) => s.summonCount);
  const reduced = useReducedMotion();
  const background = asset(FIELD_BACKGROUND);

  const activities = useMemo(
    () => Object.fromEntries(game.members.map((m) => [m.id, memberActivity(game, m.id)])),
    [game],
  );
  const positions = useMemo(
    () => layoutMembers(game.members.map((m) => ({ memberId: m.id, station: stationFor(activities[m.id]) }))),
    [game.members, activities],
  );

  const nameById = (id: string): string => {
    const m = game.members.find((x) => x.id === id);
    return m ? l10n.memberName(m) : '';
  };
  const anyOverdue = game.outcome === 'playing' && game.projects.some((p) => isRunning(game, p) && game.day > projectDeadlineDay(p));
  const last = game.history[game.history.length - 1];
  const workingAt = new Set<StationId>(game.members.map((m) => stationFor(activities[m.id])));
  const moveSeconds = reduced ? 0 : Math.max(MIN_WALK_SECONDS, WALK_SECONDS_AT_1X / speed);

  // Banner and bat react to the days that were played since the last render.
  const seen = useRef(game.history.length);
  const [banner, setBanner] = useState<{ key: number; title: string; amount: number; combo: number; bonus: number } | null>(null);
  const [notice, setNotice] = useState<(Notice & { id: number }) | null>(null);
  const [coins, setCoins] = useState(0);
  const shake = useAnimationControls();
  const [bat, setBat] = useState<{ key: number; title: string } | null>(null);
  const [burst, setBurst] = useState(0);
  const [start, setStart] = useState(0);

  // A "START!" flourish each time a squad is summoned. summonCount starts at 0, so the first mount stays quiet.
  const seenSummons = useRef(summonCount);
  useEffect(() => {
    if (summonCount === seenSummons.current) return;
    seenSummons.current = summonCount;
    setStart((n) => n + 1);
    if (!muted) playStart();
    const t = setTimeout(() => setStart(0), START_MS);
    return () => clearTimeout(t);
  }, [summonCount, muted]);

  useEffect(() => {
    if (game.history.length < seen.current) seen.current = game.history.length; // restart
    if (game.history.length === seen.current) return;
    const fresh = game.history.slice(seen.current);
    const earlier = game.history.slice(0, seen.current);
    seen.current = game.history.length;
    for (const entry of fresh) {
      for (const e of entry.events) {
        const project = game.projects.find((p) => p.id === e.projectId);
        const title = project ? l10n.questTitle(project) : '';
        if (e.kind === 'banished') {
          setBanner({ key: entry.day, title, amount: e.amount ?? 0, combo: e.combo ?? 1, bonus: e.bonus ?? 0 });
          setBurst((b) => b + 1);
          setCoins((c) => c + 1);
          if (!reduced) void shake.start({ x: [0, -SHAKE_PX, SHAKE_PX, -SHAKE_PX / 2, SHAKE_PX / 2, 0], transition: { duration: 0.4, ease: 'easeOut' } });
          if (!muted) {
            playChime();
            if ((e.combo ?? 1) >= 2) playCombo((e.combo ?? 1) - 1);
          }
        }
        const n = noticeFor(e, title, l10n);
        if (n) {
          setNotice({ ...n, id: entry.day });
          if (!muted) {
            if (e.kind === 'milestone') playMilestone();
            else if (e.incident === 'moon') playMoon();
            else if (e.incident === 'sponsor') playCoins();
            else playGlitch();
          }
        }
        if (e.kind === 'late' && !earlier.some((h) => h.events.some((x) => x.kind === 'late' && x.projectId === e.projectId))) {
          setBat({ key: entry.day, title });
          if (!muted) playAlert();
        }
      }
    }
  }, [game.history, game.projects, muted, reduced, shake, l10n]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), BANNER_MS);
    return () => clearTimeout(t);
  }, [banner]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!bat) return;
    const t = setTimeout(() => setBat(null), BAT_MS);
    return () => clearTimeout(t);
  }, [bat]);
  // When the campaign ends, clear the transient overlays so nothing lingers behind the result dialog.
  useEffect(() => {
    if (game.outcome === 'playing') return;
    setBat(null);
    setNotice(null);
    setBanner(null);
  }, [game.outcome]);

  const upcoming = game.projects
    .filter((p) => game.runs[p.id].completedOnDay === null && projectStartDay(p) > game.day)
    .sort((a, b) => projectStartDay(a) - projectStartDay(b))
    .slice(0, 2);

  const floatText = (skill: SkillCategory): JSX.Element | null => {
    const done = last?.work[skill] ?? 0;
    if (reduced || done < 0.05) return null;
    return (
      <motion.span
        key={`${skill}-${game.history.length}`}
        aria-hidden="true"
        className="absolute right-2 top-2 rounded px-1 font-mono text-sm text-ecto"
        style={PANEL_STYLE}
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        -{done.toFixed(1)}
      </motion.span>
    );
  };

  return (
    <section aria-label={t('field.aria')} className="relative">
      <motion.div
        animate={shake}
        className={`relative isolate mx-auto w-full overflow-hidden rounded-lg border bg-crypt ${anyOverdue ? 'death-march border-crimson' : game.moonDaysLeft > 0 ? 'border-specter shadow-specter' : 'border-specter/30'} ${playing ? '' : 'field-paused'}`}
        style={{ aspectRatio: `${background.width} / ${background.height}`, maxWidth: FIELD_MAX_WIDTH }}
      >
        <Image src={background.src} alt="" fill priority sizes="(min-width: 1280px) 1280px, 100vw" className="pointer-events-none object-cover" aria-hidden="true" />
        {SKILL_CATEGORIES.map((skill) => {
          const rows = openStreams(game, skill, l10n);
          return (
            <Room key={skill} station={skill} active={workingAt.has(skill)}>
              {floatText(skill)}
              {rows.length > 0 && (
                <Chip>
                  <ul className="space-y-0.5">
                    {rows.slice(0, 2).map((r) => (
                      <li key={r.id} className="text-sm leading-tight text-bone">
                        <span className="flex justify-between gap-2">
                          <span className="truncate">{r.title}</span>
                          <span className="font-mono text-ecto">{r.remaining.toFixed(1)}</span>
                        </span>
                        <span className="block h-1 overflow-hidden rounded-sm bg-shadow">
                          <span
                            className="block h-full bg-ecto transition-[width] duration-300 ease-out"
                            style={{ width: `${(r.remaining / r.total) * 100}%` }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </Chip>
              )}
            </Room>
          );
        })}
        <Room station="dojo" active={workingAt.has('dojo')}>
          {Object.keys(game.training).length > 0 && (
            <Chip>
              <ul className="text-sm text-bone">
                {Object.entries(game.training).map(([id, tr]) => (
                  <li key={id}>
                    {nameById(id)}: {l10n.skill(tr.skill)} ({tr.daysLeft}{t('common.dayLabel')})
                  </li>
                ))}
              </ul>
            </Chip>
          )}
        </Room>
        <Room station="lounge" active={false}>
          {!reduced && summonCount > 0 && (
            <motion.div
              key={summonCount}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <AssetImage assetKey="effects/summon-pillar.webp" width={120} alt="" />
            </motion.div>
          )}
        </Room>
        <div
          className="absolute"
          style={{ left: `${83 - ROOM_WIDTH / 2}%`, top: `${ROW_Y_INCOMING - ROOM_HEIGHT / 2}%`, width: `${ROOM_WIDTH}%`, height: `${ROOM_HEIGHT}%` }}
        >
          <span className="sr-only">{t('field.incoming')}</span>
          <Chip>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ash">{t('field.noneComing')}</p>
            ) : (
              <ul className="space-y-0.5 text-sm text-bone">
                {upcoming.map((p) => (
                  <li key={p.id} className="leading-tight">
                    <span className="block truncate">{l10n.questTitle(p)}</span>
                    <span className="text-ash">
                      {l10n.date(dayToDate(projectStartDay(p)))} · {formatGold(p.reward)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Chip>
        </div>
        {/* People layer. Rooms stay behind, so walking never hides a room's label. */}
        <div className="pointer-events-none absolute inset-0">
          {game.members.map((m) => (
            <FieldMember
              key={m.id}
              member={m}
              x={positions[m.id].x}
              y={positions[m.id].y}
              activity={activities[m.id]}
              moveSeconds={moveSeconds}
              paused={!playing}
            />
          ))}
        </div>

        <AnimatePresence>
          {banner && (
            <motion.div
              key={`banner-${banner.key}`}
              role="status"
              className="absolute z-[2000] flex flex-col items-center gap-1 rounded-lg border border-ecto px-4 py-2"
              style={{ left: `${STATIONS.lounge.x}%`, top: `${STATIONS.lounge.y}%`, x: '-50%', y: '-50%', ...PANEL_STYLE }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25, ease: 'easeOut' }}
            >
              <AssetImage assetKey="ui/quest-complete.webp" width={240} alt={t('field.questComplete')} />
              <span className="text-sm text-bone">{banner.title}</span>
              <span className="font-mono text-ecto">+{formatGold(banner.amount)}</span>
              {banner.combo >= 2 && (
                <span className="rounded border border-specter px-2 py-0.5 text-sm font-bold text-bone">
                  {t('field.combo', { count: banner.combo })}
                  {banner.bonus > 0 && <span className="ml-2 font-mono text-ecto">+{formatGold(banner.bonus)}</span>}
                </span>
              )}
              <ParticleBurst trigger={burst} />
            </motion.div>
          )}
        </AnimatePresence>

        <CoinBurst trigger={coins} />
        {/* Capped at a readable line width (not a field percentage), so a long notice wraps instead of
            stretching wide enough to sit on top of a room's work list on the sides of the floor. */}
        <div className="pointer-events-none absolute left-1/2 top-[57%] z-[2000] flex w-max max-w-[min(90%,28rem)] -translate-x-1/2 flex-col items-center gap-2">
          <AnimatePresence>
            {notice && (
              <motion.div
                key={`notice-${notice.key}-${notice.id}`}
                role="status"
                className={`rounded-lg border px-4 py-2 text-center text-sm font-bold text-bone ${notice.tone === 'good' ? 'border-ecto' : 'border-crimson'}`}
                style={PANEL_STYLE}
                initial={{ opacity: 0, y: reduced ? 0 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
              >
                {notice.tone === 'warn' ? '⚠ ' : '★ '}
                {notice.text}
              </motion.div>
            )}
          </AnimatePresence>
          {bat && (
            <div role="alert" className="rounded-lg border border-crimson px-4 py-2 text-crimson-text" style={PANEL_STYLE}>
              ☠ {t('field.batAlert', { title: bat.title })}
            </div>
          )}
        </div>
        {bat && !reduced && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-20 z-[1900]"
            initial={{ x: -140 }}
            animate={{ x: 1400 }}
            transition={{ duration: 1.6, ease: 'easeIn' }}
          >
            <AssetImage assetKey="effects/bat.webp" width={130} alt="" />
          </motion.div>
        )}
        <AnimatePresence>
          {start > 0 && !reduced && (
            <motion.div
              key={start}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[2100] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: START_MS / 1000, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
            >
              <motion.span
                className="rounded-xl border-2 border-ecto bg-void/85 px-10 py-4 text-5xl font-bold uppercase tracking-[0.2em] text-ecto shadow-ecto"
                initial={{ scale: 0.6 }}
                animate={{ scale: [0.6, 1.1, 1] }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                {t('field.start')}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ul className="sr-only">
        {game.members.map((m) => {
          const a = activities[m.id];
          return (
            <li key={m.id}>
              {a.kind === 'working' && a.skill
                ? t('field.working', { name: l10n.memberName(m), skill: l10n.skill(a.skill) })
                : a.kind === 'training' && a.skill
                  ? t('field.training', { name: l10n.memberName(m), skill: l10n.skill(a.skill) })
                  : t('field.waiting', { name: l10n.memberName(m) })}
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {t('field.day', { day: game.day })}
      </p>
      {anyOverdue && (
        <p className="mt-2 text-sm text-crimson-text">{t('field.overdue')}</p>
      )}
    </section>
  );
}












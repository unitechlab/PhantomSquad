'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LANG_STORAGE_KEY, LANGS, type Lang, type TextKey } from '@/data/i18n';
import { useL10n } from '@/hooks/useL10n';
import { unlockAudio } from '@/lib/sound';
import { useNecroCrew } from '@/store/useNecroCrew';

const TABS: { href: string; key: TextKey }[] = [
  { href: '/about', key: 'nav.about' },
  { href: '/grimoire', key: 'nav.grimoire' },
  { href: '/quests', key: 'nav.quests' },
  { href: '/simulator', key: 'nav.studio' },
  { href: '/guide', key: 'nav.guide' },
];

const LANG_LABELS: Record<Lang, string> = { en: 'English', ja: '日本語' };

export function NavigationBar(): JSX.Element {
  const pathname = usePathname();
  const { t, lang } = useL10n();
  const muted = useNecroCrew((s) => s.muted);
  const toggleMute = useNecroCrew((s) => s.toggleMute);
  const setLang = useNecroCrew((s) => s.setLang);

  useEffect(() => {
    const events = ['pointerdown', 'keydown'] as const;
    const unlock = (): void => {
      unlockAudio();
      for (const e of events) window.removeEventListener(e, unlock);
    };
    for (const e of events) window.addEventListener(e, unlock);
    return () => {
      for (const e of events) window.removeEventListener(e, unlock);
    };
  }, []);

  const chooseLang = (next: Lang): void => {
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice still applies for this visit.
    }
  };

  return (
    <header className="border-b border-shadow bg-crypt">
      <nav aria-label={t('nav.main')} className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-6 text-lg font-bold uppercase tracking-[0.08em] text-bone">
          Necro<span className="text-specter-text">Crew</span>
        </Link>
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-md border px-4 py-2 text-sm uppercase tracking-[0.08em] ${
                active ? 'border-ecto text-ecto shadow-ecto' : 'border-shadow text-ash hover:text-bone'
              }`}
            >
              {t(tab.key)}
            </Link>
          );
        })}
        <div role="radiogroup" aria-label={t('nav.language')} className="ml-auto flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              lang={l}
              onClick={() => chooseLang(l)}
              className={`rounded-md border px-3 py-2 text-sm ${
                lang === l ? 'border-specter bg-shadow text-bone' : 'border-shadow text-ash hover:text-bone'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={!muted}
          aria-label={muted ? t('nav.soundOffLabel') : t('nav.soundOnLabel')}
          className="rounded-md border border-shadow px-3 py-2 text-sm text-ash hover:text-bone"
        >
          {muted ? t('nav.soundOff') : t('nav.soundOn')}
        </button>
      </nav>
    </header>
  );
}

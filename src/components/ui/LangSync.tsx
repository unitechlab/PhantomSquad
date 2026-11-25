'use client';
import { useEffect, useLayoutEffect } from 'react';
import { isLang, LANG_STORAGE_KEY } from '@/data/i18n';
import { useNecroCrew } from '@/store/useNecroCrew';

const TITLES = {
  en: 'NecroCrew — Phantom Squad Simulator',
  ja: 'NecroCrew — ファントムスクワッド・シミュレーター',
} as const;

/** Restores the saved language before the browser paints (useLayoutEffect, not useEffect), so a Japanese
 *  visitor does not see a flash of English text first. The server always renders English; this swaps the
 *  text in the same frame the page becomes visible, instead of one frame after. */
export function LangSync(): null {
  const lang = useNecroCrew((s) => s.lang);
  const setLang = useNecroCrew((s) => s.setLang);

  useLayoutEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      // Storage can be blocked; stay on the default language.
    }
    if (isLang(saved)) setLang(saved);
  }, [setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = TITLES[lang];
  }, [lang]);

  return null;
}

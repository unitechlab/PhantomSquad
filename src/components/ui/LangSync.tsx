'use client';
import { useEffect } from 'react';
import { isLang, LANG_STORAGE_KEY } from '@/data/i18n';
import { useNecroCrew } from '@/store/useNecroCrew';

const TITLES = {
  en: 'NecroCrew — Phantom Squad Simulator',
  ja: 'NecroCrew — ファントムスクワッド・シミュレーター',
} as const;

/** Restores the saved language after load (English until the player picks another), then keeps the page language and title in step with the store. */
export function LangSync(): null {
  const lang = useNecroCrew((s) => s.lang);
  const setLang = useNecroCrew((s) => s.setLang);

  useEffect(() => {
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

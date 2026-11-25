'use client';
import { useEffect, useRef } from 'react';
import { readSave, saveGame, useNecroCrew } from '@/store/useNecroCrew';

/** Restores a saved campaign after the page mounts, then saves to localStorage on every change.
 *  Leaving the Studio (or reloading) no longer resets day 0 / 20,000 G. */
export function GameSync(): null {
  const loaded = useRef(false);

  useEffect(() => {
    const save = readSave();
    if (save) useNecroCrew.getState().loadSave(save);
    loaded.current = true;
  }, []);

  useEffect(() => {
    const unsubscribe = useNecroCrew.subscribe((state, prev) => {
      if (!loaded.current) return; // do not overwrite the save with the fresh campaign before it is restored
      if (state.outcome === 'playing' && state.day === 0 && state.history.length === 0 && prev.day === 0) return;
      saveGame();
    });
    return unsubscribe;
  }, []);

  return null;
}

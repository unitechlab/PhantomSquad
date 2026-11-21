'use client';

import { useEffect } from 'react';
import { useNecroCrew } from '@/store/useNecroCrew';
import { BASE_DAY_MS } from '@/lib/gameConfig';

/** Advances one game day per tick while playing. Pauses the game when the page is left. */
export function useGameClock(): void {
  const playing = useNecroCrew((s) => s.playing);
  const speed = useNecroCrew((s) => s.speed);
  const advanceDay = useNecroCrew((s) => s.advanceDay);
  const setPlaying = useNecroCrew((s) => s.setPlaying);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advanceDay, BASE_DAY_MS / speed);
    return () => clearInterval(id);
  }, [playing, speed, advanceDay]);

  useEffect(() => () => setPlaying(false), [setPlaying]);
}

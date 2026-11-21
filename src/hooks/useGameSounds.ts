'use client';
import { useEffect, useRef } from 'react';
import { useNecroCrew } from '@/store/useNecroCrew';
import { playLose, playTick, playTrain, playWin } from '@/lib/sound';

/** Plays day ticks, training starts and the final result. Quest and overdue cues live in StudioField. */
export function useGameSounds(): void {
  const day = useNecroCrew((s) => s.day);
  const outcome = useNecroCrew((s) => s.outcome);
  const trainingCount = useNecroCrew((s) => Object.keys(s.training).length);
  const muted = useNecroCrew((s) => s.muted);
  const prev = useRef({ day, outcome, trainingCount });

  useEffect(() => {
    const before = prev.current;
    prev.current = { day, outcome, trainingCount };
    if (muted) return;
    if (outcome !== before.outcome) {
      if (outcome === 'won') playWin();
      else if (outcome === 'lost') playLose();
      return;
    }
    if (trainingCount > before.trainingCount) playTrain();
    else if (day > before.day) playTick();
  }, [day, outcome, trainingCount, muted]);
}

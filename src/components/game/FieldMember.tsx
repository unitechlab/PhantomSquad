'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Member } from '@/types';
import type { Activity } from '@/lib/gameEngine';
import { Portrait } from '@/components/art/Portrait';
import { SkillIcon } from '@/components/art/SkillIcon';
import { useL10n } from '@/hooks/useL10n';
import { lineFor, type Mood } from '@/lib/speech';

const SPRITE_WIDTH = 72;
const BUBBLE_MS = 2200;

interface FieldMemberProps {
  member: Member;
  /** Target position in percent of the field. */
  x: number;
  y: number;
  activity: Activity;
  /** Seconds a walk takes. 0 skips the walk (reduced motion). */
  moveSeconds: number;
  paused: boolean;
}

/** One creator on the floor. Walks to its station, bobs while walking and taps while working. */
export function FieldMember({ member, x, y, activity, moveSeconds, paused }: FieldMemberProps): JSX.Element {
  const [moving, setMoving] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const prevX = useRef(x);
  const reduced = useReducedMotion();
  const { lang, memberName } = useL10n();
  const [line, setLine] = useState<string | null>(null);
  const job = `${activity.kind}:${activity.skill ?? ''}`;
  const prevJob = useRef(job);

  useEffect(() => {
    if (x === prevX.current) return;
    setFacing(x < prevX.current ? -1 : 1);
    prevX.current = x;
  }, [x]);

  // A creator speaks when their job changes. Not on the first render, so the floor starts quiet.
  useEffect(() => {
    if (prevJob.current === job) return;
    prevJob.current = job;
    const mood: Mood = activity.kind === 'working' ? 'work' : activity.kind === 'training' ? 'train' : 'idle';
    setLine(lineFor(member.characterId, mood, activity.skill, lang));
    const t = setTimeout(() => setLine(null), BUBBLE_MS);
    return () => clearTimeout(t);
    // The language is read when the line is picked, not as a trigger: switching language must not make everyone speak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, activity.kind, activity.skill, member.characterId]);

  const motionClass = moving ? 'walking' : activity.kind === 'working' ? 'working' : '';

  return (
    <motion.div
      className={`absolute flex flex-col items-center ${paused ? 'field-paused' : ''}`}
      style={{ x: '-50%', y: '-100%', zIndex: line ? 1500 : Math.round(y * 10) }}
      initial={false}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={{ duration: moveSeconds, ease: 'easeInOut' }}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={() => setMoving(false)}
    >
      <div className="relative">
        <AnimatePresence>
          {line && (
            <motion.span
              key="bubble"
              aria-hidden="true"
              className="absolute bottom-full left-1/2 mb-1 whitespace-nowrap rounded-md border border-specter px-2 py-1 text-sm text-bone"
              style={{ x: '-50%', backgroundColor: 'color-mix(in srgb, var(--color-void) 90%, transparent)' }}
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}
            >
              {line}
            </motion.span>
          )}
        </AnimatePresence>
        <div style={{ transform: `scaleX(${facing})` }}>
          <div className={`sprite ${motionClass}`}>
            <Portrait id={member.characterId} name="" kind="mini" width={SPRITE_WIDTH} />
          </div>
        </div>
        <span aria-hidden="true" className="absolute -right-2 -top-1 leading-none">
          {activity.kind === 'working' && activity.skill && <SkillIcon skill={activity.skill} size={22} />}
          {activity.kind === 'training' && '📚'}
        </span>
      </div>
      <span className="rounded bg-void/80 px-1 text-sm text-bone">{memberName(member)}</span>
    </motion.div>
  );
}



'use client';
import { motion, useReducedMotion } from 'framer-motion';

const COINS = [-170, -130, -95, -60, -30, 0, 25, 55, 90, 125, 160, 190] as const;
const RISE_PX = 420;
const STAGGER_S = 0.04;

/** Gold coins that fly up out of the field toward the status bar. Restarts when `trigger` changes. */
export function CoinBurst({ trigger }: { trigger: number }): JSX.Element | null {
  const reduced = useReducedMotion();
  if (trigger === 0 || reduced) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1950]" key={trigger}>
      {COINS.map((dx, i) => (
        <motion.span
          key={dx}
          className="absolute left-1/2 top-1/2 block h-4 w-4 rounded-full border-2 border-[#8a6a00] bg-[#ffd83a]"
          initial={{ x: dx / 3, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: dx, y: -RISE_PX - (i % 3) * 40, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.8, delay: i * STAGGER_S, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

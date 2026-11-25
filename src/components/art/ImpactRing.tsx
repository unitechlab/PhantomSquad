'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const DURATION_MS = 450;

/**
 * A ring of the given colour that expands and fades from a confirm button's own outline — a
 * confirm reads as "that did something" without a particle shower. Re-fires whenever `trigger`
 * changes to a value other than 0 (bump a counter on click).
 */
export function ImpactRing({ trigger, color = 'var(--color-ecto)' }: { trigger: number; color?: string }): JSX.Element | null {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (trigger === 0 || reduced) return;
    setActive(trigger);
    const t = setTimeout(() => setActive(0), DURATION_MS);
    return () => clearTimeout(t);
  }, [trigger, reduced]);

  if (reduced) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {active !== 0 && (
          <motion.span
            key={active}
            className="absolute inset-0 rounded-md"
            style={{ border: `2px solid ${color}` }}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION_MS / 1000, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

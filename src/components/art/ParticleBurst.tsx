'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const PARTICLES = 20;
const DURATION_MS = 600;

/** 20 small ecto dots fly out radially each time `trigger` changes (0 = idle). */
export function ParticleBurst({ trigger }: { trigger: number }): JSX.Element | null {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (trigger === 0 || reduced) return;
    setActive(trigger);
    const t = setTimeout(() => setActive(0), DURATION_MS + PARTICLES * 20);
    return () => clearTimeout(t);
  }, [trigger, reduced]);

  if (active === 0) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2;
        return (
          <motion.span
            key={`${active}-${i}`}
            className="absolute block h-1 w-1 rounded-full bg-ecto"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 70, y: Math.sin(angle) * 70 - 10, opacity: 0 }}
            transition={{ duration: DURATION_MS / 1000, delay: i * 0.02, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}
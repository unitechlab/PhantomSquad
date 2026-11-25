'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }): JSX.Element {
  const reduced = useReducedMotion();
  return (
    <motion.div
      // A small, fast fade: enough to feel like a transition, not enough to read as a blank page.
      initial={reduced ? false : { opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.12, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
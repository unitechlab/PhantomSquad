'use client';

import { forwardRef } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

/** The spring most buttons use: snaps back fast, overshoots a little, settles without wobbling long. */
const TAP_SPRING = { type: 'spring' as const, stiffness: 700, damping: 22, mass: 0.6 };

/**
 * A drop-in replacement for `<button>` with a press reaction: it compresses a little on press and
 * springs back past 1 on release, instead of just changing colour. Purely a feel layer — props,
 * className and children behave exactly like a native button. Off for `prefers-reduced-motion`.
 */
type ImpactButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & { children?: React.ReactNode };

export const ImpactButton = forwardRef<HTMLButtonElement, ImpactButtonProps>(function ImpactButton(
  { children, disabled, ...props },
  ref,
) {
  const reduced = useReducedMotion();
  if (reduced || disabled) {
    // Framer's `motion.button` still forwards unknown DOM props fine, but skip the animation props
    // entirely so there is truly zero motion, not just a 0ms transition. A disabled control should
    // not compress or lift either, the same way it does not change colour on hover.
    const { whileTap, whileHover, transition, ...rest } = props;
    return (
      <button ref={ref} disabled={disabled} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.015 }}
      transition={TAP_SPRING}
      {...props}
    >
      {children}
    </motion.button>
  );
});

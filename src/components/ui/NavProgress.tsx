'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';

/**
 * A slim top bar that gives feedback during a page switch, filling the gap between a click and
 * the new page painting. It starts when an in-app link to another path is clicked and finishes
 * when the pathname changes.
 */
export function NavProgress(): JSX.Element | null {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const doneTimer = useRef<ReturnType<typeof setTimeout>>();

  // Start on a click that targets a different in-app path.
  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/') || href === pathname || link.target === '_blank') return;
      setState('loading');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  // Finish once the new pathname is in.
  useEffect(() => {
    setState((s) => (s === 'loading' ? 'done' : s));
    doneTimer.current = setTimeout(() => setState('idle'), 260);
    return () => clearTimeout(doneTimer.current);
  }, [pathname]);

  if (reduced || state === 'idle') return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[4000] h-0.5 bg-transparent" aria-hidden="true">
      <div
        className="h-full bg-ecto shadow-ecto transition-[width,opacity] ease-out"
        style={{
          width: state === 'done' ? '100%' : '85%',
          opacity: state === 'done' ? 0 : 1,
          transitionDuration: state === 'done' ? '200ms' : '700ms',
        }}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { useL10n } from '@/hooks/useL10n';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps): JSX.Element {
  const { t } = useL10n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-void/80 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg border border-specter/30 bg-crypt p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-bone">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-md border border-shadow px-3 py-1 text-ash hover:text-bone"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
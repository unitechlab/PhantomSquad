'use client';
import { useL10n } from '@/hooks/useL10n';

/** Shown only below the tablet breakpoint. */
export function DesktopNotice(): JSX.Element {
  const { t } = useL10n();
  return (
    <div className="hidden border-b border-crimson bg-shadow px-4 py-2 text-center text-sm text-bone max-md:block">
      {t('layout.desktop')}
    </div>
  );
}

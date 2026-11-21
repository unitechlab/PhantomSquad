'use client';
import { useL10n } from '@/hooks/useL10n';

/** Shown by the App Router while a route segment loads. Keeps the dark frame so the switch does not flash. */
export default function Loading(): JSX.Element {
  const { t } = useL10n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-shadow border-t-ecto" aria-hidden="true" />
      <p className="text-sm uppercase tracking-[0.2em] text-ash">{t('loading.text')}</p>
    </div>
  );
}

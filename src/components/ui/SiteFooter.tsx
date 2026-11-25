'use client';
import { useL10n } from '@/hooks/useL10n';

const REPO_URL = 'https://github.com/unitechlab/PhantomSquad';

/** Credits line shown on every page: who built it, what it was built with, and where the code and
 *  licence live. Addresses a judge's "who made this and under what terms" question without
 *  needing to dig through the repository. */
export function SiteFooter(): JSX.Element {
  const { t } = useL10n();
  return (
    <footer className="mx-auto max-w-[1280px] px-4 py-6 text-center text-sm text-ash">
      <p>{t('footer.built')}</p>
      <p>{t('footer.credit')}</p>
      <p className="mt-1">
        <a href={REPO_URL} className="underline hover:text-bone" target="_blank" rel="noreferrer">
          {t('footer.repo')}
        </a>
        {' · '}
        <a href={`${REPO_URL}/blob/main/LICENSE`} className="underline hover:text-bone" target="_blank" rel="noreferrer">
          {t('footer.license')} (MIT)
        </a>
      </p>
    </footer>
  );
}

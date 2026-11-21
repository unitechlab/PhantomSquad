'use client';
import Image from 'next/image';
import Link from 'next/link';
import { AssetImage } from '@/components/art/AssetImage';
import type { TextKey } from '@/data/i18n';
import { useL10n } from '@/hooks/useL10n';
import { asset } from '@/lib/assets';

const LINKS: { href: string; nav: TextKey; text: TextKey; icon: string }[] = [
  { href: '/about', nav: 'nav.about', text: 'home.card.about', icon: 'skills/skill-8.webp' },
  { href: '/grimoire', nav: 'nav.grimoire', text: 'home.card.grimoire', icon: 'skills/skill-3.webp' },
  { href: '/quests', nav: 'nav.quests', text: 'home.card.quests', icon: 'skills/skill-1.webp' },
  { href: '/simulator', nav: 'nav.studio', text: 'home.card.studio', icon: 'skills/skill-4.webp' },
  { href: '/guide', nav: 'nav.guide', text: 'home.card.guide', icon: 'skills/skill-5.webp' },
];

/** Keeps the title picture and the start buttons on one screen: viewport height minus nav bar, buttons and padding. */
const TITLE_MAX_WIDTH = 'max(560px, calc((100vh - 310px) * 16 / 9))';

export default function HomePage(): JSX.Element {
  const { t } = useL10n();
  const title = asset('scenes/title.webp');
  return (
    <div className="space-y-6">
      <section aria-labelledby="home-title" className="space-y-4">
        <h1 id="home-title" className="sr-only">
          {t('home.title')}
        </h1>
        <div
          className="relative mx-auto w-full overflow-hidden rounded-lg border border-specter/30 bg-crypt shadow-specter"
          style={{ aspectRatio: `${title.width} / ${title.height}`, maxWidth: TITLE_MAX_WIDTH }}
        >
          <Image
            src={title.src}
            alt={t('home.alt')}
            fill
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover"
          />
        </div>
        <p className="mx-auto max-w-2xl text-center text-bone">{t('home.tagline')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/simulator"
            className="rounded-md border border-ecto px-8 py-3 text-base font-bold uppercase tracking-[0.08em] text-ecto shadow-ecto hover:bg-ecto hover:text-void"
          >
            {t('home.start')}
          </Link>
          <Link
            href="/guide"
            className="rounded-md border border-specter px-6 py-3 text-base uppercase tracking-[0.08em] text-bone hover:shadow-specter"
          >
            {t('home.guide')}
          </Link>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="flex gap-3 rounded-lg border border-shadow bg-crypt p-4 hover:border-specter">
            <AssetImage assetKey={l.icon} width={48} alt="" />
            <span>
              <span className="block text-lg uppercase tracking-[0.08em]">{t(l.nav)}</span>
              <span className="block text-sm text-ash">{t(l.text)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

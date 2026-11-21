'use client';
import Image from 'next/image';
import Link from 'next/link';
import { CharacterCard } from '@/components/about/CharacterCard';
import { ABOUT } from '@/data/about';
import { useL10n } from '@/hooks/useL10n';
import { asset } from '@/lib/assets';
import { useNecroCrew } from '@/store/useNecroCrew';

const HERO_MAX_WIDTH = 720;

export default function AboutPage(): JSX.Element {
  const { lang, t } = useL10n();
  const members = useNecroCrew((s) => s.members);
  const about = ABOUT[lang];
  const studio = asset('scenes/company-house.webp');
  return (
    <div className="mx-auto max-w-5xl space-y-8" lang={lang}>
      <section aria-labelledby="about-title" className="space-y-4">
        <h1 id="about-title" className="text-2xl">
          {about.heading}
        </h1>
        <p className="text-bone">{about.lead}</p>
        <div
          className="relative mx-auto w-full overflow-hidden rounded-lg border border-specter/30 bg-crypt"
          style={{ aspectRatio: `${studio.width} / ${studio.height}`, maxWidth: HERO_MAX_WIDTH }}
        >
          <Image src={studio.src} alt="" fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" aria-hidden="true" />
        </div>
        {about.sections.map((s) => (
          <div key={s.title} className="space-y-2 rounded-lg border border-shadow bg-crypt p-4">
            <h2 className="text-lg">{s.title}</h2>
            {s.body?.map((p) => (
              <p key={p} className="text-bone">
                {p}
              </p>
            ))}
            {s.items && (
              <ul className="list-disc space-y-1 pl-5 text-bone">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/simulator"
            className="rounded-md border border-ecto px-6 py-2 text-sm font-bold uppercase tracking-[0.08em] text-ecto shadow-ecto hover:bg-ecto hover:text-void"
          >
            {t('about.start')}
          </Link>
          <Link
            href="/guide"
            className="rounded-md border border-specter px-6 py-2 text-sm uppercase tracking-[0.08em] text-bone hover:shadow-specter"
          >
            {t('about.guide')}
          </Link>
        </div>
      </section>

      <section aria-labelledby="roster-title" className="space-y-4">
        <h2 id="roster-title" className="text-xl">
          {about.rosterHeading}
        </h2>
        <p className="text-bone">{about.rosterLead}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {members.map((m) => (
            <CharacterCard key={m.id} member={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

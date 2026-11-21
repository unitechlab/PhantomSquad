'use client';
import Link from 'next/link';
import { GUIDE } from '@/data/guide';
import { useL10n } from '@/hooks/useL10n';

export default function GuidePage(): JSX.Element {
  const { lang, t } = useL10n();
  const guide = GUIDE[lang];
  return (
    <div className="mx-auto max-w-3xl space-y-6" lang={lang}>
      <h1 className="text-2xl">{guide.heading}</h1>
      <p className="text-bone">{guide.lead}</p>
      {guide.sections.map((s) => (
        <section key={s.title} className="space-y-2 rounded-lg border border-shadow bg-crypt p-4">
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
          {s.table && (
            <dl className="grid gap-x-4 gap-y-2 md:grid-cols-[14rem_1fr]">
              {s.table.map(([term, meaning]) => (
                <div key={term} className="contents">
                  <dt className="font-bold text-specter-text">{term}</dt>
                  <dd className="text-bone">{meaning}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
      <Link
        href="/quests"
        className="inline-block rounded-md border border-ecto px-4 py-2 text-sm uppercase tracking-[0.08em] text-ecto hover:bg-ecto hover:text-void"
      >
        {t('guide.start')}
      </Link>
    </div>
  );
}

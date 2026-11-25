import type { Metadata } from 'next';
import './globals.css';
import { DesktopNotice } from '@/components/ui/DesktopNotice';
import { GameSync } from '@/components/ui/GameSync';
import { LangSync } from '@/components/ui/LangSync';
import { NavigationBar } from '@/components/ui/NavigationBar';
import { NavProgress } from '@/components/ui/NavProgress';
import { SiteFooter } from '@/components/ui/SiteFooter';

export const metadata: Metadata = {
  title: 'NecroCrew — Phantom Squad Simulator',
  description: 'Summon the optimal creative squad and banish your project backlog before the full moon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void text-bone">
        <LangSync />
        <GameSync />
        <DesktopNotice />
        <NavProgress />
        <NavigationBar />
        <main className="mx-auto max-w-[1280px] px-4 py-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

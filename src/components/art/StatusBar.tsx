interface StatusBarProps {
  kind: 'hp' | 'shield' | 'energy';
  value: number;
  max: number;
  label: string;
  /** Text shown next to the bar, e.g. "42 / 180 person-days". */
  caption: string;
}

function fillClass(kind: StatusBarProps['kind'], ratio: number): string {
  if (kind === 'hp') return ratio > 0.5 ? 'bg-ecto' : ratio > 0.25 ? 'bg-specter' : 'bg-crimson';
  if (kind === 'energy') return 'bg-specter';
  return 'bg-ash';
}

const ICON: Record<StatusBarProps['kind'], string> = { hp: '♥', shield: '🛡', energy: '⚡' };

export function StatusBar({ kind, value, max, label, caption }: StatusBarProps): JSX.Element {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span aria-hidden="true" className="w-5 text-center text-ash">
        {ICON[kind]}
      </span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        className="h-3 flex-1 overflow-hidden rounded-sm bg-shadow"
        style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}
      >
        <div
          className={`h-full transition-[width] duration-300 ease-out ${fillClass(kind, ratio)}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="min-w-28 text-right font-mono text-bone">{caption}</span>
    </div>
  );
}
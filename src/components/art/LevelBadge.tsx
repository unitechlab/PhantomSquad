export function LevelBadge({ level }: { level: number }): JSX.Element {
  return (
    <div
      role="img"
      aria-label={`Level ${level}`}
      className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-specter bg-crypt leading-none"
    >
      <span className="text-sm text-ash">Lv.</span>
      <span className="font-mono text-base font-bold text-bone">{level}</span>
    </div>
  );
}
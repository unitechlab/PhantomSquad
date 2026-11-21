'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { SkillEntry } from '@/types';
import { SKILL_CATEGORIES } from '@/types';
import { useL10n } from '@/hooks/useL10n';

const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 110;
const MAX_LEVEL = 5;

function point(index: number, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / SKILL_CATEGORIES.length;
  return [CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius];
}

function toPoints(radii: number[]): string {
  return radii.map((r, i) => point(i, r).join(',')).join(' ');
}

interface RadarChartProps {
  skills: SkillEntry[];
  color?: string;
  /** Axis shown in bold (the member's main skill). */
  boldSkill?: string;
}

export function RadarChart({ skills, color = 'var(--color-specter)', boldSkill }: RadarChartProps): JSX.Element {
  const reduced = useReducedMotion();
  const { t, skill } = useL10n();
  const levels = SKILL_CATEGORIES.map((c) => skills.find((s) => s.skillName === c)?.level ?? 0);
  const description = SKILL_CATEGORIES.map((c, i) => `${skill(c)} ${levels[i]}`).join(', ');

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={t('grimoire.radar', { description })}
      className="h-auto w-full max-w-[340px]"
    >
      {Array.from({ length: MAX_LEVEL }, (_, k) => (
        <polygon
          key={k}
          points={toPoints(SKILL_CATEGORIES.map(() => (RADIUS * (k + 1)) / MAX_LEVEL))}
          fill="none"
          stroke="var(--color-ash)"
          strokeOpacity={0.2}
        />
      ))}
      {SKILL_CATEGORIES.map((c, i) => {
        const [x, y] = point(i, RADIUS);
        const [lx, ly] = point(i, RADIUS + 22);
        return (
          <g key={c}>
            <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--color-ash)" strokeOpacity={0.2} />
            <text
              x={lx}
              y={ly}
              fontSize={12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-ash)"
              fontWeight={c === boldSkill ? 700 : 400}
            >
              {skill(c)}
            </text>
          </g>
        );
      })}
      <motion.polygon
        points={toPoints(levels.map((l) => (RADIUS * l) / MAX_LEVEL))}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
        initial={reduced ? false : { strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: reduced ? 0 : 0.8, ease: 'easeOut' }}
        style={{ filter: 'drop-shadow(0 0 6px var(--color-specter))' }}
      />
    </svg>
  );
}
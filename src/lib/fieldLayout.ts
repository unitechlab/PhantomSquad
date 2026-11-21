import type { SkillCategory } from '@/types';
import type { Activity } from '@/lib/gameEngine';

/** Studio floor plan. Coordinates are percentages of the field (0-100). Pure, so it can be tested. */
export type StationId = SkillCategory | 'dojo' | 'lounge';

export interface Point {
  x: number;
  y: number;
}

const COLUMN_X = [17, 50, 83] as const;
/** Row centres follow the three floors of the company-house picture. */
const ROW_Y = [15, 46, 77] as const;

/** Centre of each station's room. */
export const STATIONS: Record<StationId, Point> = {
  AR: { x: COLUMN_X[0], y: ROW_Y[0] },
  VR: { x: COLUMN_X[1], y: ROW_Y[0] },
  '3D Modeling': { x: COLUMN_X[2], y: ROW_Y[0] },
  dojo: { x: COLUMN_X[0], y: ROW_Y[1] },
  lounge: { x: COLUMN_X[1], y: ROW_Y[1] },
  Director: { x: COLUMN_X[2], y: ROW_Y[1] },
  '2D UX Design': { x: COLUMN_X[0], y: ROW_Y[2] },
  'Video Editing': { x: COLUMN_X[1], y: ROW_Y[2] },
};

export const STATION_LABELS: Record<StationId, string> = {
  AR: 'AR Lab',
  VR: 'VR Room',
  '3D Modeling': '3D Studio',
  dojo: 'Training Dojo',
  lounge: 'Summon Circle',
  Director: 'Director Office',
  '2D UX Design': 'UX Desk',
  'Video Editing': 'Video Booth',
};

/** Offset from the room centre to the feet of the people (the bottom of the room, below the work list). */
const STAND_OFFSET_Y = 6;
const SLOT_SPACING_X = 7;
/** Extra rows stand slightly higher, so they read as further back. */
const SLOT_SPACING_Y = -5;
const SLOTS_PER_ROW = 3;

export function stationFor(activity: Activity): StationId {
  if (activity.kind === 'training') return 'dojo';
  if (activity.kind === 'working' && activity.skill) return activity.skill;
  return 'lounge';
}

/** Spreads the members of one station into rows of up to three, centred on the room. */
export function layoutMembers(entries: { memberId: string; station: StationId }[]): Record<string, Point> {
  const byStation = new Map<StationId, string[]>();
  for (const e of entries) byStation.set(e.station, [...(byStation.get(e.station) ?? []), e.memberId]);

  const result: Record<string, Point> = {};
  for (const [station, ids] of byStation) {
    const centre = STATIONS[station];
    ids.forEach((id, i) => {
      const inRow = Math.min(SLOTS_PER_ROW, ids.length - Math.floor(i / SLOTS_PER_ROW) * SLOTS_PER_ROW);
      const col = i % SLOTS_PER_ROW;
      const row = Math.floor(i / SLOTS_PER_ROW);
      result[id] = {
        x: centre.x + (col - (inRow - 1) / 2) * SLOT_SPACING_X,
        y: centre.y + STAND_OFFSET_Y + row * SLOT_SPACING_Y,
      };
    });
  }
  return result;
}

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
/** Spacing between people when there are few of them (room for a name badge and a speech bubble each). */
const SLOT_SPACING_X_WIDE = 7;
/** Spacing once a room holds enough people that SLOT_SPACING_X_WIDE would run past the room's edge. */
const SLOT_SPACING_X_NARROW = 4.2;
/** Above this count, people stand in one tighter row instead of a second one: the room is not tall
 *  enough for two rows of sprite-height-plus-name-badge without the back row leaving the room picture
 *  or covering the room's name badge (see fieldLayout.unit.test.ts). */
const SINGLE_ROW_LIMIT = 6;

export function stationFor(activity: Activity): StationId {
  if (activity.kind === 'training') return 'dojo';
  if (activity.kind === 'working' && activity.skill) return activity.skill;
  return 'lounge';
}

/** Spreads the members of one station into a single row, centred on the room and on the floor.
 *  Few people stand comfortably apart; more people stand closer together rather than stacking a
 *  second row, which this room size cannot fit without overlapping the name badge above it. */
export function layoutMembers(entries: { memberId: string; station: StationId }[]): Record<string, Point> {
  const byStation = new Map<StationId, string[]>();
  for (const e of entries) byStation.set(e.station, [...(byStation.get(e.station) ?? []), e.memberId]);

  const result: Record<string, Point> = {};
  for (const [station, ids] of byStation) {
    const centre = STATIONS[station];
    const spacing = ids.length > SINGLE_ROW_LIMIT ? SLOT_SPACING_X_NARROW : SLOT_SPACING_X_WIDE;
    ids.forEach((id, i) => {
      result[id] = {
        x: centre.x + (i - (ids.length - 1) / 2) * spacing,
        y: centre.y + STAND_OFFSET_Y,
      };
    });
  }
  return result;
}

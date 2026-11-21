import { describe, expect, it } from 'vitest';
import { STATIONS, layoutMembers, stationFor, type StationId } from '@/lib/fieldLayout';
import { SKILL_CATEGORIES } from '@/types';

describe('stationFor', () => {
  it('sends workers to their skill room, trainees to the dojo and the rest to the lounge', () => {
    expect(stationFor({ kind: 'working', skill: 'VR' })).toBe('VR');
    expect(stationFor({ kind: 'training', skill: 'AR' })).toBe('dojo');
    expect(stationFor({ kind: 'idle' })).toBe('lounge');
  });
  it('has a room for every skill', () => {
    for (const s of SKILL_CATEGORIES) expect(STATIONS[s]).toBeDefined();
  });
});

describe('layoutMembers', () => {
  const station: StationId = 'AR';
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('gives every member its own spot inside the field', () => {
    const pos = layoutMembers(ids.map((memberId) => ({ memberId, station })));
    const spots = new Set(Object.values(pos).map((p) => `${p.x},${p.y}`));
    expect(spots.size).toBe(ids.length);
    for (const p of Object.values(pos)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it('puts a single member at the room centre column', () => {
    const pos = layoutMembers([{ memberId: 'a', station: 'VR' }]);
    expect(pos.a.x).toBe(STATIONS.VR.x);
    expect(pos.a.y).toBeGreaterThan(STATIONS.VR.y);
  });

  it('keeps members of different rooms apart', () => {
    const pos = layoutMembers([
      { memberId: 'a', station: 'AR' },
      { memberId: 'b', station: 'VR' },
    ]);
    expect(pos.a.x).not.toBe(pos.b.x);
  });
});
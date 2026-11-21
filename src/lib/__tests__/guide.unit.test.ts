import { describe, expect, it } from 'vitest';
import { GUIDE } from '@/data/guide';
import { GAME_DAYS, GOAL_FUNDS, START_FUNDS, TRAIN_COSTS, TRAIN_DAYS } from '@/lib/gameConfig';
import { BALANCED_TARGET_RATE, MAX_RATE, MIN_RATE } from '@/lib/assignmentEngine';
import { formatGold } from '@/lib/format';

describe('guide content', () => {
  it('has the same structure in English and Japanese', () => {
    expect(GUIDE.ja.sections).toHaveLength(GUIDE.en.sections.length);
    GUIDE.en.sections.forEach((s, i) => {
      const ja = GUIDE.ja.sections[i];
      expect(ja.items?.length).toBe(s.items?.length);
      expect(ja.table?.length).toBe(s.table?.length);
      expect(ja.body?.length).toBe(s.body?.length);
    });
  });

  it.each(['en', 'ja'] as const)('quotes the live game rules in %s', (lang) => {
    const text = JSON.stringify(GUIDE[lang]);
    for (const value of [formatGold(GOAL_FUNDS), formatGold(START_FUNDS), String(GAME_DAYS), `${MIN_RATE}%`, `${MAX_RATE}%`, String(BALANCED_TARGET_RATE), String(TRAIN_DAYS)]) {
      expect(text).toContain(value);
    }
    for (const cost of TRAIN_COSTS) expect(text).toContain(formatGold(cost));
    expect(text).toContain('0 = 0, 1 = 0.4, 2 = 0.6, 3 = 0.8, 4 = 1.0, 5 = 1.2');
  });
});

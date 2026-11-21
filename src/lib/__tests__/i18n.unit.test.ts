import { describe, expect, it } from 'vitest';
import { ABOUT } from '@/data/about';
import { characterText } from '@/data/characters';
import { LANGS, placeholders, textFor, textKeys, translate } from '@/data/i18n';
import { ALL_PROJECTS, SEED_MEMBERS } from '@/data/seed';
import { makeL10n } from '@/hooks/useL10n';
import { shortDate } from '@/lib/format';
import { lineFor } from '@/lib/speech';
import { CHARACTER_IDS, SKILL_CATEGORIES } from '@/types';

describe('translate', () => {
  it('fills placeholders and keeps unknown ones visible', () => {
    expect(translate('en', 'hud.perDay', { amount: '+120 G' })).toBe('+120 G/day');
    expect(translate('en', 'hud.perDay')).toBe('{amount}/day');
  });

  it('picks the singular form when n is 1', () => {
    expect(translate('en', 'board.later', { n: 1 })).toBe('1 more quest will arrive later.');
    expect(translate('en', 'board.later', { n: 3 })).toBe('3 more quests will arrive later.');
  });

  it('has Japanese text with the same placeholders as English for every key', () => {
    for (const key of textKeys()) {
      expect(placeholders(textFor('ja', key)), key).toEqual(placeholders(textFor('en', key)));
      expect(textFor('ja', key).length, key).toBeGreaterThan(0);
    }
  });

  it('supports both languages for every skill, priority, status, mode and room', () => {
    for (const lang of LANGS) {
      const l = makeL10n(lang);
      for (const s of SKILL_CATEGORIES) expect(l.skill(s)).not.toContain('skill.');
      for (const p of ['Critical', 'High', 'Normal'] as const) expect(l.priority(p)).not.toContain('priority.');
      for (const st of ['Pending', 'Simulating', 'Active', 'Banished'] as const) expect(l.status(st)).not.toContain('status.');
      for (const m of ['Balanced', 'Speedrun', 'Minimal Squad'] as const) expect(l.mode(m)).not.toContain('mode.');
      for (const r of [...SKILL_CATEGORIES, 'dojo', 'lounge'] as const) expect(l.station(r)).not.toContain('station.');
    }
  });
});

describe('characters', () => {
  it.each(LANGS)('has a complete profile for every creator in %s', (lang) => {
    for (const id of CHARACTER_IDS) {
      const c = characterText(id, lang);
      for (const value of [c.name, c.title, c.role, c.tagline, c.bestFor, c.quote]) expect(value.length).toBeGreaterThan(0);
      expect(c.bio.length).toBeGreaterThan(0);
    }
  });

  it('matches the English seed data, so lookups by English name work', () => {
    for (const m of SEED_MEMBERS) {
      const en = characterText(m.characterId, 'en');
      expect([en.name, en.title, en.role]).toEqual([m.name, m.title, m.mainRole]);
    }
  });
});

describe('makeL10n', () => {
  it('translates built-in quest titles and keeps custom ones', () => {
    const ja = makeL10n('ja');
    for (const p of ALL_PROJECTS) expect(ja.questTitle(p)).not.toBe(p.title);
    expect(ja.questTitle({ id: 'custom-1', title: 'My quest' })).toBe('My quest');
    expect(makeL10n('en').questTitle(ALL_PROJECTS[0])).toBe(ALL_PROJECTS[0].title);
  });

  it('localises engine error messages and passes unknown ones through', () => {
    const ja = makeL10n('ja');
    expect(ja.error('Not enough funds')).toBe('資金が足りません');
    expect(ja.error('Luna is over capacity')).toBe('ルナの稼働率が上限を超えています');
    expect(ja.error('Rate 5 is outside 10-100')).toContain('10');
    expect(ja.error('Something new')).toBe('Something new');
    expect(makeL10n('en').error('Not enough funds')).toBe('Not enough funds');
  });

  it('wraps rich placeholders around styled nodes', () => {
    const parts = makeL10n('en').rich('forecast.pace', { date: 'D', deadline: 'L' });
    expect(Array.isArray(parts)).toBe(true);
    expect((parts as unknown[]).length).toBeGreaterThan(2);
  });
});

describe('dates and speech', () => {
  it('formats short dates in both languages', () => {
    expect(shortDate('2026-10-31')).toBe('Oct 31');
    expect(shortDate('2026-10-31', 'ja')).toBe('10月31日');
  });

  it('gives every creator a Japanese line for each mood', () => {
    for (const id of CHARACTER_IDS) {
      for (const mood of ['work', 'train', 'idle'] as const) {
        expect(lineFor(id, mood, 'AR', 'ja')).not.toBe(lineFor(id, mood, 'AR', 'en'));
      }
    }
  });
});

describe('about content', () => {
  it('has the same structure in English and Japanese', () => {
    expect(ABOUT.ja.sections).toHaveLength(ABOUT.en.sections.length);
    ABOUT.en.sections.forEach((s, i) => {
      expect(ABOUT.ja.sections[i].items?.length).toBe(s.items?.length);
      expect(ABOUT.ja.sections[i].body?.length).toBe(s.body?.length);
    });
  });
});

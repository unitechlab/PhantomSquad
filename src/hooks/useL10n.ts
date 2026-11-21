'use client';
import { createElement, Fragment, useMemo } from 'react';
import type { CharacterId, Member, Project, ProjectPriority, ProjectStatus, SkillCategory, AssignmentMode } from '@/types';
import { CHARACTER_IDS } from '@/types';
import { characterText, type CharacterText } from '@/data/characters';
import { translate, type Lang, type TextKey, type TextParams } from '@/data/i18n';
import { MAX_RATE, MIN_RATE } from '@/lib/assignmentEngine';
import { shortDate } from '@/lib/format';
import type { StationId } from '@/lib/fieldLayout';
import { useNecroCrew } from '@/store/useNecroCrew';

/** Japanese titles of the built-in quests. Custom quests keep the title the player typed. */
const QUEST_TITLES_JA: Record<string, string> = {
  'haunted-mall-webar': '幽霊モールWebARラリー',
  'cyber-ghost-vr': 'サイバーゴーストVR展',
  'specter-promo-video': 'スペクタープロモ動画',
  'phantom-museum-ar': '幻影ミュージアムARガイド',
  'moonlit-concert': '月夜のメタバースコンサート',
  'grave-shift-launch': '墓場シフトアプリ ローンチ',
};

export interface L10n {
  lang: Lang;
  t: (key: TextKey, params?: TextParams) => string;
  /** Like t, but placeholders can be React nodes (for styled numbers inside a sentence). */
  rich: (key: TextKey, nodes: Record<string, React.ReactNode>) => React.ReactNode;
  skill: (skill: SkillCategory) => string;
  priority: (priority: ProjectPriority) => string;
  status: (status: ProjectStatus) => string;
  mode: (mode: AssignmentMode) => string;
  station: (station: StationId) => string;
  date: (isoDate: string) => string;
  questTitle: (project: Pick<Project, 'id' | 'title'>) => string;
  character: (id: CharacterId) => CharacterText;
  memberName: (member: Pick<Member, 'characterId' | 'name'>) => string;
  memberTitle: (member: Pick<Member, 'characterId' | 'title'>) => string;
  memberRole: (member: Pick<Member, 'characterId' | 'mainRole'>) => string;
  /** Turns an engine message (always English) into the current language. Unknown messages pass through. */
  error: (message: string) => string;
}

export function makeL10n(lang: Lang): L10n {
  const t = (key: TextKey, params?: TextParams): string => translate(lang, key, params);

  const rich: L10n['rich'] = (key, nodes) => {
    const parts = translate(lang, key).split(/(\{\w+\})/);
    return parts.map((part, i) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1];
      return createElement(Fragment, { key: i }, name && name in nodes ? nodes[name] : part);
    });
  };

  const nameToId = (name: string): CharacterId | undefined => CHARACTER_IDS.find((id) => characterText(id, 'en').name === name);

  const error: L10n['error'] = (message) => {
    if (message === 'Unknown quest') return t('err.unknownQuest');
    if (message === 'This quest is closed') return t('err.closed');
    if (message === 'Unexpected error') return t('err.unexpected');
    if (message === 'Unknown member') return t('err.unknownMember');
    if (message === 'The game is over') return t('err.gameOver');
    if (message === 'Already at max level') return t('err.maxLevel');
    if (message === 'Not enough funds') return t('err.funds');
    if (message.startsWith('No eligible member')) return t('err.noEligible');
    const rate = /^Rate (\d+) is outside/.exec(message);
    if (rate) return t('err.rate', { rate: rate[1], min: MIN_RATE, max: MAX_RATE });
    const named = /^(.+) (is over capacity|is already training)$/.exec(message);
    if (named) {
      const id = nameToId(named[1]);
      const name = id ? characterText(id, lang).name : named[1];
      return t(named[2] === 'is over capacity' ? 'err.capacity' : 'err.alreadyTraining', { name });
    }
    return message;
  };

  return {
    lang,
    t,
    rich,
    skill: (skill) => t(`skill.${skill}`),
    priority: (priority) => t(`priority.${priority}`),
    status: (status) => t(`status.${status}`),
    mode: (mode) => t(`mode.${mode}`),
    station: (station) => t(`station.${station}`),
    date: (isoDate) => shortDate(isoDate, lang),
    questTitle: (project) => (lang === 'ja' ? (QUEST_TITLES_JA[project.id] ?? project.title) : project.title),
    character: (id) => characterText(id, lang),
    memberName: (member) => characterText(member.characterId, lang).name || member.name,
    memberTitle: (member) => characterText(member.characterId, lang).title || member.title,
    memberRole: (member) => characterText(member.characterId, lang).role || member.mainRole,
    error,
  };
}

/** Text helpers for the language the player picked. */
export function useL10n(): L10n {
  const lang = useNecroCrew((s) => s.lang);
  return useMemo(() => makeL10n(lang), [lang]);
}

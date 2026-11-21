import type { CharacterId, SkillCategory } from '@/types';
import { SKILL_CATEGORIES } from '@/types';

export type Mood = 'work' | 'train' | 'idle';
type SpeechLang = 'en' | 'ja';

interface Lines {
  work: [string, string];
  train: string;
  idle: string;
}

/** What each creator says when their job changes. Short, in character, readable at 14 px. */
const LINES: Record<SpeechLang, Record<CharacterId, Lines>> = {
  en: {
    luna: { work: ['Overlaying the haunt!', 'AR lock-on!'], train: 'Time to level up!', idle: 'Any quest for me?' },
    seven: { work: ['Diving in!', 'Frame rate is perfect.'], train: 'Warming up.', idle: '...waiting.' },
    verna: { work: ['Sculpting away.', 'Polygons obey me.'], train: 'Practice makes pixels.', idle: 'My desk is lonely.' },
    serefi: { work: ['I shall decide.', 'Keep the schedule.'], train: 'A leader must grow.', idle: 'Zzz...' },
    crow: { work: ['Rolling. Action.', 'Cut. Print it.'], train: 'Sharpening my eye.', idle: 'No footage today.' },
    mint: { work: ['Let me sketch that!', 'Pixel perfect!'], train: 'New tricks!', idle: 'Draw something?' },
    rave: { work: ['Rendering the spell!', 'More power!'], train: 'Burn brighter!', idle: 'I am bored.' },
    azria: { work: ['Making it cute!', 'Pink pass done!'], train: 'Study time!', idle: 'Tea break?' },
  },
  ja: {
    luna: { work: ['幽霊を重ねるよ!', 'ARロックオン!'], train: 'レベルアップの時間!', idle: '私の出番は?' },
    seven: { work: ['ダイブする!', 'フレームレートは完璧だ。'], train: 'ウォームアップ。', idle: '……待機中。' },
    verna: { work: ['彫り進めるわ。', 'ポリゴンは私に従うの。'], train: '練習あるのみ。', idle: '机がさみしい。' },
    serefi: { work: ['私が決めよう。', '予定は守れ。'], train: '導く者も成長する。', idle: 'ぐう……。' },
    crow: { work: ['回すぞ。アクション。', 'カット。それでいこう。'], train: '目を研ぐよ。', idle: '今日は素材がない。' },
    mint: { work: ['スケッチするね!', 'ピクセルぴったり!'], train: '新しい技!', idle: '何か描く?' },
    rave: { work: ['呪文をレンダリング!', 'もっと力を!'], train: 'もっと燃えろ!', idle: '退屈だな。' },
    azria: { work: ['かわいくするね!', 'ピンクの仕上げ完了!'], train: 'お勉強の時間!', idle: 'お茶にしない?' },
  },
};

export function lineFor(id: CharacterId, mood: Mood, skill?: SkillCategory, lang: SpeechLang = 'en'): string {
  const l = LINES[lang][id];
  if (mood === 'train') return l.train;
  if (mood === 'idle') return l.idle;
  const index = skill ? SKILL_CATEGORIES.indexOf(skill) % 2 : 0;
  return l.work[index];
}

import type { Lang } from '@/data/i18n';
import {
  COMBO_WINDOW_DAYS,
  GAME_DAYS,
  GOAL_FUNDS,
  MOON_DAYS,
  START_FUNDS,
  TRAIN_DAYS,
} from '@/lib/gameConfig';
import { formatGold } from '@/lib/format';

export interface AboutSection {
  title: string;
  body?: string[];
  items?: string[];
}

export interface AboutContent {
  heading: string;
  lead: string;
  sections: AboutSection[];
  rosterHeading: string;
  rosterLead: string;
}

/** Game introduction. Numbers come from gameConfig so the text cannot drift from the rules. */
export const ABOUT: Record<Lang, AboutContent> = {
  en: {
    heading: 'About NecroCrew',
    lead: `The full moon is ${GAME_DAYS} days away and the studio is buried in cursed quests. You run NecroCrew, a creative studio staffed by eight phantom creators who are very good at their jobs and very much dead.`,
    sections: [
      {
        title: 'The game in one minute',
        body: [
          `NecroCrew: Phantom Squad is a short studio-management game. You have ${GAME_DAYS} days to grow the studio's funds from ${formatGold(START_FUNDS)} to ${formatGold(GOAL_FUNDS)}.`,
          'Quests arrive over time. You pick the right creators for each one, then watch them walk to the right rooms and work. Finished quests pay out. Salaries and late penalties drain the funds.',
        ],
      },
      {
        title: 'What you do',
        items: [
          'Assign: summon a squad for each quest in one click, then fine-tune who works on what and how much of their day.',
          `Earn: finish a quest before its deadline for a bonus, and chain quests within ${COMBO_WINDOW_DAYS} days of each other for a combo.`,
          `Grow: pay for training to raise a skill by one level. It takes ${TRAIN_DAYS} days away from work, so time it well.`,
          `React: random incidents hit the studio, such as a ${MOON_DAYS}-day Full Moon that speeds everyone up, a ghost glitch that adds work, or a sponsor with a gift.`,
        ],
      },
      {
        title: 'How to win',
        items: [
          `Reach ${formatGold(GOAL_FUNDS)} within ${GAME_DAYS} days.`,
          'You lose if funds drop below zero, if every quest is done and the goal is still out of reach, or if the days run out.',
          'Your result gets a rank from S to C, and the creator who did the most work is named MVP.',
        ],
      },
    ],
    rosterHeading: 'Meet the phantom creators',
    rosterLead: 'Eight creators, each with a signature skill, a salary and a habit. Knowing who is best at what is most of the game.',
  },
  ja: {
    heading: 'NecroCrewについて',
    lead: `満月まであと${GAME_DAYS}日。スタジオは呪われたクエストの山に埋もれています。あなたは、腕は確かだけれど、すでに亡くなっている8人の幻影クリエイターを率いる、クリエイティブスタジオ「NecroCrew」の主です。`,
    sections: [
      {
        title: '1分でわかるゲーム内容',
        body: [
          `「NecroCrew: Phantom Squad」は、短時間で遊べるスタジオ経営ゲームです。${GAME_DAYS}日間で、スタジオの資金を${formatGold(START_FUNDS)}から${formatGold(GOAL_FUNDS)}まで増やすのが目標です。`,
          'クエスト(案件)は時間とともに届きます。それぞれに合うクリエイターを選ぶと、クリエイターが適した部屋へ歩いていき、作業を始めます。終えたクエストは報酬になり、給料と遅延の違約金は資金を減らします。',
        ],
      },
      {
        title: '遊びの流れ',
        items: [
          '編成: ワンクリックでクエストごとにチームを召喚し、誰がどの作業をどれだけ担当するかを細かく調整します。',
          `稼ぐ: 納期より早く終えるとボーナス。${COMBO_WINDOW_DAYS}日以内に次のクエストを終えるとコンボになります。`,
          `育てる: 資金を払って、スキルを1レベル上げる訓練ができます。${TRAIN_DAYS}日間は作業できないので、タイミングが大事です。`,
          `対応する: ランダムな事件が起きます。全員の作業が速くなる${MOON_DAYS}日間の満月、作業が増えるゴーストの不具合、贈り物をくれるスポンサーなどです。`,
        ],
      },
      {
        title: '勝利の条件',
        items: [
          `${GAME_DAYS}日以内に、資金を${formatGold(GOAL_FUNDS)}にします。`,
          '資金がマイナスになったとき、全クエストを終えても目標に届かないとき、日数が尽きたときは敗北です。',
          '結果にはSからCのランクが付き、いちばん作業したクリエイターはMVPに選ばれます。',
        ],
      },
    ],
    rosterHeading: '幻影クリエイターたち',
    rosterLead: '8人はそれぞれ、得意なスキルと、日給と、くせを持っています。誰が何に強いかを知ることが、このゲームの大半です。',
  },
};

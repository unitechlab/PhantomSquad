import { BALANCED_TARGET_RATE, MAX_RATE, MIN_RATE, skillLevelCoefficient } from '@/lib/assignmentEngine';
import {
  COMBO_BONUS_RATE,
  COMBO_MAX_STEPS,
  COMBO_WINDOW_DAYS,
  EARLY_BONUS_MAX_DAYS,
  GLITCH_WORKLOAD,
  INCIDENT_FIRST_DAY,
  MILESTONES,
  MOON_BOOST,
  MOON_DAYS,
  RANK_A_MAX_DAY,
  RANK_S_MAX_DAY,
  SPONSOR_AMOUNT,
  EARLY_BONUS_RATE,
  GAME_DAYS,
  GOAL_FUNDS,
  LATE_PENALTY_CAP,
  LATE_PENALTY_RATE,
  PRIORITY_MULTIPLIER,
  REWARD_PER_PERSON_DAY,
  START_FUNDS,
  TRAIN_COSTS,
  TRAIN_DAYS,
} from '@/lib/gameConfig';
import { formatGold } from '@/lib/format';

import type { Lang } from '@/data/i18n';
export type { Lang };

export interface GuideSection {
  title: string;
  /** Plain paragraphs. */
  body?: string[];
  /** Bulleted list. */
  items?: string[];
  /** Two-column table: [term, meaning]. */
  table?: [string, string][];
}

export interface GuideContent {
  heading: string;
  lead: string;
  sections: GuideSection[];
}

const pct = (v: number): string => `${Math.round(v * 100)}%`;
const coefficients = [0, 1, 2, 3, 4, 5].map((l) => (l === 0 ? '0' : skillLevelCoefficient(l).toFixed(1)));
const coefficientList = coefficients.map((c, l) => `${l} = ${c}`).join(', ');
const costList = TRAIN_COSTS.map((c, l) => `${l}→${l + 1}: ${formatGold(c)}`).join(', ');

export const GUIDE: Record<Lang, GuideContent> = {
  en: {
    heading: 'How to Play',
    lead: `You run a creative studio for ${GAME_DAYS} days. Take quests, send the right creators to work on them, earn rewards, and grow your funds from ${formatGold(START_FUNDS)} to ${formatGold(GOAL_FUNDS)}.`,
    sections: [
      {
        title: 'Goal',
        items: [
          `Win: reach ${formatGold(GOAL_FUNDS)} in funds within ${GAME_DAYS} days.`,
          'Lose: funds drop below zero (bankrupt), every quest is cleared but the goal is still out of reach, or the days run out.',
          'Money comes in when a quest is finished. Money goes out every day as salaries, as penalties for late quests, and as training fees.',
        ],
      },
      {
        title: 'Quick start (1 minute)',
        items: [
          '1. Open Studio. The three starting quests are already open.',
          '2. Pick a quest on the Quest Board, then press "Summon Optimal Squad" in the Assignment panel. Do this for each quest.',
          '3. Press Play. Days pass on their own: creators walk to the room of their skill and work. Watch the Funds counter at the top.',
          '4. When a quest is finished, its reward arrives and its squad is free for the next quest. New quests appear on the Quest Board as days pass.',
          '5. Play stops when a quest is banished. Use Pause to think, and +1 day to move one day at a time.',
        ],
      },
      {
        title: 'The screens',
        table: [
          ['Studio', 'The main screen. A floor plan where creators walk and work, plus the Quest Board, assignments, training, forecast and ledger.'],
          ['Grimoire', 'Each creator\'s skills (0 to 5) as a heat map and a radar chart. Open a creator to train a skill.'],
          ['Quests', 'The list of quests and a form for your own. The "Summon ..." buttons staff a quest in one click and open the Studio.'],
        ],
      },
      {
        title: 'The studio floor',
        table: [
          ['Skill rooms', 'AR Lab, VR Room, 3D Studio, UX Desk, Video Booth and Director Office. Each shows the open work for its skill. The bar is what is left.'],
          ['Summon Circle', 'Where creators wait when they have no work.'],
          ['Training Dojo', 'Creators who are training stand here (📚).'],
          ['Incoming Quests', 'The next quests that will arrive, with their reward.'],
          ['Walking and tapping', 'A creator walks to the room of the skill they are working on. A creator who bobs is walking. A creator who sways is working.'],
        ],
      },
      {
        title: 'What a quest needs',
        body: [
          'A quest is made of skill streams. Each stream has a skill, a minimum level, an amount of work in person-days, and a headcount.',
          'Only the creators assigned to a stream work on it. The quest is finished when every stream is finished. The slowest stream decides the finish day.',
          'Example: "AR, level 3 or higher, 24 person-days, 2 people". Only creators at level 3 or higher in AR can fill it.',
        ],
      },
      {
        title: 'How much work gets done each day',
        items: [
          'A creator\'s daily output on a stream = Allocation % x Efficiency x Skill coefficient.',
          `Skill coefficient by level: ${coefficientList}.`,
          'If a creator covers several streams of one quest, their allocation is split evenly between them.',
          `Allocation per creator on one quest is ${MIN_RATE}% to ${MAX_RATE}%. A creator's total across all quests cannot go above ${MAX_RATE}%.`,
          'A creator whose streams on a quest are all finished is released at the end of that day, and can join another quest.',
          'When a quest is finished, all its creators become free at once.',
        ],
      },
      {
        title: 'Money',
        table: [
          ['Reward', `The base reward is total person-days x ${REWARD_PER_PERSON_DAY} x priority (Critical x${PRIORITY_MULTIPLIER.Critical}, High x${PRIORITY_MULTIPLIER.High}, Normal x${PRIORITY_MULTIPLIER.Normal}). This is the number shown on quest cards and the board. What you actually get paid is this base, plus the early bonus and combo bonus below, minus any late penalty.`],
          ['Early bonus', `${pct(EARLY_BONUS_RATE)} of the reward for each full day finished before the deadline, up to ${EARLY_BONUS_MAX_DAYS} days.`],
          ['Late penalty', `${pct(LATE_PENALTY_RATE)} of the reward for each day the quest is still open after its deadline, up to ${pct(LATE_PENALTY_CAP)} of the reward. The reward is still paid when you finish.`],
          ['Salaries', 'Each creator has a daily salary. You pay salary x allocation for every day they still have open work in their streams. Waiting creators cost nothing.'],
          ['Training fee', `Paid when you start training. ${costList}.`],
        ],
      },
      {
        title: 'Assignment modes',
        table: [
          ['Balanced', `Gives each person about ${BALANCED_TARGET_RATE}% and picks the least busy people first. Cheaper per day and kind to everyone, but slow. Safe only when the deadline is far.`],
          ['Speedrun', 'Picks the highest levels and gives them all their free time. Fast, so rewards arrive early. Costs more per day.'],
          ['Minimal Squad', 'Prefers creators who can cover several streams, so the squad is as small as possible. Fewest salaries, but a person on several streams works slowly on each.'],
        ],
      },
      {
        title: 'Training',
        items: [
          `Spend funds to raise one skill of one creator by 1 level. The fee is charged at once.`,
          `The creator cannot work for ${TRAIN_DAYS} days while training. Their salary is still paid if they have open work.`,
          'Best targets: the only creator on a stream, or a skill that more than one quest needs.',
          'Open the Training panel in the Studio, or open a creator in the Grimoire.',
        ],
      },
      {
        title: 'Combos, surprises and rank',
        items: [
          `Combo: banish a quest within ${COMBO_WINDOW_DAYS} days of the previous one and the chain grows. Each step after the first adds ${pct(COMBO_BONUS_RATE)} of the reward (up to ${COMBO_MAX_STEPS} steps).`,
          `Milestones: reaching ${MILESTONES.map((m) => formatGold(m)).join(' and ')} sets off a celebration. They are marked on the goal bar.`,
          `Surprises: from day ${INCIDENT_FIRST_DAY + 1}, a random event can strike. Full Moon makes everyone ${pct(MOON_BOOST - 1)} faster for ${MOON_DAYS} days. A ghost glitch adds ${GLITCH_WORKLOAD} person-days to one stream. A sponsor gives ${formatGold(SPONSOR_AMOUNT)}.`,
          `Rank: S if you win by day ${RANK_S_MAX_DAY}, A by day ${RANK_A_MAX_DAY}, B after that or when you miss the goal by less than 10%, C otherwise. The creator who did the most work is named MVP.`,
        ],
      },
      {
        title: 'Playback and what-if',
        items: [
          'Play and Pause start and stop the days. Speed 1x to 8x changes how fast days pass.',
          'You can change anything at any time: summon again, move an Allocation slider, press ✕ to remove someone, start training.',
          'The Forecast panel shows the finish date and burndown at today\'s pace for the quest you selected.',
          'Leaving the Studio page pauses the game. Your progress is kept until you reload the page.',
        ],
      },
      {
        title: 'Reading the bars and marks',
        table: [
          ['Funds / Goal bar', 'Your funds and how far you are from the goal.'],
          ['Quest Board bars', 'Progress per skill stream. Full means that stream is done.'],
          ['⚡ Energy bar (creator)', 'The creator\'s total allocation over all quests. Full means fully booked.'],
          ['"No one is working on ..."', 'A stream has nobody assigned, so the quest cannot finish. Summon again or add someone.'],
          ['Forecast: N days late', 'At the current pace the quest ends after its deadline. Add people, raise allocation or train.'],
          ['💀 in the matrix', 'Skill level 0. That creator cannot work with that skill.'],
          ['Lv. badge', 'Sum of a creator\'s six skill levels (max 30).'],
        ],
      },
      {
        title: 'Tips',
        items: [
          'The first reward arrives after about two weeks. Salaries run in the meantime, so do not over-staff at the start.',
          'Try the three modes on the same quest and compare the forecast.',
          'If two quests need the same star creator, staff the more urgent one first.',
          'A quest that starts later is already on the Quest Board. Free a squad in time for it.',
          'Sound is on by default. Use the Sound button to mute it. If you hear nothing, click the page once: browsers allow audio only after a click.',
        ],
      },
    ],
  },
  ja: {
    heading: '遊び方',
    lead: `あなたはクリエイティブスタジオを${GAME_DAYS}日間運営します。案件(クエスト)を受け、適した人を割り当てて報酬を稼ぎ、資金を${formatGold(START_FUNDS)}から${formatGold(GOAL_FUNDS)}まで増やすのが目的です。`,
    sections: [
      {
        title: '目的',
        items: [
          `勝利: ${GAME_DAYS}日以内に、資金を${formatGold(GOAL_FUNDS)}にします。`,
          '敗北: 資金がマイナスになる(破産)か、全案件を終えても目標に届かないこと、または目標に届かないまま日数が尽きることです。',
          'お金が入るのは案件を終えたときです。出ていくお金は、毎日の給料、遅れた案件の違約金、訓練費です。',
        ],
      },
      {
        title: 'まず試す(1分)',
        items: [
          '1. 「スタジオ」を開きます。最初の3件の案件はすでに受注済みです。',
          '2. クエストボードで案件を選び、「編成」パネルの「最適チームを召喚」を押します。これを案件ごとに行います。',
          '3. 「再生」を押します。日が自動で進み、クリエイターが自分のスキルの部屋へ歩いて作業します。上の「資金」を見ましょう。',
          '4. 案件が終わると報酬が入り、そのチームは次の案件に回せます。日が進むと、新しい案件がクエストボードに登場します。',
          '5. 案件が完了すると自動で止まります。「一時停止」で止めて考え、「+1日」で1日ずつ進められます。',
        ],
      },
      {
        title: '画面の説明',
        table: [
          ['スタジオ', 'メイン画面です。クリエイターが歩いて働くフロアと、クエストボード、編成、訓練、予測、収支表があります。'],
          ['魔導書', 'クリエイターのスキル(0〜5)を、ヒートマップとレーダーチャートで見ます。人物を開くとスキルを訓練できます。'],
          ['クエスト', '案件の一覧と、自分で案件を作るフォームです。「…を召喚」ボタンは、1回で編成してスタジオを開きます。'],
        ],
      },
      {
        title: 'スタジオのフロア',
        table: [
          ['スキルの部屋', 'ARラボ、VRルーム、3Dスタジオ、UXデスク、動画ブース、ディレクター室です。各部屋に、そのスキルの残り作業が出ます。バーは残りの量です。'],
          ['召喚サークル', '仕事がないクリエイターが待つ場所です。'],
          ['訓練道場', '訓練中のクリエイターがここに立ちます(📚)。'],
          ['これからのクエスト', 'これから登場する案件と、その報酬です。'],
          ['歩く・作業する', 'クリエイターは、作業するスキルの部屋へ歩いていきます。上下に弾むのは歩いているとき、左右に揺れるのは作業中です。'],
        ],
      },
      {
        title: '案件に必要なもの',
        body: [
          '案件は「スキル別の作業枠(ストリーム)」でできています。1つの枠は、スキル、必要な最低レベル、工数(人日)、必要人数を持ちます。',
          'その枠に割り当てられた人だけが、その枠の作業を進めます。すべての枠が終わると案件が完了します。いちばん遅い枠が、完了日を決めます。',
          '例:「AR、レベル3以上、24人日、2人」。この枠に入れるのは、AR がレベル3以上の人だけです。',
        ],
      },
      {
        title: '1日の作業量',
        items: [
          '1人の1日の消化量 = 稼働率(%)× 効率 × スキル係数。',
          `スキル係数はレベルごとに ${coefficientList} です。`,
          '1人が1つの案件の複数の枠を兼務するときは、稼働率を枠の数で等分します。',
          `1つの案件での1人の稼働率は ${MIN_RATE}%〜${MAX_RATE}% です。全案件の合計は ${MAX_RATE}% までです。`,
          'その案件での自分の枠をすべて終えた人は、その日の終わりに解放され、別の案件に回せます。',
          '案件が完了すると、その担当者はまとめて空きます。',
        ],
      },
      {
        title: 'お金のルール',
        table: [
          ['報酬', `基本報酬は、総工数 × ${REWARD_PER_PERSON_DAY} × 優先度(Critical ×${PRIORITY_MULTIPLIER.Critical}、High ×${PRIORITY_MULTIPLIER.High}、Normal ×${PRIORITY_MULTIPLIER.Normal})です。クエストカードやボードに出ている金額はこの基本報酬です。実際に入るお金は、この基本報酬に下記の早期ボーナスとコンボボーナスを足し、遅延ペナルティを引いた額です。`],
          ['早期ボーナス', `納期より1日早く終えるごとに、報酬の${pct(EARLY_BONUS_RATE)}です。最大${EARLY_BONUS_MAX_DAYS}日分です。`],
          ['遅延ペナルティ', `納期を過ぎても終わっていない日ごとに、報酬の${pct(LATE_PENALTY_RATE)}が引かれます。上限は報酬の${pct(LATE_PENALTY_CAP)}です。終えれば報酬は入ります。`],
          ['給料', '各クリエイターに日給があります。自分の枠に未完了の作業がある日は、日給 × 稼働率を支払います。待機中は無料です。'],
          ['訓練費', `訓練を始めるときに支払います。${costList}。`],
        ],
      },
      {
        title: '編成モード',
        table: [
          ['バランス', `1人あたり約${BALANCED_TARGET_RATE}%で、空いている人から選びます。1日のコストは安く、全員に優しいですが遅いです。納期が遠いときだけ安全です。`],
          ['スピードラン', 'レベルの高い人を選び、空いている時間をすべて割り当てます。速いので報酬が早く入ります。1日のコストは高めです。'],
          ['少数精鋭', '複数の枠をこなせる人を優先し、人数を最小にします。給料は最少ですが、兼務する人は各枠をゆっくりしか進められません。'],
        ],
      },
      {
        title: '訓練',
        items: [
          '資金を払って、1人の1つのスキルを1レベル上げます。費用は開始時にすぐ引かれます。',
          `訓練中の${TRAIN_DAYS}日間は、その人は作業できません。未完了の作業がある場合、給料は払われます。`,
          'おすすめの対象は、ある枠に1人しかいない人や、複数の案件が必要とするスキルです。',
          'スタジオの「訓練」パネル、または魔導書で人物を開いて行います。',
        ],
      },
      {
        title: 'コンボ・事件・ランク',
        items: [
          `コンボ: 前の案件を終えてから${COMBO_WINDOW_DAYS}日以内に次の案件を終えると、連鎖が伸びます。2回目以降は1段ごとに報酬の${pct(COMBO_BONUS_RATE)}が加算されます(最大${COMBO_MAX_STEPS}段)。`,
          `マイルストーン: 資金が${MILESTONES.map((m) => formatGold(m)).join('と')}に届くたびに演出が出ます。目標バーにも印が付きます。`,
          `事件: ${INCIDENT_FIRST_DAY + 1}日目以降、ランダムに事件が起きます。満月は${MOON_DAYS}日間、全員の作業が${pct(MOON_BOOST - 1)}速くなります。ゴーストの不具合は、1つの枠に${GLITCH_WORKLOAD}人日を足します。スポンサーは${formatGold(SPONSOR_AMOUNT)}をくれます。`,
          `ランク: ${RANK_S_MAX_DAY}日目までに勝てばS、${RANK_A_MAX_DAY}日目までならA、それ以降の勝利か目標まで10%以内の惜敗ならB、それ以外はCです。いちばん作業した人はMVPに選ばれます。`,
        ],
      },
      {
        title: '再生と条件変更',
        items: [
          '「再生」/「一時停止」で日の進行を開始・停止します。速度 1x〜8x で、日の進む速さを変えられます。',
          'いつでも何でも変更できます。再編成、稼働率スライダー、✕ で外す、訓練の開始などです。',
          '「予測」パネルは、選んだ案件の完了日とバーンダウンを、現在のペースで予測します。',
          'スタジオのページを離れると、ゲームは一時停止します。ページを再読み込みするまでは、進行状況が残ります。',
        ],
      },
      {
        title: 'バーとマークの見方',
        table: [
          ['資金 / 目標バー', '現在の資金と、目標までの距離です。'],
          ['クエストボードのバー', '枠ごとの進み具合です。いっぱいになると、その枠は完了です。'],
          ['⚡ エナジーバー(各メンバー)', 'その人の全案件の稼働率の合計です。いっぱいなら、予定が埋まっています。'],
          ['「…の担当者がいません」', '担当者のいない枠があり、案件が終わりません。再編成するか、人を足してください。'],
          ['「予測: N日遅れ」', '今のペースだと納期に遅れます。人を足す、稼働率を上げる、訓練するなどで対処します。'],
          ['マトリクスの 💀', 'スキルレベル0です。そのスキルでは作業できません。'],
          ['Lv. バッジ', '6つのスキルレベルの合計です(最大30)。'],
        ],
      },
      {
        title: 'コツ',
        items: [
          '最初の報酬が入るのは2週間ほど先です。それまで給料が出ていくので、序盤に人を入れすぎないようにしましょう。',
          '同じ案件を3つのモードで試して、「予測」を比べてみましょう。',
          '同じエースを複数の案件が必要とするときは、急ぎの案件を先に編成します。',
          '後から始まる案件は、すでにクエストボードに出ています。それに合わせてチームを空けておきましょう。',
          '音は初期状態でオンです。サウンドボタンで消せます。音が出ないときは、一度ページをクリックしてください。ブラウザは、クリックのあとでないと音を出せません。',
        ],
      },
    ],
  },
};






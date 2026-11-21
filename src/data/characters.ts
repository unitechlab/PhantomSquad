import type { CharacterId } from '@/types';
import type { Lang } from '@/data/i18n';

export interface CharacterText {
  name: string;
  title: string;
  role: string;
  /** One line shown under the name. */
  tagline: string;
  /** Short paragraphs. */
  bio: string[];
  /** What this creator is best at in the game. */
  bestFor: string;
  quote: string;
}

/** Roster text in both languages. Names, titles and roles also replace the English seed strings in the UI. */
export const CHARACTERS: Record<CharacterId, Record<Lang, CharacterText>> = {
  luna: {
    en: {
      name: 'Luna',
      title: 'Archmage of WebAR',
      role: 'AR / WebAR Engineer',
      tagline: 'Pins ghosts to the real world through a phone camera.',
      bio: [
        'Luna turns a plain browser tab into a summoning circle. Point a phone at any wall and her spells hold a ghost in place, with no app to install.',
        'She stays calm when a launch date closes in. The studio sends her every AR quest first.',
      ],
      bestFor: 'AR quests. She is the only level 5 in AR, so give her the heavy AR stream.',
      quote: 'AR lock-on!',
    },
    ja: {
      name: 'ルナ',
      title: 'WebARの大魔導師',
      role: 'AR / WebARエンジニア',
      tagline: 'スマホのカメラ越しに、幽霊を現実世界へ縫い止める。',
      bio: [
        'ルナは、ただのブラウザのタブを召喚陣に変えます。スマホを壁に向けるだけで、アプリなしで幽霊がその場に留まります。',
        '公開日が迫っても取り乱しません。スタジオのARクエストは、まず彼女に回されます。',
      ],
      bestFor: 'ARクエスト。ARがレベル5なのは彼女だけなので、重いARの枠を任せましょう。',
      quote: 'ARロックオン!',
    },
  },
  seven: {
    en: {
      name: 'Seven',
      title: 'Voidweaver of Immersive Realms',
      role: 'VR Engineer',
      tagline: 'Builds whole worlds that you can stand inside.',
      bio: [
        'Seven spends more time inside a headset than outside it. A frame that drops below the target rate bothers Seven more than a missed deadline.',
        'Quiet and precise, Seven can also lead a small team when the Director is busy.',
      ],
      bestFor: 'VR quests. The top VR creator, with enough Director skill to cover for small jobs.',
      quote: 'Frame rate is perfect.',
    },
    ja: {
      name: 'セブン',
      title: '没入世界の虚空織り',
      role: 'VRエンジニア',
      tagline: '中に立てる世界を、まるごと作り上げる。',
      bio: [
        'セブンは、ヘッドセットの外よりも中で過ごす時間のほうが長い人です。納期の遅れより、フレームレートの落ち込みのほうが気になります。',
        '物静かで正確。ディレクターが忙しいときは、小さなチームを率いることもできます。',
      ],
      bestFor: 'VRクエスト。VRの第一人者で、ディレクションも小さな案件なら代われます。',
      quote: 'フレームレートは完璧だ。',
    },
  },
  verna: {
    en: {
      name: 'Verna',
      title: '3D Mesh Necromancer',
      role: '3D Modeler',
      tagline: 'Raises dead polygons into living models.',
      bio: [
        'Verna sculpts props, monsters and whole haunted malls from nothing. She says a clean mesh is a polite ghost.',
        'She also knows enough AR to prepare models for Luna, so the two often share a quest.',
      ],
      bestFor: '3D quests and AR quests that need models. A strong second pair of hands for AR.',
      quote: 'Polygons obey me.',
    },
    ja: {
      name: 'ヴェルナ',
      title: '3Dメッシュの屍術師',
      role: '3Dモデラー',
      tagline: '死んだポリゴンを、生きたモデルに蘇らせる。',
      bio: [
        'ヴェルナは、小道具も怪物も、幽霊モールまるごとも、何もないところから彫り出します。きれいなメッシュは行儀のいい幽霊だ、が口ぐせです。',
        'ARにも詳しく、ルナ向けにモデルを整えられるので、2人はよく同じクエストに入ります。',
      ],
      bestFor: '3Dの作業と、モデルが必要なARクエスト。ARの頼れる右腕です。',
      quote: 'ポリゴンは私に従うの。',
    },
  },
  azria: {
    en: {
      name: 'Azria',
      title: 'Pink Sigil Illuminator',
      role: '2D UX Designer',
      tagline: 'Makes every screen friendly, even the cursed ones.',
      bio: [
        'Azria draws the buttons, menus and sigils that visitors actually tap. Her screens are clear enough that nobody reads the manual.',
        'She keeps a strict tea break schedule and a loose deadline schedule, and still ships on time.',
      ],
      bestFor: 'UX streams, and light video work. The only level 5 in 2D UX Design.',
      quote: 'Making it cute!',
    },
    ja: {
      name: 'アズリア',
      title: '桃色の紋章を灯す者',
      role: '2D UXデザイナー',
      tagline: '呪われた画面でも、やさしく使いやすくする。',
      bio: [
        'アズリアは、来場者が実際に押すボタン、メニュー、紋章を描きます。彼女の画面は、説明書がいらないほどわかりやすいのです。',
        'お茶の時間は厳守、納期の感覚はゆるめ。それでもきちんと間に合わせます。',
      ],
      bestFor: 'UXの枠と、軽い映像作業。2D UXデザインがレベル5なのは彼女だけです。',
      quote: 'かわいくしちゃおう!',
    },
  },
  crow: {
    en: {
      name: 'Crow',
      title: 'Lens Wraith of the Night Reel',
      role: 'Video Editor',
      tagline: 'Cuts a quest into a trailer worth watching twice.',
      bio: [
        'Crow works best after midnight, when the footage is quiet and the cuts come easily. Every promo video in the studio passes through that eye.',
        'A solid UX sense lets Crow help Azria when a video needs on-screen graphics.',
      ],
      bestFor: 'Video quests. The top video editor, and a fair UX helper.',
      quote: 'Cut. Print it.',
    },
    ja: {
      name: 'クロウ',
      title: '夜の映像を操るレンズの亡霊',
      role: '映像編集',
      tagline: 'クエストを、2回見たくなる予告編に仕立てる。',
      bio: [
        'クロウは、映像が静まり、カットが決まりやすい深夜に最も冴えます。スタジオのプロモ動画は、すべてその目を通ります。',
        'UXの感覚もしっかりあり、画面上のグラフィックが必要な動画では、アズリアを手伝えます。',
      ],
      bestFor: '動画のクエスト。映像編集の第一人者で、UXの手伝いもできます。',
      quote: 'カット。それでいこう。',
    },
  },
  serefi: {
    en: {
      name: 'Serefi',
      title: 'Silver Conductor of Souls',
      role: 'Director',
      tagline: 'Keeps eight ghosts moving in the same direction.',
      bio: [
        'Serefi plans the schedule, settles the arguments and decides what ships. Every quest needs a Director stream, and Serefi is the only level 5.',
        'The salary is the highest among the specialists, and worth it: one quest without a Director stalls the whole squad.',
      ],
      bestFor: 'The Director stream on any quest. Do not leave Serefi idle when a quest needs one.',
      quote: 'I shall decide.',
    },
    ja: {
      name: 'セレフィ',
      title: '魂を導く銀の指揮者',
      role: 'ディレクター',
      tagline: '8人の幽霊を、同じ方向へ歩かせる。',
      bio: [
        'セレフィは、スケジュールを組み、揉め事をおさめ、何を出荷するかを決めます。どのクエストにもディレクションの枠があり、レベル5なのはセレフィだけです。',
        '日給は専門職の中で最も高いですが、それだけの価値があります。ディレクターのいないクエストは、チーム全体が止まります。',
      ],
      bestFor: 'あらゆるクエストのディレクション枠。必要なときに遊ばせてはいけません。',
      quote: '私が決めよう。',
    },
  },
  mint: {
    en: {
      name: 'Mint',
      title: 'Green Circuit Alchemist',
      role: 'AI / Technical Creator',
      tagline: 'Mixes code, models and prompts into something new.',
      bio: [
        'Mint is the studio’s tinkerer. AR, VR and 3D are all at level 3, and Mint works 10% faster than the standard pace.',
        'When two quests need the same specialist, Mint fills the gap without a fuss.',
      ],
      bestFor: 'Filling gaps across AR, VR and 3D streams. A cheap all-rounder.',
      quote: 'Pixel perfect!',
    },
    ja: {
      name: 'ミント',
      title: '緑の回路の錬金術師',
      role: 'AI / テクニカルクリエイター',
      tagline: 'コードとモデルとプロンプトを混ぜて、新しいものを作る。',
      bio: [
        'ミントはスタジオの工作好きです。AR、VR、3Dはどれもレベル3で、標準より10%速く作業します。',
        '2つのクエストが同じ専門家を求めて取り合いになったとき、ミントが文句も言わずに穴を埋めます。',
      ],
      bestFor: 'AR、VR、3Dの枠の穴埋め。安く使える万能型です。',
      quote: 'ピクセルぴったり!',
    },
  },
  rave: {
    en: {
      name: 'Rave',
      title: 'Crimson Ace of All Trades',
      role: 'Ace Creator',
      tagline: 'Good at everything, and paid like it.',
      bio: [
        'Rave has no weak skill and works 20% faster than the standard pace. The salary is the highest in the studio, so Rave pays off only on a big or late quest.',
        'Bored easily. A Rave with nothing to do is a Rave spending your gold.',
      ],
      bestFor: 'Rescuing a late quest. Put Rave on the slowest stream, then free Rave when it is done.',
      quote: 'More power!',
    },
    ja: {
      name: 'レイヴ',
      title: '万能の深紅のエース',
      role: 'エースクリエイター',
      tagline: '何でもできる。給料もそれなりに高い。',
      bio: [
        'レイヴに苦手なスキルはなく、標準より20%速く作業します。日給はスタジオで最も高いので、元が取れるのは大きなクエストや遅れたクエストのときだけです。',
        'すぐに退屈します。仕事のないレイヴは、ただ資金を減らす存在です。',
      ],
      bestFor: '遅れているクエストの立て直し。いちばん遅い枠に入れて、終わったら外しましょう。',
      quote: 'もっと力を!',
    },
  },
};

/** Look up the localised profile of a character. */
export function characterText(id: CharacterId, lang: Lang): CharacterText {
  return CHARACTERS[id][lang];
}

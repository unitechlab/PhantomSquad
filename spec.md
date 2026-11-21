# Kiroween 2026 応募仕様書：NecroCrew / Phantom Squad（XR・クリエイティブチーム 最適編成＆案件消化シミュレータ）

## 1. ハッカソン戦略・テーマ設定（Kiroween 2026 適合要件）
- **応募カテゴリー選択**: **Costume Contest**（または **Frankenstein**）
  - **テーマコンセプト**: 「深夜のデジタル制作スタジオ（Necro-Studio）」。優秀なクリエイター（AR/VRエンジニア、3Dモデラー、2D UXデザイナー、動画編集者、ディレクター）の魂（スキル）を召喚・錬成し、次々と襲来するクライアント案件（モンスター/クエスト）を納期（満月）までに消化・討伐するダークファンタジー×サイバーパンク風リソース管理シミュレータ。
- **言語・提出要件**:
  - UI・ソースコード・ドキュメント・デモ動画（3分以内）はすべて**英語表記**（または日英切り替え可能でデフォルト英語）で構築し、グローバル審査員が即座に理解・操作できる状態にする。
  - GitHubの公開リポジトリのルートに `/.kiro` ディレクトリ（Specs, Hooks, Steering）を必ず含め、`.gitignore` から除外する。
  - 審査員がログイン不要で即座に試せる公開URLをデプロイする。

## 2. 技術スタック＆Kiro活用要件（Technological Implementation対策）
- **フロントエンド**: Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion（不気味で滑らかなアニメーション演出用）
- **可視化ライブラリ**: Recharts またはカスタムSVG（魔法陣風6軸スキルレーダーチャート・案件HPバーンダウンチャート）
- **Kiro 独自機能のフル活用**:
  1. **Spec-Driven Development**: `requirements.md` -> `design.md` -> `tasks.md` の順で設計・実装。
  2. **Property-Based Testing (PBT)**: 割り当てロジックと工数消化計算に対して `fast-check` を用いたプロパティベーステストを実装し、ユニットテストでは見逃す境界値バグ（稼働率100%超過やゼロ除算など）を防止する。
  3. **Agent Hooks**: コード保存時の自動テスト実行・Lintチェックフックを設定。
  4. **Kiro Crew 対応（ボーナス賞狙い）**: Kiro Crew のダッシュボード・スキル・MCPサーバーとしても動作するモジュール構造を採用し、**Best Kiro Crew App** 賞も同時に狙う。

## 3. データモデル定義

### 3.1 スキル定義 (SkillCategory)
XR・クリエイティブ領域の6つの専門スキル（魔法陣の6属性）を定義。
- `AR` (Spatial Tracking / WebAR)
- `VR` (Immersive World / Hand Tracking)
- `3D Modeling` (3Dモデル作成: Modeling, Retopology, Texture)
- `2D UX Design` (2D UX作成: UI/UX, Wireframe, 2D Assets)
- `Video Editing` (動画編集: Promo Video, Motion Graphics)
- `Director` (ディレクター: Planning, Management, Direction)

### 3.2 メンバー (Member / "Phantom Creator")
- `id`: string
- `name`: string
- `title`: string (二つ名: 例 "Archmage of WebAR", "3D Mesh Necromancer")
- `mainRole`: string
- `capacity`: number (最大稼働率: 基本 100%)
- `skills`: Array<{ skillName: SkillCategory, level: number }> (習熟度 0〜5)
- `efficiency`: number (作業効率係数: デフォルト 1.0)

### 3.3 案件 (Project / "Cursed Quest")
- `id`: string
- `title`: string (案件名: 例 "Haunted Mall WebAR Rally", "Cyber-Ghost VR Exhibition")
- `requiredSkills`: Array<{ skillName: SkillCategory, minLevel: number, workload: number, headcount: number }> (スキル別の最低レベル、必要工数[人日]、必要人数)
- `totalWorkload`: number (総工数 = 案件の初期HP)
- `startDate`: string (YYYY-MM-DD)
- `deadline`: string (YYYY-MM-DD / 討伐期限)
- `priority`: 'Critical' | 'High' | 'Normal'
- `status`: 'Pending' | 'Simulating' | 'Active' | 'Banished' (完了)

### 3.4 割り当て (Assignment)
- `projectId`: string
- `memberId`: string
- `allocatedRate`: number (アサイン稼働率: 10%〜100%)
- `assignedSkills`: Array<SkillCategory> (兼務スキル一覧)

## 4. 機能要件

### 4.1 スキルマップ＆召喚陣管理機能
- **クリエイター登録・編集**: 各メンバーの6大スキル（AR, VR, 3D Modeling, 2D UX Design, Video Editing, Director）のレベルを直感的に設定。
- **スキルマトリクス（Grimoire Matrix）**: チーム全体のスキル分布をダークテーマのヒートマップで表示し、不足スキル（弱点属性）を警告。
- **魔法陣レーダーチャート**: メンバー選択時、6軸のスキルバランスが発光する魔法陣風のレーダーチャートとして描画される。

### 4.2 案件登録・プリセット機能
- **クイック案件召喚（デモ映え重視）**: 審査員がワンクリックでシミュレーションを試せるよう、「ARプロモーション案件」「VR体験展示案件」「PR動画制作案件」のプリセットボタンを配置。

### 4.3 最適チーム自動割り当てエンジン（フランケンシュタイン融合ロジック）
案件に対して「自動編成（Summon Optimal Squad）」を実行すると、以下の3モードから最適解を算出する。
- **Balanced Mode（稼働均等化）**: 特定クリエイターへの過負荷（呪い・燃え尽き）を防ぎ、チーム全体の稼働率を平準化。
- **Speedrun Mode（最短討伐）**: 高スキルレベルの精鋭を集中投入し、最短日数で工数を消化。
- **Minimal Squad Mode（少人数兼務）**: 「AR＋3D Modeling」「Director＋2D UX」など複数スキルを兼務できるメンバーを優先し、最小人数で編成。

### 4.4 案件消化シミュレータ＆What-If操作
- **リアルタイム消化計算**: 「アサイン稼働率 × スキルレベル補正係数」により1日あたりの消化工数（ダメージ量）を算出し、完了予定日を予測。納期超過時はデスマーチ警告（赤色の不気味なエフェクト）を表示。
- **ドラッグ＆ドロップ / スライダー手動調整**: メンバーの入れ替えや稼働率スライダーを動かすと、バーンダウンチャートと完了予定日が即座に再計算される。

## 5. UI/UX・デザイン要件（Design & Presentation 対策）
- **Costume Contest 仕様のUI演出**:
  - ベースは視認性の高いダークモード（漆黒・濃紺）に、ネオングリーン・エクトプラズムパープル・警告のクリムゾンレッドをアクセントにした「不気味だが業務ツールとして極めて使いやすい」UIを構築する。
  - 自動アサイン実行時や案件完了（Banished）時に、控えめかつ印象的なパーティクル演出やサウンドエフェクト（ミュート切替付き）を実装し、3分間のデモ動画で視覚的インパクトを残す。

## 6. 非機能要件・テスト制約
- **プロパティベーステスト（PBT）必須実装**:
  - 任意のランダム生成されたメンバー群・案件群に対して、①全メンバーの合計稼働率が `capacity` を超えないこと、②正の工数と正の稼働率があれば必ず有限日数で完了すること、を `fast-check` で検証するテストスイートを含める。
- **初期データプリセット**:
  - 起動直後からデモが完結するよう、個性的な8名のXRクリエイターデータと3件のXR案件データが初期ロードされていること。

## 7. ゲーム要素(追加仕様)
- **キャンペーン**: 60日間の日めくり。再生・一時停止・倍速(1x/2x/4x/8x)・1日送りができる。
- **ゴール**: 60日以内に資金を11万Gにすれば勝利。資金がマイナス(破産)、または60日で届かなければ敗北。無限プレイは次フェーズで検討する。
- **お金**:
  - 案件の完了時に報酬(総工数 × 350G × 優先度係数)が入る。
  - 納期より早く終えると、1日につき報酬の2%(最大10日)のボーナス。遅れると1日につき報酬の4%(上限50%)の違約金。
  - 各メンバーに日給があり、未完了の作業がある日は日給 × 稼働率を支払う。
- **スキル訓練**: 資金を払って1スキルを1レベル上げる(費用は現在レベルで600〜3,600G)。訓練中の2日間は作業できない。
- **スキル枠ごとの消化**: 枠に割り当てられた人だけがその枠を進め、全枠が終わると案件が完了する。担当枠をすべて終えた人は自動で解放される。
- **スタジオフィールド**: スキルごとの部屋にキャラクターが歩いて移動し、作業・訓練・待機の様子を表示する。
- **遊び方ページ**: 日本語・英語切り替えで、上記のルールを説明する(数値は設定値から自動反映)。
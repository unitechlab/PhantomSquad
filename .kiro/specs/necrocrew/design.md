# NecroCrew — Design Document

> Derived from `spec.md` · Target: Kiroween 2026 (Costume Contest / Frankenstein)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Next.js App Router                     │
│  /app                                                         │
│    layout.tsx          ← global dark theme, font, sound ctx  │
│    page.tsx            ← dashboard shell                      │
│    /grimoire           ← Skill Matrix & Radar Chart views     │
│    /quests             ← Project list & quick-summon          │
│    /simulator          ← Assignment engine & burndown chart   │
│    /api                                                       │
│      /assign           ← POST: run auto-assignment engine     │
│      /simulate         ← POST: compute burndown projection    │
└──────────────────────────────────────────────────────────────┘

State layer : Zustand store (client-only, no DB for demo)
Data seed   : /src/data/seed.ts  (8 members, 3 projects)
Testing     : Vitest + fast-check (property-based)
```

### Key Design Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Routing | App Router (Next.js 14) | Required by spec |
| State | Zustand | Minimal boilerplate; serialisable for Kiro Crew MCP adapter |
| Animation | Framer Motion | Spec requirement; GPU-composited so no jank |
| Charts | Recharts + custom SVG | Spec requires radar + burndown; custom SVG for magic-circle effect |
| Testing | Vitest + fast-check | Spec mandates PBT; Vitest is faster than Jest in Vite/Next context |
| Styling | Tailwind CSS + CSS vars | Dark-mode tokens in `globals.css`; Tailwind for layout |

---

## 2. Data Models

All types live in `/src/types/index.ts`.

### 2.1 SkillCategory

```typescript
export type SkillCategory =
  | 'AR'
  | 'VR'
  | '3D Modeling'
  | '2D UX Design'
  | 'Video Editing'
  | 'Director';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'AR', 'VR', '3D Modeling', '2D UX Design', 'Video Editing', 'Director',
];
```

### 2.2 Member ("Phantom Creator")

```typescript
export interface SkillEntry {
  skillName: SkillCategory;
  level: number; // 0–5
}

export interface Member {
  id: string;
  name: string;
  title: string;           // e.g. "Archmage of WebAR"
  mainRole: string;
  capacity: number;        // max utilisation, default 100 (%)
  skills: SkillEntry[];    // one entry per SkillCategory
  efficiency: number;      // work multiplier, default 1.0
  characterId: CharacterId; // links to the art in §9 (face icon, mini, full body)
}
export type CharacterId =
  | 'luna' | 'seven' | 'verna' | 'azria'
  | 'crow' | 'serefi' | 'mint' | 'rave';
```

### 2.3 Project ("Cursed Quest")

```typescript
export interface RequiredSkill {
  skillName: SkillCategory;
  minLevel: number;        // minimum member skill level required
  workload: number;        // person-days for this skill stream
  headcount: number;       // minimum parallel assignees
}

export type ProjectPriority = 'Critical' | 'High' | 'Normal';
export type ProjectStatus   = 'Pending' | 'Simulating' | 'Active' | 'Banished';

export interface Project {
  id: string;
  title: string;
  requiredSkills: RequiredSkill[];
  totalWorkload: number;   // sum of workloads = initial HP
  startDate: string;       // YYYY-MM-DD
  deadline: string;        // YYYY-MM-DD
  priority: ProjectPriority;
  status: ProjectStatus;
}
```

### 2.4 Assignment

```typescript
export interface Assignment {
  projectId: string;
  memberId: string;
  allocatedRate: number;   // 10–100 (%)
  assignedSkills: SkillCategory[];
}
```

### 2.5 SimulationResult

```typescript
export interface DailyBurndown {
  date: string;            // YYYY-MM-DD
  remainingWorkload: number;
}

export interface SimulationResult {
  projectId: string;
  assignments: Assignment[];
  estimatedCompletionDate: string;
  isOverDeadline: boolean;
  dailyBurndown: DailyBurndown[];
  totalDailyOutput: number; // person-days per calendar day
}
```

---

## 3. Assignment Engine (`/src/lib/assignmentEngine.ts`)

### 3.1 Core Formula

```
dailyOutput(member, skill, rate) =
  (rate / 100) * member.efficiency * skillLevelCoefficient(memberSkillLevel)

skillLevelCoefficient(level):
  0 → 0.0   (cannot contribute)
  1 → 0.4
  2 → 0.6
  3 → 0.8
  4 → 1.0
  5 → 1.2   (specialist bonus)
```

```
teamDailyOutput = Σ dailyOutput(m, s, r)  for all active assignments
estimatedDays   = project.totalWorkload / teamDailyOutput   // must be finite > 0
```

### 3.2 Assignment Modes

**Balanced Mode**
1. For each required skill stream, collect eligible members (skillLevel ≥ minLevel).
2. Sort by current total allocated rate ascending (least loaded first).
3. Assign the minimum required headcount, distributing remaining capacity evenly.
4. Constraint: no member's total allocated rate across all concurrent projects exceeds `capacity`.

**Speedrun Mode**
1. For each skill stream, sort eligible members by skillLevel descending, then by efficiency descending.
2. Fill headcount with top-ranked members.
3. Allocate at their maximum available rate.

**Minimal Squad Mode**
1. Score each member by count of required skill streams they satisfy (skillLevel ≥ minLevel).
2. Greedily select members with highest multi-skill coverage.
3. Keep expanding selection until all skill streams meet headcount requirement.

### 3.3 Validation Rules (enforced before returning results)

- `allocatedRate` ∈ [10, 100] (clamped, never negative or zero).
- Sum of `allocatedRate` across all assignments for a member ≤ `member.capacity`.
- `teamDailyOutput` > 0; guard against zero-division before computing `estimatedDays`.
- `estimatedDays` must be a finite positive number; throw `EngineError` if not satisfiable.

---

## 4. Property-Based Test Contracts (`/src/lib/__tests__/assignmentEngine.pbt.test.ts`)

These contracts are the PBT targets required by the spec and by Kiroween's Technological Implementation rubric.

### Property 1 — Capacity Invariant
> For any randomly generated set of members and projects, after auto-assignment the sum of `allocatedRate` for each member across all concurrent assignments never exceeds that member's `capacity`.

```
∀ members[], projects[]:
  ∀ m ∈ members:
    Σ assignment.allocatedRate where assignment.memberId === m.id  ≤  m.capacity
```

### Property 2 — Finite Completion
> For any project with `totalWorkload > 0` and at least one eligible member with `allocatedRate > 0` and `skillLevel ≥ minLevel`, `estimatedDays` is a finite positive number.

```
∀ project (totalWorkload > 0), ∀ validAssignment (allocatedRate > 0, skill eligible):
  isFinite(estimatedDays) && estimatedDays > 0
```

### Property 3 — Monotonicity
> Adding more assigned capacity (more members or higher rates) never increases `estimatedDays`.

```
∀ assignmentSetA ⊆ assignmentSetB:
  estimatedDays(A) ≥ estimatedDays(B)
```

### Property 4 — Zero-Skill Guard
> A member with skillLevel 0 for every required skill produces zero daily output for that project.

```
∀ member (all skills level 0), ∀ project:
  dailyOutput(member, any required skill, any rate) === 0
```

---

## 5. UI Component Tree

```
<RootLayout>               ← dark theme, SoundContext, ToastContext
  <NavigationBar />        ← tab links: Grimoire | Quests | Simulator
  <Outlet />
    <GrimoirePage>
      <SkillHeatmap />     ← team-wide skill matrix, Tailwind grid
      <MemberCard />       ← <Portrait kind="face"/> + name/title + Lv; click → MemberModal
      <MemberModal>
        <Portrait kind="full" /> ← full-body art
        <RadarChart />     ← custom SVG magic-circle, 6-axis
      </MemberModal>
    </GrimoirePage>

    <QuestsPage>
      <QuestCard />        ← per-project status, <StatusBar kind="hp"/>, map thumbnail
      <PresetButtons />    ← "Summon AR Promo" | "Summon VR Expo" | "Summon PR Video"
      <QuestFormModal />   ← manual project registration
    </QuestsPage>

    <SimulatorPage>
      <SummonStage />      ← assigned members as mini characters over a summon circle
      <AssignmentPanel>
        <ModeSelector />   ← Balanced | Speedrun | Minimal Squad
        <AssignButton />   ← triggers engine → store update
        <AssignmentList>
          <AssignmentRow>  ← face icon + <StatusBar kind="energy"/> (load vs capacity)
            <RateSlider /> ← 10–100%, real-time recalculation
          </AssignmentRow>
        </AssignmentList>
      </AssignmentPanel>
      <ResultPanel>
        <BurndownChart />  ← Recharts LineChart, deadline marker
        <CompletionBadge /> ← green "Banished" or red "Death March Warning"
      </ResultPanel>
    </SimulatorPage>
```

---

## 6. Visual Design Tokens

Defined in `/src/styles/tokens.css` and mirrored in `tailwind.config.ts`.

```css
:root {
  /* Backgrounds */
  --color-void:        #0a0a0f;   /* deepest black */
  --color-crypt:       #12121e;   /* card background */
  --color-shadow:      #1e1e32;   /* elevated surface */

  /* Accents */
  --color-ecto:        #39ff14;   /* neon green — primary CTA */
  --color-specter:     #9b59b6;   /* ectoplasm purple — secondary */
  --color-crimson:     #c0392b;   /* warning / death march */
  --color-bone:        #e8e0d0;   /* primary text */
  --color-ash:         #8a8a9a;   /* secondary text */

  /* Glow effects */
  --glow-ecto:    0 0 8px #39ff14, 0 0 24px #39ff1440;
  --glow-specter: 0 0 8px #9b59b6, 0 0 24px #9b59b640;
  --glow-crimson: 0 0 8px #c0392b, 0 0 24px #c0392b40;
}
```

### Animation Catalogue

| Trigger | Effect | Implementation |
|---|---|---|
| Auto-assign executed | Particle burst from assign button | Framer Motion staggered `y` exit |
| Project "Banished" | Green particle sweep + chime | CSS keyframe + Web Audio API |
| Death March detected | Crimson pulse on burndown chart | Framer Motion `animate` loop |
| Radar chart open | Axes draw in with glow | SVG `stroke-dashoffset` transition |
| Rate slider drag | Burndown recalculates live | Zustand selector, debounced 16 ms |

---

## 7. Kiro Crew / MCP Adapter

`/src/mcp/necroCrew.ts` exports a lightweight tool adapter so the NecroCrew engine can be called as an MCP tool from Kiro Crew.

```typescript
// Tool: necrocrew_assign
// Input:  { projectId: string, mode: AssignmentMode }
// Output: SimulationResult

// Tool: necrocrew_simulate
// Input:  { projectId: string, assignments: Assignment[] }
// Output: SimulationResult
```

The Zustand store is serialisable JSON, so any Kiro Crew agent can read and mutate state via these tools without a separate backend.

---

## 8. File Structure

```
/
├── .kiro/
│   ├── specs/necrocrew/          ← requirements.md, design.md (this file), tasks.md
│   ├── steering/
│   │   ├── coding-conventions.md
│   │   └── halloween-ui-guidelines.md
│   └── hooks/
│       ├── on-save-test.json
│       └── on-save-lint.json
├── img/                          ← source sheets (character.png, material.png), not served
├── scripts/
│   ├── slice-assets.mjs          ← cuts the sheets into public/assets (see §9.3)
│   └── ruler.mjs                 ← debug: crops material.png with an x-ruler for calibrating §9.3
├── public/assets/                ← generated; committed so the deploy needs no build step
│   ├── characters/{id}/{face,mini,full}.webp
│   ├── skills/  badges/  effects/  scenes/  ui/
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── grimoire/page.tsx
│   │   ├── quests/page.tsx
│   │   ├── simulator/page.tsx
│   │   ├── guide/page.tsx        ← How to Play (EN/JA), text in src/data/guide.ts
│   │   ├── about/page.tsx        ← game introduction + the eight creators (§11)
│   │   ├── loading.tsx           ← spinner shown while a page loads (§10.10)
│   │   └── api/
│   │       ├── assign/route.ts
│   │       └── simulate/route.ts
│   ├── components/
│   │   ├── ui/                   ← Modal, NavigationBar (tabs, language, sound), NavProgress, LangSync, DesktopNotice
│   │   ├── about/CharacterCard.tsx
│   │   ├── art/                  ← Portrait, SkillIcon, Badge, EffectSprite, StatusBar (§9)
│   │   ├── charts/
│   │   │   ├── RadarChart.tsx
│   │   │   └── BurndownChart.tsx
│   │   ├── grimoire/
│   │   │   ├── SkillHeatmap.tsx
│   │   │   └── MemberModal.tsx
│   │   ├── quests/
│   │   │   ├── QuestCard.tsx
│   │   │   └── PresetButtons.tsx
│   │   └── simulator/
│   │       ├── AssignmentPanel.tsx
│   │       ├── SummonStage.tsx   ← mini characters + summon effects
│   │       └── ResultPanel.tsx
│   ├── lib/
│   │   ├── assignmentEngine.ts
│   │   ├── simulationEngine.ts
│   │   └── __tests__/
│   │       ├── assignmentEngine.unit.test.ts
│   │       └── assignmentEngine.pbt.test.ts   ← fast-check PBT
│   ├── store/
│   │   └── useNecroCrew.ts       ← Zustand store
│   ├── data/
│   │   ├── seed.ts               ← 8 members, 6 quests
│   │   ├── i18n.ts               ← UI text, English + Japanese (§11)
│   │   ├── characters.ts         ← creator profiles, English + Japanese
│   │   ├── about.ts              ← game introduction text
│   │   └── guide.ts              ← How to Play text
│   ├── hooks/
│   │   ├── useL10n.ts            ← t(), rich(), name/skill/quest lookups for the current language
│   │   ├── useGameClock.ts
│   │   └── useGameSounds.ts
│   ├── mcp/
│   │   └── necroCrew.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── tokens.css
├── spec.md                       ← original brief (Japanese)
├── LICENSE
├── package.json
├── tailwind.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---
## 9. Visual Assets (from the source art sheets, not published)

Two source sheets, both 1536×1024 PNG with an opaque white background:

- `img/character.png`: full-body art of the 8 creators (4 columns × 2 rows).
- `img/material.png`: face icons, mini characters, skill icons, badges, status UI, panels, effects.

### 9.1 Policy: what is an image and what is code
| Kind | Handling | Reason |
|---|---|---|
| Character art (face, mini, full body), skill icons, badges, effects, map, night-city scene, banner | Sliced raster (WebP, transparent) | Illustration; cannot be drawn in CSS |
| HP / Shield / Energy bars, level badge, panels, menu buttons, checklist, Start button | Rebuilt in CSS/SVG, using the sheet only as the style reference | They carry live values and text (the sheet bakes in "Mission", "78%", "Lv.50"), and must scale |

### 9.2 Character mapping
Cell positions in `character.png` (col, row) and the matching `Member`. The skill column follows the art brief (kept out of the repository); Mint and Rave are multi-skill members, which makes them the natural picks for Minimal Squad mode.

| characterId | Name | Role (art brief) | Accent | Cell | Primary skill levels in seed |
|---|---|---|---|---|---|
| `luna` | ルナ | AR / WebAR engineer | blue | 0,0 | AR 5, 3D 2 |
| `seven` | セブン | VR engineer | purple | 1,0 | VR 5, Director 2 |
| `verna` | ヴェルナ | 3D modeler | violet/silver | 2,0 | 3D 5, AR 3 |
| `azria` | アズリア | 2D UX designer | pink | 3,0 | 2D UX 5, Video 2 |
| `crow` | クロウ | Video editor | black/purple | 0,1 | Video 5, 2D UX 3 |
| `serefi` | セレフィ | Director | silver/white | 1,1 | Director 5, 2D UX 2 |
| `mint` | ミント | AI / technical creator | green | 2,1 | AR 3, VR 3, 3D 3 (multi-skill) |
| `rave` | レイヴ | Ace creator | crimson | 3,1 | all skills 3–4 (all-rounder, efficiency 1.2) |

The `SkillCategory` set stays at six. Mint and Rave do not add a seventh skill; they are expressed through skill spread, which the existing Minimal Squad scoring already rewards.

Accent colours become tokens (`--color-char-luna` and so on) in `tokens.css`. They are used only for the member's portrait frame and radar polygon, so the existing neon-use rules in the UI guidelines still hold.

### 9.3 Slicing pipeline
`scripts/slice-assets.mjs` (Node + `sharp`) reads a crop table, cuts each region, converts near-white to alpha, and writes WebP files plus `public/assets/manifest.json`. Output is committed, so the deploy does not depend on the script.

Two extra sources are used whole, with no white-to-alpha cut: `img/companyhouse.jpg` becomes `scenes/company-house.webp` (1536x1024, the Studio background), and `img/quest.png` is cut into six `quests/{quest-id}.webp` cards (492x480 each; columns at x = 22 / 522 / 1022, rows at y = 24 / 514; row-major order haunted-mall-webar, cyber-ghost-vr, specter-promo-video, phantom-museum-ar, moonlit-concert, grave-shift-launch).

Crop rectangles below are measured by eye on the 1536×1024 sheets and are approximate (±8 px). The script's first run must be checked visually and the table corrected. The script itself is the source of truth: parts of this table (faces, skill icons, cursors) are out of date.

**`character.png`** (cell size 384×512):
`full` for member at (col,row) = `{ x: col*384, y: row*512, w: 384, h: 512 }`, output max height 720 px.

**`material.png`**:
| Asset group | Region (x, y, w, h) | Count / layout | Output |
|---|---|---|---|
| Face icons | 18, 12, 1505, 236 | 8 cards, pitch ≈188 px | `characters/{id}/face.webp`, 256 px wide |
| Mini characters | 12, 255, 1512, 190 | 8 sprites, pitch ≈188 px | `characters/{id}/mini.webp`, 256 px high |
| Skill icons | 12, 457, 780, 82 | 8 icons, pitch ≈98 px | `skills/skill-1..8.webp`, 96 px |
| Badges | 820, 458, 705, 78 | 9 icons | `badges/badge-1..9.webp`, 96 px |
| Project Info panel (city thumbnail only) | 440, 730, 118, 80 | 1 | `ui/map-thumb.webp` |
| Isometric city map | 980, 548, 210, 148 | 1 | `scenes/city-map.webp` |
| Quest Complete banner | 815, 705, 430, 95 | 1 | `ui/quest-complete.webp` |
| Summon swirl | 15, 840, 220, 170 | 1 | `effects/summon-swirl.webp` |
| Light pillar | 235, 835, 135, 175 | 1 | `effects/summon-pillar.webp` |
| Purple burst | 440, 870, 280, 140 | 1 | `effects/burst-purple.webp` |
| Pixel crystal slash | 715, 815, 190, 195 | 1 | `effects/pixel-slash.webp` |
| Bat | 950, 820, 230, 170 | 1 | `effects/bat.webp` |
| Night city + moon (with sleeping Serefi and black cat) | 1190, 825, 335, 190 | 1 | `scenes/night-city.webp` |
| Cursors (3) | 905, 955, 250, 50 | 3 | `ui/cursor-1..3.webp` (optional) |

Face-icon order in the sheet, left to right (confirmed by the art owner): Seven, Luna, Verna, Serefi, Crow, Mint, Rave, Azria. The mini-character row is assumed to follow the same order.

Known risk: glows and smoke around effects fade into white, so a white-to-alpha cut can leave a pale halo on the dark UI. If a halo is visible, fall back to `mix-blend-mode: screen` on an inverted-luminance version, or ask for transparent PNGs for the effect group only.

### 9.4 Asset usage map
| Asset | Used in | Behaviour |
|---|---|---|
| Face icon | `MemberCard`, `AssignmentRow`, `Toast` | 56 px and 96 px sizes; frame colour from the member accent |
| Full body | `MemberModal` | Slides in from the left; radar chart sits on the right |
| Mini character | `SummonStage` | Appears over `summon-swirl` when an assignment is created; bobs idle (Framer Motion `y` ±4 px, 2 s loop) |
| Summon swirl + pillar | `SummonStage` | Played once per "Summon Optimal Squad" run, replacing the plain particle burst in §6 |
| Purple burst / pixel slash | Rate slider release, mode switch | 300 ms flash at the changed row |
| Skill icons | `SkillHeatmap` column heads, assignment chips, `RadarChart` axis labels | Mapping in §9.5 |
| Badges | Banished toast, `QuestCard` priority marker | Crown for Critical, trophy for Banished, star for High, shield for Normal |
| Quest Complete banner | `ResultPanel` on Banished | Scales in with a green sweep and the chime |
| Bat | `ResultPanel` on Death March | Flies across the chart once; crimson pulse continues as in §6 |
| City map | `QuestCard` thumbnail, `/quests` header | Static, 40% opacity behind text |
| Night city + moon | Empty states ("no squad summoned yet"), footer | Static |
| Black cat icon | Mute toggle in `NavigationBar` | Awake = sound on, dim = muted |
| Company house | Background of `StudioField` | Shown whole on a 3:2 field; the room labels are part of the picture, so the app draws none (see §10.5) |
| Quest cards | `QuestCard` on `/quests`, thumbnail in `ProjectBoard` | See §9.8 |

### 9.5 Skill icon mapping (assumed)
The sheet has 8 skill icons with no labels. The mapping follows colour affinity with the characters; the owner of the art should confirm it.

| Sheet icon | Look | Used for |
|---|---|---|
| 1 | pink slash | `2D UX Design` |
| 2 | blue crosshair | `AR` |
| 3 | purple vortex | `VR` |
| 4 | blue crystal/shield | `3D Modeling` |
| 5 | green cross with ring | Balanced mode |
| 6 | orange explosion | `Video Editing` |
| 7 | red demon | Death March warning |
| 8 | blue silhouette | `Director` |

Speedrun and Minimal Squad have no dedicated icon and stay text-only.

### 9.6 Status UI (CSS/SVG, styled after the sheet)
| Sheet element | Component | Bound to |
|---|---|---|
| Pink heart bar (HP) | `<StatusBar kind="hp">` | Project remaining workload / `totalWorkload` |
| Blue shield bar | `<StatusBar kind="shield">` | Schedule buffer: days between estimated completion and deadline, clamped to 0–100% of project duration |
| Yellow lightning bar (Energy) | `<StatusBar kind="energy">` | Member total `allocatedRate` / `capacity`; turns crimson above 90% |
| `Lv.` circle | `<LevelBadge>` | Member level = sum of the six skill levels (0–30). No new stored field |
| EXP bar | not used | Spec has no experience system |
| Mission / Team / Shop / Settings buttons | `NavigationBar` tab style | Visual reference only. Tabs stay Quests / Grimoire / Simulator; no Shop |
| Start button | `AssignButton` ("Summon Optimal Squad") | Visual reference, ecto-green glow per guidelines |
| Dialog panel with portrait | `Toast` and assignment result message | Face icon on the left, message on the right |
| Checklist panel | Preset-readiness list in `QuestFormModal` | Visual reference only |
| Hex frame, magic circle | `RadarChart` | Visual reference only; chart stays custom SVG |

### 9.7 Performance and delivery
- Sheets in `img/` total about 6.4 MB and are never served. Sliced WebP output is expected to stay under 1.5 MB in total.
- `next/image` with explicit `width`/`height` for every asset to avoid layout shift. Full-body art uses `priority` only on the first visible `MemberModal`.
- `SummonStage` mounts only on `/simulator`; effect sprites are preloaded when the page mounts so the first summon does not stall.
- Under `prefers-reduced-motion`, idle bobbing and the bat flight are disabled; summon effects become a 150 ms fade.
- Every image has `alt` text (the member name or the skill name). Decorative effects use `alt=""`.
- The art is original material supplied by the project owner, so no third-party licence entry is needed. Confirm this before the public submission.
### 9.8 Quest card art
`quest.png` holds finished cards: priority badge, title, date range and reward are painted into the picture. This breaks the policy in §9.1 (text is code) on purpose, because the owner designed the cards as a whole.
- `/quests`: a built-in quest shows its card picture, grayscale and dimmed with a "Banished" stamp once done. Status badge, remaining-work bar and "Open in Studio" sit under the picture. The `alt` text is built from the quest data (title, priority, dates, reward), so screen readers do not depend on the picture.
- `ProjectBoard` shows a 56 px crop of the picture as a thumbnail; text there is not legible and is not meant to be.
- `questArt(projectId)` returns the asset only for the six built-in ids. Quests the player creates have no picture and keep the earlier text card, so both paths must stay.
- Maintenance rule: the baked dates, rewards and priorities must match `seed.ts`. If a seed value changes, redraw the card and run `npm run assets`. There is no automated check for this.
---
## 10. Game Layer (campaign, money, field)

The simulator became a 60-day campaign. The core rules live in pure code (`src/lib/gameEngine.ts`, `src/lib/gameConfig.ts`); the UI only draws the state.

### 10.1 Loop
1. Quests arrive over the 60 days (3 at day 0, 3 later, see `CAMPAIGN_PROJECTS`).
2. The player staffs each quest ("Summon Optimal Squad" or by hand).
3. Each day (`stepDay`) every assigned creator works on the skill streams they are assigned to.
4. A finished quest pays its reward and frees its squad. Salaries and late penalties are charged daily.
5. Win: funds reach `GOAL_FUNDS`. Lose: funds below 0; every quest banished while funds are still below the goal (`lostReason: 'cleared'`, ends at once because nothing is left to earn); or day 60 without the goal (`'timeup'`).
6. Playback pauses by itself on the day a quest is banished, so the player can staff the next one.
Funds can be spent on training (`startTraining`).

### 10.2 Rules (all values in `gameConfig.ts`; the How to Play text reads them)
| Rule | Value |
|---|---|
| Campaign length | 60 days |
| Start funds / goal | 20,000 G / 110,000 G |
| Reward | total person-days x 350 x priority (Critical 1.3, High 1.15, Normal 1.0) |
| Early bonus | 2% of reward per full day before the deadline, max 10 days |
| Late penalty | 4% of reward per day after the deadline, capped at 50% of the reward |
| Salary | `Member.dailyCost` x allocation, on days the creator still has open work in their streams |
| Training | +1 level for one skill; cost 600 / 1,000 / 1,600 / 2,400 / 3,600 G by current level; 2 days with no work |
| Balanced mode rate | 70% per person |

### 10.3 Per-stream work
The previous model used the team total. It now follows streams, because the field needs to show who does what:
- A stream is worked only by assigned creators whose list contains its skill. Their rate is split evenly across their assigned skills.
- A quest ends when every stream is done. `simulate()` (API and MCP) uses the same rule, so forecasts and the game agree.
- A creator whose streams are all done is released that day. A quest that finishes releases everyone.
- `forecast()` predicts the finish day at today's output and reports streams nobody works on (`stalledSkills`).

### 10.4 Day step order (`stepDay`)
1. For each started, unfinished quest: collect salaries for creators with open work, then apply the day's output to each open stream (not for creators in training).
2. Charge the late penalty if the day is after the deadline.
3. If all streams are done: pay reward + early bonus, clear the squad.
4. Otherwise release creators with no open stream.
5. Advance training; on the last day raise the level.
6. Update funds, then check bankrupt / goal / time up. Append a `DaySummary` to `history`.

### 10.5 Studio field (`/simulator`)
```
<GameHud />          one row: day, funds, goal bar, Play/Pause, +1 day, 1x/2x/4x/8x, Sound, Restart, How to Play
<StudioField />      company-house picture (3x3 rooms), creators walk between rooms
<ProjectBoard />     all quests: stream bars, deadline, forecast, reward
<AssignmentPanel />  mode, Summon, rate sliders
<QuestForecast />    burndown of the selected quest at today's pace
<TrainingPanel />    train a skill (same <TrainControls /> as the Grimoire)
<Ledger />           last 10 days of income, salaries, penalties, events
<GameResult />       end-of-campaign dialog
```
The field keeps the picture's 3:2 ratio and its width is capped at `max(720px, (100vh - 190px) * 1.5)`, so the whole floor fits one screen on a normal desktop. Rooms are invisible boxes laid over the picture (rows centred at 15 / 46 / 77 %, columns at 17 / 50 / 83 %). Each room shows a dark chip at its bottom edge (open work bars, training list, or incoming quests); an active room gets a green border. The Quest Complete banner opens in the middle of the Summon Circle. Tailwind cannot apply opacity to the CSS-variable colours, so the chip background is mixed with `color-mix` in `PANEL_STYLE`.

Floor plan (`src/lib/fieldLayout.ts`, pure): AR Lab, VR Room, 3D Studio / Training Dojo, Summon Circle, Director Office / UX Desk, Video Booth, Incoming Quests. `memberActivity()` decides where each creator is: working in the room of their skill, training in the dojo, otherwise in the Summon Circle.

Motion: creators slide to their room with Framer Motion (0.7 s at 1x, shorter at higher speeds, 0 with reduced motion). The sprite bobs while walking and sways while working. Only one pose per character exists, so there is no walking animation, only these two loops.

Note on the UI guideline "no auto-playing loops": the walking and working loops are state indicators, are paused when the game is paused, and are disabled for `prefers-reduced-motion`. This is a deliberate exception and should be confirmed.

Events: Quest Complete banner and particle burst on a payout, bat flight and warning on the first late day of a quest, chime and alert sounds when unmuted.

Sound (`src/lib/sound.ts`, Web Audio, no files): chime on a payout, alert on the first late day, a tick per day, a rising pair when training starts, a fanfare on a win and falling notes on a loss. Sound is on by default. Browsers keep audio locked until a click or key press, so `NavigationBar` calls `unlockAudio()` on the first such event, and `tone()` waits for the context to resume instead of dropping the note. `useGameSounds` plays the day, training and result cues.

### 10.6 Store
`useNecroCrew` now holds the `GameState` (day, funds, members, projects, assignments, runs, training, outcome, history) plus UI state (mode, selection, speed, playing, muted). `useGameClock()` ticks `advanceDay` every `1000 / speed` ms and pauses on page leave. `useGameState()` returns the game part as one object for engine calls.

### 10.7 Tests
- `gameEngine.unit.test.ts`: reward, bonus, penalty cap, release, training, outcomes, forecast, balance baselines.
- `gameEngine.pbt.test.ts`: Properties 5-10 (money conserved, work only goes down, rewards paid once, capacity holds, forecast honest, determinism).
- `fieldLayout.unit.test.ts`: station choice and non-overlapping slots.
- Balance check: `npx tsx scripts/balance.ts` plays each mode on autopilot.

Balance baseline at the time of writing:
| Strategy | Result |
|---|---|
| Speedrun on every quest | wins on day 49 with about 121k |
| Balanced on every quest | reaches about 103k at day 60, short of the goal |
| Minimal Squad on every quest | bankrupt around day 24 |
| Do nothing | bankrupt around day 37 |

### 10.8 Flash: combo, incidents, milestones, rank, speech
All values are in `gameConfig.ts`; the How to Play text reads them.
| Feature | Rule | Where |
|---|---|---|
| Combo | A quest banished within 3 days of the previous one extends the chain. Each step after the first adds 5% of the reward, up to 4 steps. | `stepDay`, `comboStatus()`, `GameEvent.combo/bonus` |
| Milestones | Funds reaching 50,000 G and 80,000 G fire one `milestone` event each (`GameState.milestones` prevents repeats). Ticks on the goal bar. | `stepDay`, `GameHud` |
| Incidents | From day index 4, 12% per day, only while no Full Moon is running: Full Moon (+20% output for 3 days), ghost glitch (+3 person-days on one open stream), sponsor (+1,500 G income). | `stepDay`, `rollUnit()` |
| Rank | Win by day 46 = S, by day 52 = A, later = B; a loss with at least 90% of the goal = B; otherwise C. | `gameRank()`, `GameResult` |
| MVP | The creator with the most finished person-days (`GameState.contribution`). | `mostValuable()`, `GameResult` |
Incidents are drawn from `GameState.seed` with a pure hash (`rollUnit(seed, day, salt)`), so a seed replays the same campaign. `createGame(..., null)` turns incidents off; the rule-level property tests use that. The store draws a fresh seed on the first day of a campaign and on Restart.
Balance over 200 seeds (`npx tsx scripts/balance-seeds.ts`): Speedrun wins 192/200, median win day 49, ranks A 183 / B 10 / S 4 / C 3. Balanced wins 19/200. Minimal Squad never wins.
UI: `StudioField` shows the combo line in the Quest Complete banner, a coin burst (`CoinBurst`) and a short field shake on every payout, a notice under the banner for milestones and incidents, and a violet glow on the field while Full Moon lasts. `FieldMember` shows a speech bubble when a creator's job changes (`src/lib/speech.ts`, three lines per creator). Bubbles are `aria-hidden`; notices use `role="status"`. Shake, coins and bubble motion are off for `prefers-reduced-motion`. `GameHud` shows combo and Full Moon chips. Sounds: combo (rises with the step), milestone, moon, glitch, sponsor.
### 10.9 Known gaps
- Training changes the final funds by only about +1.5k in the best case found by search. It is a real choice but a minor one. Quests that need a higher minimum level than anyone has would make it matter.
- `headcount` is a hint for auto-assignment; the game does not enforce it.
- Endless mode (no goal) is planned for the next phase.
- No walking frames in the art, so movement is a slide.
- Room names and quest card text are part of the pictures, so they stay English in the Japanese UI (§11).
- "Summon Optimal Squad" can leave a stream unstaffed in some mid-game states; the board then says who is missing.

### 10.10 Flow and feedback
- **End of campaign.** `resultOpen` and `setResultOpen` live in the store. The summary dialog opens when the game ends and `resetGame` closes it. `GameHud` shows a persistent banner with "New campaign" and, while the dialog is closed, "View summary". The small Restart button is hidden once the game is over. The dialog offers New campaign, How to Play and "Close and review the studio". At the end the field clears its banner, notice and bat, and the overdue line shows only while `outcome === 'playing'`.
- **Quest Board.** It shows only what matters now: "Working on now" (running quests, Critical first, then by deadline), "Coming soon" (starts within `SOON_WINDOW_DAYS` = 7), a count of later quests, and a collapsed "Completed: x / 6" list. The full list stays on `/quests`.
- **Waiting feedback.** `app/loading.tsx` shows a spinner while a route loads. `NavProgress` is a slim bar at the top: it starts on a click on an in-app link to another path and ends when the pathname changes. It is off for `prefers-reduced-motion`.
- **START flourish.** `StudioField` shows "Start!" for 900 ms with a short rising chime each time a squad is summoned (`summonCount` changes; the first mount stays quiet). Hidden for reduced motion. Whether it should also fire when a quest's start date arrives is an open question.
- **Training panel.** It shows the selected creator's full portrait, name and title beside the skill list.

---

## 11. Language and About
### 11.1 Language
The whole UI is available in English and Japanese. English is the default.
- **State.** `useNecroCrew` holds `lang` and `setLang`. The choice is saved in `localStorage` (`necrocrew.lang`) by the language buttons in `NavigationBar`. `LangSync` restores it after load (English until the player picks Japanese, as the brief requires), then keeps `<html lang>` and the page title in step. Server HTML is English, so a Japanese visitor sees English for one frame after load.
- **Text.** `src/data/i18n.ts` holds one flat dictionary per language. English is the source; Japanese is typed `Record<TextKey, string>`, so a missing key fails the build. Placeholders are `{name}`. When `params.n === 1` and `<key>_one` exists, the singular form is used (otherwise the base key).
- **Helpers.** `useL10n()` (`src/hooks/useL10n.ts`) returns `t`, `rich` (placeholders that are React nodes, for styled numbers inside a sentence), and lookups for skills, priorities, statuses, modes, rooms, dates, quest titles, creator names/titles/roles and engine errors. `makeL10n(lang)` is the pure part and is unit-tested.
- **Data in the store stays English** (member names, quest titles, error messages). The UI maps them at display time: creators by `characterId`, built-in quests by id (`QUEST_TITLES_JA`), engine messages by pattern (`error()`). Custom quests keep the title the player typed. The MCP adapter and the engines are English only.
- **Other localised pieces.** Dates (`shortDate(date, lang)` gives "Oct 31" or "10月31日"), speech bubbles (`speech.ts`), the How to Play text (`guide.ts`, which uses the same Japanese terms as the UI) and the About text.
- **Not localised.** Room names, quest card text and the Quest Complete banner are baked into pictures. The banner's alt text is localised.

### 11.2 About page (`/about`)
A game introduction (story, "the game in one minute", what you do, how to win) with numbers read from `gameConfig`, then a profile card for each creator: full portrait, title, role, tagline, short bio, quote, "best for", top three skills, salary and speed bonus, and a link to the Grimoire. Text lives in `src/data/about.ts` and `src/data/characters.ts`. The bios are original text written for the game.

### 11.3 Tests
`i18n.unit.test.ts`: both languages have the same placeholders for every key, plural forms, every skill/priority/status/mode/room label exists, creator profiles are complete and match the English seed, quest titles, error localisation, `rich`, Japanese dates and speech, About structure.

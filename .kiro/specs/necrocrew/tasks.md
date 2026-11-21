# NecroCrew — Task List

> Implements `spec.md` via `design.md` · Kiroween 2026

Tasks are ordered by dependency. Complete each task fully (code + tests passing) before starting the next within a phase. Cross-phase tasks marked **[PARALLEL]** may run simultaneously once their prerequisites are done.

---

## Phase 0 — Project Bootstrap

### Task 0.1 — Repository & Toolchain Setup
**Goal**: Runnable Next.js 14 project with TypeScript, Tailwind, Vitest, and fast-check installed.

**Steps**:
1. `npx create-next-app@latest necrocrew --typescript --tailwind --app --src-dir --import-alias "@/*"`.
2. Add dependencies: `framer-motion recharts zustand fast-check vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom`.
3. Create `vitest.config.ts` with jsdom environment and `globals: true`.
4. Add `test` and `test:ui` scripts to `package.json`.
5. Ensure `.kiro/` directory is tracked (not in `.gitignore`).

**Acceptance criteria**:
- `npm run dev` starts without errors.
- `npm test` exits 0 (no test files yet is fine; config must not error).

---

### Task 0.2 — Design Tokens & Global Styles
**Goal**: All CSS colour/glow tokens from `design.md §6` are available globally.

**Steps**:
1. Create `src/styles/tokens.css` with all `--color-*` and `--glow-*` variables.
2. Import `tokens.css` in `src/app/globals.css`.
3. Extend `tailwind.config.ts` with matching `colors` and `boxShadow` entries (`ecto`, `specter`, `crimson`, `void`, `crypt`, `shadow`).

**Acceptance criteria**:
- `className="bg-void text-bone shadow-ecto"` renders with the correct colours in browser.

---

### Task 0.3 — Asset Slicing Pipeline
**Goal**: `public/assets/` holds every sprite listed in `design.md §9`, generated from `img/*.png`.
**Steps**:
1. Add `sharp` as a dev dependency.
2. Create `scripts/slice-assets.mjs` with the crop table from `design.md §9.3`; convert near-white to alpha; write WebP and `public/assets/manifest.json`.
3. Run it, open the output, and correct crop rectangles and verify the mini-character order (face-icon order is confirmed: Seven, Luna, Verna, Serefi, Crow, Mint, Rave, Azria).
4. Check effect sprites on `--color-void` for white halos; apply the fallback in §9.3 if needed.
5. Add `npm run assets` script. Commit the generated files.
**Acceptance criteria**:
- Every path in `manifest.json` exists and loads.
- Face icons show the right character for each `characterId` (confirmed by eye).
- Total size of `public/assets/` under 1.5 MB.
---
## Phase 1 — Data Layer

### Task 1.1 — Type Definitions
**Goal**: All types from `design.md §2` compiled without errors.

**Steps**:
1. Create `src/types/index.ts` with `SkillCategory`, `SKILL_CATEGORIES`, `Member`, `Project`, `Assignment`, `SimulationResult`, `DailyBurndown`, `AssignmentMode`, `EngineError`.
2. Export every type and constant.

**Acceptance criteria**:
- `npx tsc --noEmit` passes.

---

### Task 1.2 — Seed Data
**Goal**: 8 `Member` objects and 3 `Project` objects satisfy all type constraints and cover all 6 `SkillCategory` values.

**Steps**:
1. Create `src/data/seed.ts`.
2. Define `SEED_MEMBERS: Member[]` — 8 XR creators using the names, roles and `characterId` values in `design.md §9.2` (Luna, Seven, Verna, Azria, Crow, Serefi, Mint, Rave), with distinctive titles (e.g. "Archmage of WebAR", "3D Mesh Necromancer").  Ensure at least one member per SkillCategory has level ≥ 3.
3. Define `SEED_PROJECTS: Project[]`:
   - `"Haunted Mall WebAR Rally"` — AR + 3D Modeling dominant, priority Critical.
   - `"Cyber-Ghost VR Exhibition"` — VR + Director dominant, priority High.
   - `"Specter Promo Video"` — Video Editing + 2D UX Design dominant, priority Normal.
4. Each project's `totalWorkload` equals the sum of its `requiredSkills[].workload`.

**Acceptance criteria**:
- `SEED_MEMBERS.length === 8`.
- `SEED_PROJECTS.length === 3`.
- All 6 SkillCategory values appear in `SEED_MEMBERS` skills.
- `npx tsc --noEmit` still passes.

---

### Task 1.3 — Zustand Store
**Goal**: Global state store wires seed data and exposes mutation actions.

**Steps**:
1. Create `src/store/useNecroCrew.ts`.
2. Initial state: `members: SEED_MEMBERS`, `projects: SEED_PROJECTS`, `assignments: Assignment[]`, `simulationResults: SimulationResult[]`, `selectedProjectId: string | null`, `assignmentMode: AssignmentMode`.
3. Actions: `addMember`, `updateMember`, `addProject`, `updateProjectStatus`, `setAssignments`, `setSimulationResult`, `setSelectedProject`, `setAssignmentMode`.
4. Persist assignments to `sessionStorage` using Zustand's `persist` middleware.

**Acceptance criteria**:
- Store initialises with seed data.
- `npx tsc --noEmit` passes.

---

## Phase 2 — Engines

### Task 2.1 — Assignment Engine Core
**Goal**: Implement the three assignment modes and all validation rules from `design.md §3`.

**File**: `src/lib/assignmentEngine.ts`

**Steps**:
1. Implement `skillLevelCoefficient(level: number): number`.
2. Implement `dailyOutput(member, skillEntry, allocatedRate): number`.
3. Implement `computeEstimatedDays(project, assignments, members): number` — guard zero-division, return `Infinity` only if no eligible assignment exists (then caller throws).
4. Implement `assignBalanced(project, members, existingAssignments): Assignment[]`.
5. Implement `assignSpeedrun(project, members, existingAssignments): Assignment[]`.
6. Implement `assignMinimalSquad(project, members, existingAssignments): Assignment[]`.
7. Export `autoAssign(mode, project, members, existingAssignments): Assignment[]`.
8. All validation rules from `design.md §3.3` enforced; throw typed `EngineError` on violation.

**Acceptance criteria**:
- `npx tsc --noEmit` passes.
- Unit tests in Task 2.3 pass.

---

### Task 2.2 — Simulation Engine
**Goal**: Given assignments, compute day-by-day burndown.

**File**: `src/lib/simulationEngine.ts`

**Steps**:
1. Implement `simulate(project, assignments, members, startDate): SimulationResult`.
2. Iterate calendar days from `startDate`; subtract `teamDailyOutput` each day.
3. Collect `DailyBurndown[]` entries until `remainingWorkload ≤ 0`.
4. Set `isOverDeadline = estimatedCompletionDate > project.deadline`.
5. Cap iteration at 1 825 days (5 years) to prevent infinite loops on bad input.

**Acceptance criteria**:
- `npx tsc --noEmit` passes.
- Unit tests in Task 2.3 pass.

---

### Task 2.3 — Unit Tests (Engines)
**Goal**: Cover deterministic engine behaviour with traditional unit tests.

**File**: `src/lib/__tests__/assignmentEngine.unit.test.ts`

**Steps**:
Write tests for:
1. `skillLevelCoefficient(0) === 0` and `skillLevelCoefficient(5) === 1.2`.
2. `dailyOutput` returns 0 when skill level is 0 regardless of rate.
3. `computeEstimatedDays` with known inputs returns the expected value.
4. `autoAssign('balanced', ...)` respects capacity — no member exceeds `capacity`.
5. `autoAssign('speedrun', ...)` selects the highest-skilled eligible member first.
6. `simulate` returns `isOverDeadline: false` when total capacity clearly finishes before deadline.
7. `simulate` returns `isOverDeadline: true` when capacity is too low.

**Acceptance criteria**:
- `npm test` exits 0 with all 7+ assertions passing.

---

### Task 2.4 — Property-Based Tests (PBT) ⬅ Kiroween PBT Requirement
**Goal**: Implement the four PBT contracts from `design.md §4` using `fast-check`.

**File**: `src/lib/__tests__/assignmentEngine.pbt.test.ts`

**Steps**:
1. Define `fc.Arbitrary` generators:
   - `arbSkillLevel()` → integer 0–5.
   - `arbMember()` → valid `Member` with all 6 skills, `capacity` 50–100, `efficiency` 0.5–1.5.
   - `arbProject()` → valid `Project` with 1–3 required skills, `totalWorkload` 1–200.
   - `arbAssignmentMode()` → one of `'balanced' | 'speedrun' | 'minimalSquad'`.

2. **Property 1 — Capacity Invariant**:
   ```typescript
   fc.assert(fc.property(
     fc.array(arbMember(), { minLength: 1, maxLength: 10 }),
     arbProject(),
     arbAssignmentMode(),
     (members, project, mode) => {
       const assignments = autoAssign(mode, project, members, []);
       for (const member of members) {
         const total = assignments
           .filter(a => a.memberId === member.id)
           .reduce((sum, a) => sum + a.allocatedRate, 0);
         expect(total).toBeLessThanOrEqual(member.capacity);
       }
     }
   ));
   ```

3. **Property 2 — Finite Completion**:
   For any project with `totalWorkload > 0` and at least one eligible member, `estimatedDays` is finite and positive.

4. **Property 3 — Monotonicity**:
   Adding an extra valid assignment never increases `estimatedDays`.

5. **Property 4 — Zero-Skill Guard**:
   A member whose every skill is level 0 contributes 0 daily output.

6. Run each property with at least 200 examples (`numRuns: 200`).

**Acceptance criteria**:
- `npm test` exits 0.
- All 4 properties pass 200 runs each without shrink failures.

---

### Task 2.5 — API Routes
**Goal**: Thin Next.js route handlers that call the engines.

**Files**: `src/app/api/assign/route.ts`, `src/app/api/simulate/route.ts`

**Steps**:
1. `POST /api/assign` — accepts `{ projectId, mode }`, loads from store (server-side seed fallback), returns `Assignment[]`.
2. `POST /api/simulate` — accepts `{ projectId, assignments }`, returns `SimulationResult`.
3. Both routes validate input with Zod schemas; return 400 on invalid input with error message.
4. Both routes return 500 with structured `EngineError` JSON on engine failure.

**Acceptance criteria**:
- `curl -X POST localhost:3000/api/assign -d '{"projectId":"p1","mode":"balanced"}'` returns valid JSON.

---

## Phase 3 — UI Components

### Task 3.1 — Layout & Navigation Shell [PARALLEL with 3.2]
**Goal**: Root layout with dark theme, navigation tabs, sound context.

**Steps**:
1. Update `src/app/layout.tsx` — apply `bg-void text-bone` base classes, load tokens.
2. Create `src/components/ui/NavigationBar.tsx` — three tabs: Grimoire | Quests | Simulator. Active tab glows with `--glow-ecto`.
3. Create `src/contexts/SoundContext.tsx` — `useSoundContext()` hook; tracks `muted: boolean`; exposes `playChime()` and `playAlert()` using Web Audio API. Falls back gracefully if audio is unavailable.

**Acceptance criteria**:
- Navigation renders on all three routes.
- Mute toggle persists to `localStorage`.

---

### Task 3.2 — Reusable UI Primitives [PARALLEL with 3.1]
**Goal**: Shared components used across all pages.

**Steps**:
Create in `src/components/ui/`:
1. `Button.tsx` — variants: `primary` (ecto glow), `danger` (crimson glow), `ghost`.
2. `Slider.tsx` — range input styled to match dark theme; emits `onChange(value: number)`.
3. `Modal.tsx` — overlay with backdrop blur, Framer Motion scale-in animation.
4. `Badge.tsx` — priority/status pill (`Critical` = crimson, `High` = specter, `Normal` = bone).
5. `HPBar.tsx` — horizontal bar showing `remainingWorkload / totalWorkload`; colour shifts red below 25%.

**Acceptance criteria**:
- Components render in isolation (Storybook not required; manual check is sufficient).
- All props are fully typed.

---

### Task 3.3 — Radar Chart (Magic Circle)
**Goal**: Custom SVG radar chart for 6 skills, with glow animation on mount.

**File**: `src/components/charts/RadarChart.tsx`

**Steps**:
1. Accept `skills: SkillEntry[]` and `color?: string` props.
2. Compute polygon vertices for a regular hexagon; map skill levels (0–5) to radii.
3. Draw background grid (5 concentric hexagons) in dim `--color-ash`.
4. Draw the skill polygon filled with semi-transparent `color` and stroked with glow.
5. Animate `stroke-dashoffset` from full length to 0 on mount (1 s ease-out).
6. Label each axis with the SkillCategory name.

**Acceptance criteria**:
- Chart renders correctly for a member with all skills at level 3.
- Animation plays on each modal open.

---

### Task 3.4 — Grimoire Page (Skill Matrix)
**Goal**: Team-wide skill heatmap and per-member radar modal.

**File**: `src/app/grimoire/page.tsx`, `src/components/grimoire/SkillHeatmap.tsx`, `src/components/grimoire/MemberModal.tsx`

**Steps**:
1. `SkillHeatmap` renders a grid: rows = members, columns = SkillCategory. Cell colour intensity mapped to skill level (0 = near-black, 5 = full ecto green).
2. Cells with level < 2 show a warning icon (skull emoji or SVG).
3. Clicking a row opens `MemberModal` showing name, title, and `RadarChart`.
4. Add/Edit member form with sliders for each skill level.

**Acceptance criteria**:
- All 8 seed members visible in heatmap.
- Modal opens with animation; radar chart draws correctly.

---

### Task 3.5 — Quests Page
**Goal**: Project list with HP bars, quick-summon presets, and manual project form.

**File**: `src/app/quests/page.tsx`, `src/components/quests/QuestCard.tsx`, `src/components/quests/PresetButtons.tsx`

**Steps**:
1. `QuestCard` shows project title, priority badge, HP bar (`totalWorkload` as max HP), status badge, deadline countdown in days.
2. `PresetButtons` renders three buttons: "⚡ Summon AR Promo", "👻 Summon VR Expo", "🎬 Summon PR Video". Each adds a predefined project to the store.
3. "Add Custom Quest" opens a form modal for manual project creation.
4. Selecting a project sets `selectedProjectId` in store and navigates to `/simulator`.

**Acceptance criteria**:
- All 3 seed projects visible.
- Preset buttons add new projects to the list immediately.

---

### Task 3.6 — Burndown Chart
**Goal**: Recharts `LineChart` showing daily workload reduction with deadline marker.

**File**: `src/components/charts/BurndownChart.tsx`

**Steps**:
1. Accept `result: SimulationResult` and `deadline: string` props.
2. Render a `LineChart` with `remainingWorkload` on Y axis and date on X axis.
3. Add a `ReferenceLine` at the deadline date; label it "Deadline 🌕".
4. If `result.isOverDeadline`, colour the line segment after the deadline crimson and add a Framer Motion pulsing overlay.
5. Animate data series entry with a left-to-right draw effect (`strokeDashoffset`).

**Acceptance criteria**:
- Chart renders without warnings for all 3 seed projects.
- Over-deadline state shows crimson pulse.

---

### Task 3.7 — Simulator Page
**Goal**: Full assignment workflow from mode selection to burndown result display.

**File**: `src/app/simulator/page.tsx`, `src/components/simulator/AssignmentPanel.tsx`, `src/components/simulator/ResultPanel.tsx`

**Steps**:
1. `ModeSelector` renders three styled toggle buttons; selection updates store.
2. "Summon Optimal Squad" button calls `autoAssign`, stores results, then calls `simulate`.
3. `AssignmentList` renders one row per assignment: member name, assigned skills chips, `RateSlider` (10–100%). Slider change triggers debounced `simulate` call (16 ms).
4. `ResultPanel` shows `BurndownChart`, `CompletionBadge` ("✅ Banished" or "☠️ Death March Warning"), and estimated completion date.
5. On "Banished" (simulate result shows completion ≤ deadline): trigger particle burst animation and `playChime()`.
6. On Death March: pulse crimson border on `ResultPanel` and `playAlert()`.

**Acceptance criteria**:
- Full flow works end-to-end for each of the 3 seed projects.
- Slider adjustments update the chart in real time.
- Sound effects play (unless muted).

---

### Task 3.8 — Art Components & Summon Stage
**Goal**: Sliced assets are wired into the UI as `design.md §9.4–9.6` describes.
**Files**: `src/components/art/*`, `src/components/simulator/SummonStage.tsx`
**Steps**:
1. `Portrait` (`face` | `mini` | `full`), `SkillIcon`, `Badge`, `EffectSprite` read paths from `manifest.json` via `next/image`.
2. `StatusBar` (`hp` | `shield` | `energy`) and `LevelBadge` in CSS/SVG with the token colours.
3. Use `Portrait` in `MemberCard`, `MemberModal`, `AssignmentRow`; `SkillIcon` in the heatmap and chips; `Badge` in `QuestCard`.
4. `SummonStage`: on "Summon Optimal Squad", show each assigned member's mini character over the summon swirl and pillar.
5. On Banished show the Quest Complete banner; on Death March fly the bat once.
6. Honour `prefers-reduced-motion`.
**Acceptance criteria**:
- All 8 members show the correct face, mini and full art.
- Energy bar turns crimson above 90% load.
- No layout shift when images load; no console errors for missing assets.
---
## Phase 4 — Kiro Crew / MCP Adapter

### Task 4.1 — MCP Tool Adapter
**Goal**: Expose assignment and simulation as callable MCP tools.

**File**: `src/mcp/necroCrew.ts`

**Steps**:
1. Define `NecroCrewTools` object with two tools:
   - `necrocrew_assign`: input `{ projectId: string, mode: AssignmentMode }` → `Assignment[]`.
   - `necrocrew_simulate`: input `{ projectId: string, assignments: Assignment[] }` → `SimulationResult`.
2. Each tool handler loads seed data as default state.
3. Export a `registerNecroCrewTools(server: McpServer)` function.

**Acceptance criteria**:
- `npx tsc --noEmit` passes.
- Each tool handler returns valid typed output when called with seed data IDs.

---

## Phase 5 — Polish & Demo Readiness

### Task 5.1 — Particle Effects
**Goal**: Framer Motion particle burst on key events.

**Steps**:
1. Create `src/components/ui/ParticleBurst.tsx` — renders 20 small circles with staggered `y` and `opacity` exit animations in ecto green.
2. Integrate into Simulator Page: mount `ParticleBurst` when assignment completes; unmount after animation.
3. Integrate into Quest Card: mount when status changes to `'Banished'`.

---

### Task 5.2 — Responsive Layout & Accessibility
**Goal**: Usable on 1280 px+ desktop (primary) and 768 px tablet (secondary).

**Steps**:
1. Ensure all pages have sensible layouts at both breakpoints.
2. All interactive elements have `aria-label` or visible label.
3. Colour contrast: text on `--color-crypt` background meets WCAG AA (4.5:1).

---

### Task 5.3 — i18n Toggle (English default / Japanese) ✅
Done differently from the first plan below: one dictionary file `src/data/i18n.ts` (not `src/i18n/*`), the hook is `useL10n()`, the store field is `lang`. See Task 7.1 and design.md §11.
**Goal**: UI text switchable between English and Japanese; English is default.

**Steps**:
1. Create `src/i18n/en.ts` and `src/i18n/ja.ts` with all UI strings.
2. `useTranslation()` hook reads from Zustand `locale` field (`'en' | 'ja'`).
3. Add a language toggle button in `NavigationBar`.

---

### Task 5.4 — Deployment
**Goal**: Public URL accessible to Kiroween judges without login.

**Steps**:
1. Push to public GitHub repository. Confirm `.kiro/` directory is committed and not in `.gitignore`.
2. Deploy to Vercel (free tier): connect repository, set `NEXT_PUBLIC_APP_NAME=NecroCrew`.
3. Verify public URL loads and all three preset buttons work.
4. Record 3-minute demo video: show Grimoire → Quests preset summon → Simulator auto-assign → burndown result with Banished animation.

**Acceptance criteria**:
- Public URL returns HTTP 200.
- Demo video is ≤ 3 minutes and covers all four scenes above.

---

### Task 5.5 — How to Play Guide
**Goal**: A first-time visitor can learn the rules without reading the spec.
**Steps**:
1. `src/data/guide.ts` holds the guide text in English and Japanese.
2. `/guide` page with a language toggle, linked from the nav bar, Home and Simulator.
3. A unit test checks both languages have the same structure and that the stated numbers match the engine constants.
**Acceptance criteria**:
- Guide covers goal, quick start, schedule formula, limits, modes, bars and tips.
- Changing a constant in `assignmentEngine.ts` that the guide quotes fails the test until the text is updated.
---
## Completion Checklist

| Item | Done? |
|---|---|
| `.kiro/` committed to repo (not gitignored) | ☐ (not in `.gitignore`; commit pending) |
| `npm test` exits 0 | ✅ |
| PBT properties all pass 200 runs | ✅ |
| Seed data: 8 members, 3 projects | ✅ |
| All three assignment modes produce valid output | ✅ |
| Radar chart animates on open | ☐ (implemented, not yet seen in a browser) |
| Burndown chart shows deadline marker | ☐ (implemented, not yet seen in a browser) |
| Death March warning activates correctly | ☐ (implemented, not yet seen in a browser) |
| Particle burst fires on Banished | ☐ (implemented, not yet seen in a browser) |
| Sound mute toggle works | ☐ (implemented, not yet heard) |
| Public Vercel URL live | ☐ |
| Demo video ≤ 3 min, English narration | ☐ |
| MCP adapter compiles cleanly | ✅ (stdio server verified with `npm run mcp:check`) |

---
## Phase 6 — Campaign, Money and Studio Field
### Task 6.1 — Per-stream simulation ✅
`simulate()` follows skill streams; `streamOutput()` added; unit and PBT tests updated.
### Task 6.2 — Game engine ✅
`gameConfig.ts`, `gameEngine.ts` (`createGame`, `stepDay`, `startTraining`, `forecast`, `memberActivity`), `autopilot.ts`. Economy fields `Member.dailyCost`, `Project.reward`. Six quests (3 later arrivals).
### Task 6.3 — Game tests ✅
Unit tests, PBT Properties 5-10, balance baselines, `scripts/balance.ts`.
### Task 6.4 — Studio field UI ✅
HUD, field, quest board, forecast, training, ledger, result dialog, day clock. Pages renamed Simulator → Studio.
### Task 6.5 — How to Play rewrite ✅
Rules text reads the game constants, so it cannot drift.
### Task 6.5b — Studio background, quest art, end rules, sound ✅
1. Studio background from `companyhouse.jpg`; whole floor fits one screen (design.md §10.5).
2. Quest card art from `quest.png` on `/quests` and in the Quest Board (design.md §9.8).
3. Game ends when every quest is banished (`lostReason: 'cleared'`); playback pauses on each banished quest.
4. Sound on by default, audio unlock on first gesture, day/training/result cues.

### Task 6.5c — Flash features ✅
Combo, milestones, random incidents, rank and MVP, speech bubbles, coin burst and shake (design.md §10.8). Tests: `gameExtras.unit.test.ts`; PBT now runs with incidents off (`createGame(..., null)`). Balance script: `scripts/balance-seeds.ts`.

### Task 6.6 — Open items ☐
1. Confirm the loop-animation exception in the UI guidelines (`design.md §10.5`).
2. Make training matter (quests with a minimum level above the current team).
3. Endless mode (next phase).
4. Check on a real browser: field motion, sound (headless run only confirmed that tones start), Quests page burst, the START flourish and the top loading bar (both are too brief for a screenshot).
5. Quest card art has dates and rewards baked in; keep them in step with `seed.ts` (design.md §9.8).
6. Decide whether START should also fire when a quest's start date arrives, not only on summon.
7. Auto-assign can leave Director unstaffed in some mid-game states.
8. Japanese UI: room names and quest card text are part of the pictures and stay English. A Japanese version of the pictures would be needed to change that.

### Task 6.7 — Game-over flow, Quest Board, waiting feedback, START ✅
1. Result dialog state in the store (`resultOpen`), persistent game-over banner with New campaign / View summary, overlays cleared at the end.
2. Quest Board shows "Working on now", "Coming soon" and a collapsed "Completed" list.
3. `loading.tsx` spinner and the `NavProgress` top bar.
4. "Start!" flourish and chime on each summon.
Details: design.md §10.10.

---
## Phase 7 — Language and Introduction
### Task 7.1 — Japanese UI ✅
Dictionary `src/data/i18n.ts` (keys checked by the compiler), `useL10n()`, `LangSync`, language buttons in the navigation bar, saved in `localStorage`. All pages and dialogs, dates, speech bubbles, creator names, quest titles and engine error messages are translated. The How to Play Japanese text uses the same terms as the UI. Details: design.md §11.1.
### Task 7.2 — Training panel portrait ✅
`TrainingPanel` shows the selected creator's full portrait, name and title.
### Task 7.3 — About page ✅
`/about` with the game introduction and eight creator profiles in both languages; added to the navigation bar and the home page. Details: design.md §11.2.
### Task 7.4 — Tests ✅
`i18n.unit.test.ts` (13 tests). Suite total: 100 passing.

---
## Phase 8 - Submission readiness
### Task 8.1 - Specs folder and licence
`.kiro/specs/necrocrew/` now holds `requirements.md` (new), `design.md` and `tasks.md` (moved from the repo root). MIT `LICENSE` added, `license` set in `package.json`.
### Task 8.2 - Death March effect
The crimson pulse (`.death-march`) is applied to a quest row that is overdue or forecast late, to the Forecast panel when the predicted date is after the deadline, and to the studio floor while any quest is overdue. It stops as soon as the condition clears and is off for reduced motion.
### Task 8.3 - Creator editing and drag-and-drop
Grimoire: "Edit levels (demo mode)" sets any skill level directly (`setSkillLevel`). Studio: a creator can be added to the selected quest by click or by dragging onto the Assignment panel (`addMember`, takes the skills they qualify for and their free time). Tests: `store.unit.test.ts`.
### Task 8.4 - README, CI, default language
README explains how Kiro was used. `.github/workflows/ci.yml` runs type check, lint, tests and build. The UI always starts in English (the saved choice is restored after load).
### Task 8.5 - Still to do by the owner
1. Commit and push to a public GitHub repository (`.kiro/` included).
2. Deploy to Vercel and put the URL in the README.
3. Record the 3-minute demo video and link it in the README.
4. Add `.kiro/settings/mcp.json` (example in the README); the assistant was not allowed to write that folder.
5. Tick the manual-check rows in the Completion Checklist after looking at them in a browser.
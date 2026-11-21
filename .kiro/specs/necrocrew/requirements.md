# NecroCrew — Requirements

Source brief: `spec.md` (Japanese). This file restates it as testable requirements, in the order Kiro specs use: requirements → `design.md` → `tasks.md`.

Terms: a **creator** is a team member, a **quest** is a project, **banished** means completed, **funds** are the studio's money in gold (G).

## R1. Skills and creators

**User story:** As a studio lead, I want to see who can do what, so that I can staff quests well.

1. The system shall define six skills: AR, VR, 3D Modeling, 2D UX Design, Video Editing, Director. Each creator has a level from 0 to 5 in each.
2. The system shall load eight creators at start-up. Each has a name, a title, a main role, a capacity (default 100%), an efficiency (default 1.0) and a daily salary.
3. The Grimoire page shall show a heat map of all creators and skills, and shall warn about any skill where nobody is above level 2.
4. When the player opens a creator, the system shall draw a six-axis radar chart of that creator's levels.
5. The player shall be able to change a creator's skill level, either by paying for training in the game or by editing the level directly (demo mode).

## R2. Quests

**User story:** As a player, I want quests to try, so that I can start playing in one click.

1. A quest has a title, required skill streams (skill, minimum level, workload in person-days, headcount), a start date, a deadline, a priority (Critical, High, Normal) and a status (Pending, Simulating, Active, Banished).
2. The system shall load six quests at start-up. Three start on day 0 and three arrive later.
3. The Quests page shall offer three one-click presets: AR promotion, VR exhibition, PR video.
4. The player shall be able to register a new quest with a form.

## R3. Automatic squad assignment

**User story:** As a player, I want a good squad suggested, so that I do not have to staff by hand.

1. When the player presses "Summon Optimal Squad", the system shall assign creators to the selected quest in one of three modes: Balanced (spread the load), Speedrun (the strongest creators at full time) or Minimal Squad (fewest people, using multi-skill creators).
2. The system shall never assign a creator beyond that creator's capacity across all quests.
3. If no creator is eligible, the system shall report that in the interface and shall not change the assignments.

## R4. Simulation and what-if

**User story:** As a player, I want to see the effect of a change at once.

1. The system shall compute daily output as allocation × efficiency × skill coefficient and shall predict a completion date.
2. When the predicted date is after the deadline, the system shall show a Death March warning with a pulsing crimson effect, and shall stop it when the date moves back inside the deadline.
3. When the player moves an allocation slider, removes a creator, or changes mode, the burndown chart and the predicted date shall update within one frame.
4. The player shall be able to change who works on a quest by dragging a creator onto it or by using the controls.
5. A finite, positive workload with a positive allocation shall always finish in finite days.

## R5. Campaign game

**User story:** As a player, I want goals and consequences, so that the choices matter.

1. The campaign lasts 60 days. The player can play, pause, step one day, and choose 1x, 2x, 4x or 8x.
2. The player wins by reaching 110,000 G. The player loses by going below zero funds, by finishing every quest short of the goal, or by running out of days.
3. A finished quest pays workload × 350 G × a priority factor. Finishing early adds 2% of the reward per day (up to 10 days). Finishing late costs 4% per day (up to 50%).
4. Creators are paid a daily salary, scaled by allocation, while their quest streams have work left.
5. The player can pay to train one skill by one level. The creator cannot work for 2 days.
6. Creators walk between rooms on the studio floor and show whether they work, train or wait.
7. Chained quests give a combo bonus, random incidents occur, the result gets a rank and an MVP.

## R6. Look, feel and sound

1. The interface shall be dark, with neon green, specter purple and crimson accents, and shall stay easy to read (WCAG AA contrast, minimum 14 px text).
2. Auto-assign and banishing a quest shall trigger a short particle effect. Sound effects shall be generated in the browser and shall be switchable off at any time.
3. The system shall respect `prefers-reduced-motion`.
4. Below 768 px wide, the system shall show a "best on desktop" notice.

## R7. Language

1. The interface shall be available in English and Japanese. English is the default.
2. The player's choice shall be remembered between visits.

## R8. Delivery and Kiro usage

1. The repository shall be public, shall contain `.kiro/` (specs, hooks, steering) and shall carry an open-source licence.
2. A public URL shall let a judge try the game without logging in.
3. The assignment and simulation engines shall be covered by property-based tests (`fast-check`, at least 200 runs per property): total allocation never exceeds capacity, and a positive workload with positive allocation finishes in finite time.
4. Saving a source file shall run lint and tests through agent hooks.
5. The engines shall also be reachable as an MCP server (Kiro Crew) and as an HTTP API.

## Traceability

| Requirement | Main code | Tests |
|---|---|---|
| R1 | `src/data/seed.ts`, `components/grimoire/`, `components/charts/RadarChart.tsx` | `engines.unit.test.ts` |
| R2 | `src/data/seed.ts`, `components/quests/` | `gameEngine.unit.test.ts` |
| R3 | `src/lib/assignmentEngine.ts` | `assignmentEngine.pbt.test.ts` |
| R4 | `src/lib/simulationEngine.ts`, `components/simulator/`, `components/game/QuestForecast.tsx` | `engines.unit.test.ts`, `assignmentEngine.pbt.test.ts` |
| R5 | `src/lib/gameEngine.ts`, `src/lib/gameConfig.ts`, `components/game/` | `gameEngine.unit.test.ts`, `gameEngine.pbt.test.ts`, `gameExtras.unit.test.ts` |
| R6 | `src/styles/tokens.css`, `src/lib/sound.ts`, `components/art/` | manual check |
| R7 | `src/data/i18n.ts`, `src/hooks/useL10n.ts` | `i18n.unit.test.ts`, `guide.unit.test.ts` |
| R8 | `.kiro/`, `src/mcp/`, `src/app/api/` | `tools.unit.test.ts` |

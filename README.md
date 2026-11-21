# NecroCrew: Phantom Squad

A studio-management game and resource planner, dressed as a dark-fantasy "Necro-Studio". You run a creative studio for 60 days. Pick the right phantom creators for each cursed quest, watch them walk to their rooms and work, and grow the studio's funds from 20,000 G to 110,000 G before the full moon.

Built for **Kiroween 2026** (Costume Contest) with Kiro: specs, steering, hooks, property-based tests and an MCP server.

- Live demo: _add the Vercel URL here after deploying_
- Demo video (3 min): _add the link here_
- English and Japanese UI (switch in the nav bar). 日本語に対応しています。

## Try it in 30 seconds

1. Open **Studio**. Three quests are already waiting.
2. Pick a quest on the Quest Board, then press **Summon Optimal Squad**. Do this for each quest.
3. Press **Play**. Creators walk to their rooms, quests get banished, funds grow.

New here? The **How to Play** page explains every rule, and **About** introduces the game and the eight creators.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit + property-based tests (fast-check)
npm run build      # production build
```

## How Kiro was used

| Kiro feature | What it does here |
|---|---|
| **Spec-driven development** | `.kiro/specs/necrocrew/` holds `requirements.md` → `design.md` → `tasks.md`. Tasks were done in order and ticked off in `tasks.md`. |
| **Property-based testing** | `fast-check` properties for the assignment and simulation engines (capacity never exceeded, finite completion, monotonicity, zero-skill guard) and for the game engine (money conserved, work only goes down, rewards paid once, forecast honest, determinism). 200 runs each. See `src/lib/__tests__/*.pbt.test.ts`. |
| **Steering** | `.kiro/steering/` has the coding conventions and the Halloween UI guidelines (colours, glow, motion, sound, accessibility). |
| **Agent hooks** | `.kiro/hooks/` runs ESLint on every saved source file and the tests whenever `src/lib/` changes. |
| **Kiro Crew / MCP** | `npm run mcp` starts a stdio MCP server with two tools. The setup is in the MCP section below. |

Test status: 100 tests pass (`npm test`). CI runs type check, lint, tests and build (`.github/workflows/ci.yml`).

## The game in one paragraph

A 60-day campaign. Staff each quest with the right creators, press Play, and watch them work. Finished quests pay a reward (early bonus, late penalty, combos), salaries are charged daily, random incidents shake things up, and you can spend funds on training. Reach 110,000 G to win. You get a rank from S to C and an MVP. Rules and numbers live in `src/lib/gameConfig.ts`; the How to Play page reads the same numbers, so they cannot drift.

## Project layout

| Path | Purpose |
|---|---|
| `spec.md` | Original brief (Japanese) |
| `.kiro/specs/necrocrew/` | `requirements.md`, `design.md`, `tasks.md` |
| `.kiro/` | Steering, hooks, MCP settings |
| `src/lib/` | Pure engines: assignment, simulation, game |
| `src/lib/__tests__/` | Unit tests and property-based tests |
| `src/store/` | The single Zustand store |
| `src/data/` | Seed data, UI text (English / Japanese), creator profiles, guide |
| `src/app/`, `src/components/` | Next.js App Router UI |
| `src/mcp/` | Kiro Crew tool adapter and stdio MCP server |
| `public/assets/` | Game sprites and scenes, sliced from the source sheets (committed so the app runs) |

`npx tsx scripts/balance.ts` plays each assignment mode on autopilot and prints the result. It is the quickest way to check a balance change.

## Art assets

The game uses the images in `public/assets/`, which are committed, so `npm run dev` and the deploy need nothing else.

The original art sheets (`img/character.png`, `img/material.png`, `img/companyhouse.jpg`, `img/quest.png`, `img/title.jpg`) are not published. Only the authors can re-run the slicing step, with the sheets placed in `img/`:

```bash
cd scripts && npm install && cd ..
npm run assets
```

The script also writes `scripts/preview/contact-sheet.png`, a contact sheet on the app background, to check the crops by eye. Crop rectangles are in `scripts/slice-assets.mjs`.

## Kiro Crew / MCP

`npm run mcp` starts a stdio MCP server with two tools:

- `necrocrew_assign` `{ projectId, mode }`: auto-assign a squad and simulate.
- `necrocrew_simulate` `{ projectId, assignments }`: simulate given assignments.

Project ids: `haunted-mall-webar`, `cyber-ghost-vr`, `specter-promo-video`, `phantom-museum-ar`, `moonlit-concert`, `grave-shift-launch`.
Modes: `Balanced`, `Speedrun`, `Minimal Squad`.
`npm run mcp:check` starts the server, calls both tools through the MCP client and prints the results.

To use it from Kiro, add this to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "necrocrew": {
      "command": "npm",
      "args": ["run", "--silent", "mcp"],
      "autoApprove": ["necrocrew_assign", "necrocrew_simulate"]
    }
  }
}
```n
## HTTP API

- `POST /api/assign` with `{ "projectId": "cyber-ghost-vr", "mode": "Speedrun" }`
- `POST /api/simulate` with `{ "projectId": "...", "assignments": [...] }`

Errors return `{ "error": { "code", "message" } }` with status 422.

## Deploy (Vercel)

1. Push the repository to GitHub (public). Keep `.kiro/` committed.
2. Import it in Vercel. The defaults for Next.js work, and no environment variables are required.
3. Open the URL and check the three Quick Summon buttons on `/quests`.

`scripts/` has its own `package.json` and is excluded from the app build.

## License

- **Code**: MIT, Copyright (c) 2026 UNITECHLAB. See `LICENSE`.
- **Artwork** (`public/assets/`): Copyright (c) 2026 UNITECHLAB. All rights reserved. It is included so the game can be run and judged; it is not under the MIT licence.

# NecroCrew: Phantom Squad

A staffing and deadline planner for a small creative studio — who works on what, for which client, by when — with a costume on: a dark-fantasy "Necro-Studio" where client projects are cursed quests, deadlines are the full moon, and the roster is eight phantom creators. The planning problem underneath is real: match skills to work, keep everyone under 100% allocation, hit deadlines, and keep the studio solvent while salaries and late penalties run against the clock.

You can play it as a 60-day campaign (grow funds from 20,000 G to 110,000 G before time runs out), or use the same assignment and simulation engine headlessly through the MCP server or the HTTP API — the auto-assign and burndown-forecast logic that drives the game is also a standalone planning tool with no UI required.

Built for **Kiroween 2026** (Costume Contest) with Kiro: specs, steering, hooks, property-based tests and an MCP server.

## Costume, mapped to function

Every piece of theming stands for a real planning concept; the costume is not decoration layered on top, it is the UI.

| In the story | In the planner |
|---|---|
| Phantom creator | Team member with skills, a daily rate and a capacity limit |
| Cursed quest | Client project: required skills, workload, deadline, priority |
| Summon Circle | Where unassigned people wait between projects |
| Full moon / deadline | The date work must be done by, with an early bonus and a late penalty either side of it |
| Summon Optimal Squad | One-click auto-staffing, in three modes (balanced load, fastest delivery, fewest people) |
| Banished | Project delivered: streams finished, payment released |
| Death March pulse | The one deadline-risk indicator allowed to animate continuously, and only while the risk is real |
| Grimoire / skill levels | Skill matrix and training (raising a skill costs money and time, same as in a real studio) |

- Live demo: https://unitechlab.app/linkageruler/phantomsquad/
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
```

## HTTP API

- `POST /api/assign` with `{ "projectId": "cyber-ghost-vr", "mode": "Speedrun" }`
- `POST /api/simulate` with `{ "projectId": "...", "assignments": [...] }`

Errors return `{ "error": { "code", "message" } }` with status 422.

## Deploy (Vercel)

1. Push the repository to GitHub (public). Keep `.kiro/` committed.
2. Import it in Vercel. The defaults for Next.js work, and no environment variables are required.
3. Open the URL and check the three Quick Summon buttons on `/quests`.

`scripts/` has its own `package.json` and is excluded from the app build.

## Deploy as a static site (Cloudflare Pages and similar)

```bash
npm run build:static            # site at the root of a domain: https://example.com/
npm run build:static -- /game    # site in a sub-folder: https://example.com/game/
```

This writes the finished site to `out/`. Upload the **contents of `out/`** to any static host. For Cloudflare Pages, choose Direct Upload and drop the folder, or run `npx wrangler pages deploy out`.

- **The sub-folder name must match where you put the files.** Files built for `/game` only work under `/game/`. If the page shows unstyled text, the build and the folder do not match: rebuild with the right name.
- A static site has no server, so `/api/assign` and `/api/simulate` are not available there; the game does not use them.
- `npm run build` and Vercel are unchanged.

## License

MIT, see `LICENSE`. The artwork is not covered by it; see `NOTICE.md`.

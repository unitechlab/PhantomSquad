# NecroCrew — Coding Conventions

These rules apply to every file in this repository. Kiro must follow them when generating or editing code.

---

## Language & Runtime

- **TypeScript strict mode** — `tsconfig.json` must include `"strict": true`. Never use `any`; prefer `unknown` and narrow with type guards.
- **Next.js 14 App Router** — use Server Components by default. Add `"use client"` only when the component requires browser APIs or React hooks (`useState`, `useEffect`, event handlers).
- **Node.js ≥ 18** — use native `fetch`, `structuredClone`, and `crypto.randomUUID()` instead of polyfills.

---

## Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| React component | PascalCase file + export | `BurndownChart.tsx` |
| Hook | `use` prefix, camelCase | `useNecroCrew.ts` |
| Utility / engine | camelCase file | `assignmentEngine.ts` |
| Type / Interface | PascalCase | `SimulationResult` |
| Enum-like const | SCREAMING_SNAKE | `SKILL_CATEGORIES` |
| CSS class (Tailwind) | kebab-case tokens only | `bg-void`, `text-ecto` |
| Test file | `*.unit.test.ts` or `*.pbt.test.ts` | `assignmentEngine.pbt.test.ts` |

---

## File & Directory Structure

- Keep all source files under `/src`.
- Co-locate tests with the code they test: `src/lib/__tests__/`.
- One component per file. No barrel `index.ts` files unless the directory has ≥ 5 exports.
- Engine logic (`src/lib/`) must be pure TypeScript with no React imports.

---

## Functions & Logic

- **Pure functions first** — engine functions (`assignmentEngine.ts`, `simulationEngine.ts`) must be pure: same input always produces same output, no side effects.
- **Guard all division** — before any division, assert the divisor is `> 0`. Throw a typed `EngineError` otherwise; never return `NaN` or `Infinity` as a valid result.
- **Explicit return types** — all exported functions must declare their return type.
- **Early returns** — prefer early-return guards over deeply nested `if` blocks.
- **No magic numbers** — extract constants with descriptive names (e.g. `MAX_SIMULATION_DAYS = 1825`).

```typescript
// ✅ Good
export function computeEstimatedDays(
  totalWorkload: number,
  dailyOutput: number,
): number {
  if (dailyOutput <= 0) throw new EngineError('Daily output must be positive');
  return totalWorkload / dailyOutput;
}

// ❌ Bad
export function calc(w: number, d: number) {
  return w / d;
}
```

---

## State Management (Zustand)

- One store: `src/store/useNecroCrew.ts`. Never create additional stores.
- Actions must be defined inside the store (`set` calls only inside the store creator).
- Components read state via fine-grained selectors to avoid unnecessary re-renders:
  ```typescript
  const members = useNecroCrew(s => s.members); // ✅
  const store   = useNecroCrew();               // ❌ subscribes to entire store
  ```

---

## Styling

- Use **Tailwind utility classes** for layout, spacing, and typography.
- Use **CSS custom properties** (`var(--color-ecto)`) for branded colours — never hard-code hex values in JSX.
- Do not write plain CSS files except `globals.css` and `tokens.css`.
- All glow effects must reference `--glow-*` variables, not inline `box-shadow` strings.

---

## Testing Requirements

### Unit tests (`*.unit.test.ts`)
- Cover every exported function in `src/lib/`.
- Minimum: happy path + at least one edge/error case per function.
- Use `describe` blocks aligned with the function name.

### Property-based tests (`*.pbt.test.ts`)
- Required for `assignmentEngine.ts` and `simulationEngine.ts`.
- Use `fast-check` (`fc.assert` + `fc.property`).
- Each property must run ≥ 200 examples (`{ numRuns: 200 }`).
- Arbitraries must be defined as named functions (e.g. `arbMember()`) — no inline `fc.record` calls longer than 5 lines.
- Properties must be self-documenting: add a one-line comment above each `fc.assert` block naming the invariant.

### General
- Tests must not share mutable state — use `beforeEach` to reset.
- No `console.log` in test files.
- Never use `test.skip` or `it.skip` in committed code.

---

## Error Handling

- Define typed errors in `src/types/index.ts`:
  ```typescript
  export class EngineError extends Error {
    constructor(message: string, public readonly code: string = 'ENGINE_ERROR') {
      super(message);
      this.name = 'EngineError';
    }
  }
  ```
- API routes (`src/app/api/`) must catch `EngineError` and return a structured `{ error: { code, message } }` JSON with the appropriate HTTP status.
- Never expose raw stack traces to the client.

---

## Accessibility & Performance

- Every interactive element must have an accessible name via `aria-label`, `aria-labelledby`, or visible text.
- Images and SVG icons need `alt` text or `aria-hidden="true"` if decorative.
- Avoid `useEffect` for data that can be derived — use `useMemo` or Zustand selectors.
- Debounce slider `onChange` handlers at 16 ms to stay within a single animation frame.

---

## Commits & PRs

- Commit messages: `type(scope): description` — e.g. `feat(engine): add Minimal Squad mode`.
- Types: `feat`, `fix`, `test`, `refactor`, `style`, `chore`, `docs`.
- Every PR must have green CI (lint + unit + PBT) before merge.
- Do not commit `node_modules/`, `.next/`, or `*.env` files.

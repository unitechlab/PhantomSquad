# NecroCrew — Halloween UI Design Guidelines

These guidelines define the visual and interaction language for NecroCrew. Every UI decision must align with the **"Necro-Studio"** concept: a dark, professional production environment that feels genuinely eerie while remaining immediately usable by a first-time visitor.

Kiro must follow these guidelines when generating component code, choosing Tailwind classes, or describing animations.

---

## 1. Concept: "Dark Professional"

The UI is not a costume party. It is a *high-stakes wartime operations centre* that happens to be haunted. Every design choice must serve two masters simultaneously:

- **Business tool**: information hierarchy is clear, actions are obvious, errors are unmistakable.
- **Halloween atmosphere**: the darkness, the glows, and the occasional particle burst make the tool feel alive and slightly dangerous.

When these two goals conflict, **usability wins**.

---

## 2. Colour System

All colours are defined as CSS custom properties in `src/styles/tokens.css`. Use these tokens exclusively — never hard-code hex values.

### Palette

| Token | Hex | Role |
|---|---|---|
| `--color-void` | `#0a0a0f` | Page background (deepest black) |
| `--color-crypt` | `#12121e` | Card / panel background |
| `--color-shadow` | `#1e1e32` | Elevated surface, modal backdrop |
| `--color-ecto` | `#39ff14` | Primary CTA, active state, skill level 5 |
| `--color-specter` | `#9b59b6` | Secondary actions, VR skill accent |
| `--color-crimson` | `#c0392b` | Danger, Death March warning, over-deadline |
| `--color-bone` | `#e8e0d0` | Primary body text |
| `--color-ash` | `#8a8a9a` | Secondary text, disabled state, grid lines |

### Colour Usage Rules

1. **Text on dark backgrounds** — always `--color-bone` for primary content, `--color-ash` for metadata.
2. **Neon accents sparingly** — ecto green appears only on interactive/active elements. Overuse kills the contrast.
3. **Crimson for danger only** — never use `--color-crimson` for neutral UI chrome; reserve it exclusively for warnings and errors.
4. **Skill level to colour mapping**:
   - Level 0 → `--color-shadow` (effectively invisible)
   - Level 1–2 → `--color-specter` at 40% opacity
   - Level 3–4 → `--color-specter` at 100% opacity
   - Level 5 → `--color-ecto` (specialist highlight)

---

## 3. Typography

- **Font**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`). No web fonts required — avoids flash of invisible text in the demo.
- **Headings**: uppercase, letter-spacing `0.08em`, `--color-bone`.
- **Member titles / flavour text**: italic, `--color-specter`.
- **Numbers / data**: monospace (`'Courier New', monospace`), `--color-ecto` for positive values, `--color-crimson` for negative/over-budget values.
- **Minimum font size**: 14 px. Never go smaller.

---

## 4. Glow Effects

Glow is the primary decorative tool. Apply it only to elements that communicate state or importance.

```css
/* Available glow tokens */
--glow-ecto:    0 0 8px #39ff14, 0 0 24px #39ff1440;
--glow-specter: 0 0 8px #9b59b6, 0 0 24px #9b59b640;
--glow-crimson: 0 0 8px #c0392b, 0 0 24px #c0392b40;
```

### When to apply glow

| Element | Glow | Trigger |
|---|---|---|
| Primary button | `--glow-ecto` | Always (resting state) |
| Navigation tab | `--glow-ecto` | Active tab only |
| Radar chart polygon | `--glow-specter` | Always |
| HP bar (healthy) | `--glow-ecto` | >50% workload remaining |
| HP bar (critical) | `--glow-crimson` | ≤25% workload remaining |
| Death March warning border | `--glow-crimson` | Pulsing, `animation: pulse 1.5s ease-in-out infinite` |
| Assignment row (selected) | `--glow-specter` | On hover/focus |

### Never apply glow to

- Body text, labels, or input placeholders.
- Disabled buttons or inactive states.
- More than 3 elements simultaneously on the same screen.

---

## 5. Layout & Spacing

- **Base unit**: 4 px (Tailwind default). Use multiples: 4, 8, 12, 16, 24, 32, 48.
- **Card border**: 1 px solid `--color-shadow`, `border-radius: 8px`.
- **Panel border**: 1 px solid `--color-specter` at 30% opacity for primary panels.
- **Content width**: max 1 280 px centred. Never full-bleed on wide screens.
- **Grid gap**: 16 px between cards, 24 px between major sections.

---

## 6. Animation Guidelines

Animations must be **purposeful and brief**. Each animation communicates a state change; it is not decoration.

### Rules

1. **Duration**: UI transitions 150–250 ms. Celebratory effects 500–800 ms. Never exceed 1 s for a transition.
2. **Easing**: use `ease-out` for entering elements (snap into place), `ease-in` for exiting (fade away).
3. **No auto-playing loops** except the Death March crimson pulse — and that loop must stop when the warning is resolved.
4. **Respect `prefers-reduced-motion`** — wrap all Framer Motion animations in a check:
   ```typescript
   const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const transition = prefersReduced ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' };
   ```

### Animation Catalogue

#### Radar Chart Draw-in
- Trigger: modal opens.
- Mechanism: SVG `stroke-dasharray` = total path length; animate `stroke-dashoffset` from full length → 0.
- Duration: 800 ms, `ease-out`.
- Effect: axes and skill polygon appear to draw themselves.

#### Auto-Assign Particle Burst
- Trigger: "Summon Optimal Squad" completes.
- Mechanism: 20 small circles (`4px × 4px`, `--color-ecto`) explode radially from the button centre.
- Framer Motion: staggered `y: -80` and `opacity: 0` exits, stagger 0.02 s.
- Duration: 600 ms total. Remove from DOM after.

#### Banished Celebration
- Trigger: `SimulationResult.isOverDeadline === false` and project status set to `'Banished'`.
- Mechanism: green particle sweep across the quest card + chime sound.
- Do not repeat if the user triggers the same result twice.

#### Death March Pulse
- Trigger: `SimulationResult.isOverDeadline === true`.
- Mechanism: `ResultPanel` border cycles `--glow-crimson` on/off every 1.5 s.
- Must stop when the user adjusts assignments until `isOverDeadline` becomes false.

#### Rate Slider → Chart Update
- No animation on the chart itself — the update is instant (debounced 16 ms).
- The slider thumb glows ecto on drag.

#### Page Transitions
- Framer Motion `AnimatePresence` with `opacity: 0 → 1` and `y: 10 → 0`, 200 ms.

---

## 7. Component-Specific Guidelines

### HP Bar
- Render as a horizontal bar inside a `--color-shadow` trough.
- Fill colour: `--color-ecto` above 50%, `--color-specter` 25–50%, `--color-crimson` below 25%.
- Animate fill width change with `transition: width 300ms ease-out`.
- Always show the numeric workload alongside: `42 / 180 person-days`.

### Skill Heatmap Cell
- Background: interpolate between `--color-shadow` (level 0) and `--color-ecto` (level 5) using CSS `opacity` on a coloured overlay.
- Level 0 cells: show a small skull icon (`💀`) at 40% opacity to indicate a gap.
- Minimum cell size: 48 × 48 px for touch accessibility.

### Radar Chart
- Six equal axes for the six `SkillCategory` values.
- Background grid: 5 hexagonal rings at levels 1–5, stroked with `--color-ash` at 20% opacity.
- Member polygon: filled `--color-specter` at 25% opacity, stroked `--color-specter` at full opacity.
- Axis labels: `--color-ash` at 12 px. Bold the axis corresponding to the member's `mainRole`.

### Quest Card
- Status badges:
  - `Pending` → `--color-ash` background
  - `Simulating` → `--color-specter` background, pulsing (slow, 2 s)
  - `Active` → `--color-ecto` background
  - `Banished` → strikethrough title, `--color-ash` text, skull icon
- Priority badges:
  - `Critical` → `--color-crimson`
  - `High` → `--color-specter`
  - `Normal` → `--color-shadow` with `--color-bone` text

### Burndown Chart
- Background: `--color-crypt`.
- Line colour: `--color-ecto`.
- Deadline `ReferenceLine`: dashed, `--color-crimson`, labelled "Deadline 🌕".
- Axis text: `--color-ash`, 12 px.
- Over-deadline segment (line after deadline): `--color-crimson`.

---

## 8. Sound Design

Sound is **optional and muted by default**. The mute toggle must be persistently visible.

| Event | Sound | Character |
|---|---|---|
| Banished | Chime (C5–E5–G5 arpeggiated) | Bright, resolving |
| Death March detected | Low drone pulse | Ominous, slow |
| Assign button clicked | Soft whoosh | Neutral, quick |

Implement via Web Audio API (no audio files required — generate tones programmatically). All sounds < 500 ms except the drone, which loops and must be stopped on resolution.

---

## 9. Responsive Breakpoints

| Breakpoint | Min width | Layout change |
|---|---|---|
| Desktop (primary) | 1 280 px | Two-column simulator layout |
| Tablet | 768 px | Single-column; charts above assignment list |
| Mobile (not supported) | < 768 px | Show "Best experienced on desktop" banner |

---

## 10. Accessibility Checklist

Before every component is considered done:

- [ ] All buttons have an accessible name.
- [ ] All form inputs have a `<label>` or `aria-label`.
- [ ] Colour is not the only means of conveying information (add icons or text alongside colour-coded status).
- [ ] Keyboard navigation works: Tab moves focus, Enter/Space activates buttons.
- [ ] Focus ring visible (do not remove `outline` without replacement).
- [ ] Animation respects `prefers-reduced-motion`.

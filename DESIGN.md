# Design

Visual system for the Janar Kuusk portfolio (`janarkuuskpro.com`). Documented from
the shipped implementation, not from intent — every value below is read out of
`src/app/[lang]/globals.css`, the component tree, or measured in a browser.

Internal codename in the token block: **Imperial Architect**.

## Theme

Dark, committed. Near-black surfaces with a single high-chroma orange accent and
a monochrome photographic treatment. Not "dark mode" as a toggle — there is no
light theme, and the darkness is the brand. Photography is grayscale by default
and only saturates on hover, so colour arrives as an event rather than a state.

Register: **brand** — the site sells the work by being an example of it.

## Color

Defined as Tailwind v4 `@theme` tokens.

| Token | Value | Role |
|---|---|---|
| `--color-accent` | `#FF4800` | Single accent. Links, active states, focus rings, key words in headlines |
| `--color-surface` | `#0D0D0D` | Body background |
| `--color-surface-low` | `#050505` | Recessed panels, nav pill backgrounds |
| `--color-surface-mid` | `#141414` | Raised blocks |
| `--color-surface-high` | `#1c1c1c` | Highest elevation |
| `--color-outline` | `#262626` | Borders, hairlines |

Ink ramp (Tailwind zinc, on `#0D0D0D`):

| Use | Value | Contrast |
|---|---|---|
| Body / primary | `#EDEDED` | 16.60:1 |
| Secondary prose | `zinc-300` `#d4d4d8` | 13.15:1 |
| Muted prose | `zinc-400` `#a1a1aa` | 7.58:1 |
| Tertiary label | `zinc-500` `#71717a` | 4.02:1 |
| Decorative only | `zinc-600` `#52525b` | 2.51:1 |
| Form placeholder | `#7b7b80` | 4.62:1 |
| Accent on surface | `#FF4800` | 5.72:1 |

**Rule:** `zinc-600` and below are decorative — numerals, dividers, watermark
type. They must not carry prose. Anything a visitor has to read sits at
`zinc-400` or lighter.

Hairlines (`#2e2e2e`, 1.43:1) are structural, not text, and are exempt.

## Typography

Four families, paired on a genuine contrast axis (geometric-technical vs.
grotesque) rather than two similar sans-serifs.

| Family | Source | Use |
|---|---|---|
| Eurostile Extended | local `.ttf` | Hero name only. The signature voice |
| Eurostile | local `.otf` | Hero role words |
| Manrope | next/font/google | All headings, form inputs, display numerals |
| Space Grotesk | next/font/google | Body text and every `.lbl` micro-label |

Material Symbols Outlined supplies iconography.

### Scale

All display type is fluid via `clamp()` and uppercase.

| Class | Size | Tracking | Leading |
|---|---|---|---|
| `.hero-name` | `clamp(38px, 11vw, 175px)` | `-0.04em` | 0.9 |
| `.hero-text` | `clamp(52px, 13vw, 185px)` | `-0.04em` | 0.92 |
| `.hero-role` | `clamp(22px, 5vw, 72px)` | `+0.15em` | 1.1 |
| `.display-lg` | `clamp(40px, 6vw, 80px)` | `-0.03em` | 1.05 |
| `.headline` | `clamp(28px, 4vw, 48px)` | `-0.02em` | 1.15 |
| `.lbl` | `11px` fixed | `+0.12em` | — |

Letter-spacing floor is `-0.04em`, exactly at the point where extended-width
letterforms still breathe.

**Estonian is the constraint language.** Compounds like `NUMBRITESSE.`,
`MONUMENTAALSET?` and `DIGITAALKOGEMUS` are single unbreakable words that
overflow any fixed heading size English survives. Headings that take user copy
use a `vw` unit below `sm` (`text-[8vw]`, `text-[11vw]`) rather than a fixed
step, so they fit by construction. Test every heading at 320px in Estonian.

## Layout

- Page container: `max-width: 1440px`, `margin-inline: auto`, `padding-inline: 2rem` (`px-8`)
- Section rhythm: `py-40` for major sections, `py-20`/`pb-28` for heroes
- Grid: 12-column at `md` and up. **`gap-x` must be 0 below `md`** — twelve
  columns with a 32px gap force a 352px minimum, wider than the 311px available
  on a 375px phone
- `.arch-line` is a full-bleed 1px `#2e2e2e` rule and sets `width: 100%`. Inset
  it with padding on a wrapper, never `mx-*` on the rule itself
- Cards are avoided. Content sits on hairline-separated bands and `gap-px` grids
  that expose the `zinc-900` background as a 1px seam

### Breakpoints

Tailwind defaults. `md` (768px) does most of the work; `lg` (1024px) is the
navigation switch.

**The nav flips to its desktop layout at `lg`, not `md`.** Estonian
"KONSULTATSIOON" plus the language switcher measures 970px and is clipped in a
768px viewport.

### Z-index

Semantic, per-surface, no arbitrary 9999s in layout:

| Layer | Value |
|---|---|
| Hero video background | 1 |
| Hero name | 5 |
| Hero role words | 10 |
| Hero portrait | 20 |
| Mobile legibility scrim | 25 |
| Hero foreground UI | 30 |
| Grain overlay | 30 |
| Sticky nav | 50 |
| Mobile menu overlay | 60 |

The custom cursor sits at 9999 by necessity — it must clear everything.

## Motion

Two curves, no more:

- `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` — the signature. Every
  entrance, reveal and image transition
- `--ease-press: cubic-bezier(0.23, 1, 0.32, 1)` — `.press:active` scale to
  0.97 at 160ms

No bounce, no elastic, no spring.

| Pattern | Behaviour |
|---|---|
| `.hi` / `.hi-d1..d4` | `fadeUp` 1s, staggered 0.2s / 0.45s / 0.7s / 0.95s |
| `.hi-mask` | `maskUp` 1.1s — clip-path curtain for page headlines |
| Framer `Reveal` / `StaggerReveal` | Viewport-triggered, 0.13s stagger |
| `.proj-img` | Grayscale to colour + `scale(1.04)` over 0.65s |
| `.stack-bg` | Offset shadow-block slides 16px → 22px on card hover |
| `.marquee-track` | 38s linear infinite, pauses on hover |

`prefers-reduced-motion: reduce` collapses all animation and transition to
0.01ms, disables smooth scroll, and restores the native cursor.

## Components

| Component | Notes |
|---|---|
| `Nav` | Sticky, `lg` breakpoint, full-screen mobile overlay |
| `HeroSection` | Layered composition: video, name, split role words, cut-out portrait, scrim, foreground UI |
| `HeroVideoBg` | Mux-hosted loop at 75% opacity mobile / 80% desktop, with a static image fallback on error |
| `Cursor` | Custom cursor; `* { cursor: none }` only under `(hover: hover) and (pointer: fine)` |
| `Marquee` | Infinite horizontal band, hover-pause |
| `StatsCounter` | Count-up numerals with one text-only stat |
| `Testimonials` | Grid adapts to item count — a single quote uses `max-w-2xl`, never a 3-col grid with dead cells |
| `Reveal` | Scroll-triggered wrapper, animation-based so it survives headless render |
| `Footer`, `Analytics`, `MdxContent` | Supporting |

### Signature treatments

- `.ghost` — 1px `#2e2e2e` border that turns accent on hover. The default affordance
- `.text-stroke` — 1.5px outlined transparent type, used for the second line of the name
- `.grain` — SVG fractal-noise overlay at 3.5% opacity
- `.form-field` — bottom-rule-only inputs at `clamp(20px, 3vw, 40px)` uppercase Manrope

## Accessibility

- Focus: `2px solid var(--color-accent)` at `3px` offset, never removed
- Reduced motion fully honoured, including cursor restoration
- Body text meets 4.5:1; see the ink ramp rule above
- `body { overflow-x: hidden }` means horizontal overflow *clips* rather than
  scrolls, so it hides silently. Measure element rects against the viewport when
  checking layout; `scrollWidth` alone will not reveal it

### Known gaps

- The custom cursor hides the native pointer for fine-pointer users. Restored
  under reduced-motion, but users who want a system cursor and no motion
  preference have no escape
- ~50 `zinc-600` usages remain in labels and meta text below the 4.5:1 floor.
  Decorative by intent, but the line is not enforced anywhere

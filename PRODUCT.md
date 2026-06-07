# Portfolio Design Rules
> Julius Peschard — Design engineer portfolio
> These rules are absolute. Do not deviate from them under any circumstance.

---

## Identity

This is the portfolio of a design engineer who reasons about systems and craft, and ships the real thing. Every decision — layout, typography, color, motion — must reflect that positioning. The aesthetic target is: **Linear meets Raycast**. Flat, precise, intentional. Nothing decorative that isn't load-bearing.

---

## Typography

- **Font:** Geist (by Vercel) for both display and body. No substitutions.
- **Scale:** Use a strict type scale. Do not deviate from it for emphasis — use weight instead.
- **Weight:** Regular (400) for body, Medium (500) for labels and UI, Semibold (600) for headings. Never Bold (700) or above in the UI.
- **Line height:** 1.5 for body, 1.2 for headings. Tight. No loose leading.
- **Letter spacing:** `-0.01em` to `-0.02em` on headings only. Never tracked-out (no `letter-spacing: 0.1em` anywhere).
- **No decorative fonts.** No serif accents. No display typefaces. Typography carries meaning, not personality.

---

## Color

- **Accent:** One accent color only. Used sparingly — interactive states, active indicators, one CTA. Not scattered.
- **No gradients.** Not on backgrounds, not on text, not on borders. If you are considering a gradient: remove it.
- **No glassmorphism.** No `backdrop-filter: blur()` effects, no frosted panels.
- **No colored shadows.** No `box-shadow` with color. If a shadow exists at all, it is `rgba(0,0,0,0.x)` and nearly invisible.
- **No dark-to-light gradient backgrounds.** The background is flat. Always.

---

## Spacing & Layout

- **Grid:** 8px base unit. All spacing is a multiple of 8 (8, 16, 24, 32, 48, 64...). No exceptions.
- **Max content width:** 680px for text content. 900px absolute maximum for any layout container.
- **Margins:** Generous vertical rhythm. Let content breathe. Cramped layouts signal junior work.
- **Alignment:** Left-aligned text throughout. No centered body copy. Centered only for isolated UI elements (the floating social bar).
- **No multi-column layouts** unless the content structurally demands it. One column, strong hierarchy.

---

## Borders & Surfaces

- **Hairline borders only:** `1px solid` with low-opacity (`rgba(255,255,255,0.08)` on dark). Never `2px` borders used decoratively.
- **Border radius:** 6px for cards and containers, 999px for pills/tags. No `border-radius: 20px` on rectangular containers — that reads as mobile-app generic.
- **No card shadows.** Cards are defined by their border, not a drop shadow. If you remove the shadow and the card disappears, the card is wrong.
- **No elevated surfaces.** Everything lives on one plane. Depth is created by contrast and spacing, not elevation.

---

## Motion & Interaction

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for entrances. `ease-in-out` for state changes. Never `linear`.
- **Duration:** 120–200ms for micro-interactions (hover, focus). 300–400ms for entrances. Nothing slower unless intentional and justified.
- **Hover states:** Subtle. Opacity shift (`0.7` → `1`) or color shift. No scale transforms on text links. No `transform: scale(1.05)` on cards — that reads as template work.
- **No scroll-triggered confetti, particle effects, or cursor trails.** If an animation doesn't communicate something, remove it.
- **Page load:** One clean staggered fade-in on the content blocks. Not every element individually — group them. Two or three waves maximum.

---

## Components

### Navigation / Social bar
- Floats at bottom of viewport, centered.
- Dark pill container, flat background, hairline border.
- CTA pill sits above it, same family, differentiated by background color.
- No blur. No glow. No shadow ring.

### Project / Experience cards
- No card chrome unless absolutely necessary. Prefer structured text over boxed cards.
- If cards are used: hairline border, flat background (`#161616`), 6px radius.
- Content structure: **Title + role + dates → one-line frame → bullet decisions.** Not description blocks.
- Tech stack displayed as small muted pills at the bottom. Not the headline.

### Tags / Pills
- Monochrome. Muted border, muted text. Not colored per-tag.
- Small (`font-size: 11px`, `padding: 2px 8px`). They are metadata, not features.

### Links
- Underline on hover only. No persistent underlines in body text.
- External links: `↗` suffix, not an icon component.

---

## What is banned

These patterns are explicitly forbidden. If you find yourself implementing any of these, stop and reconsider:

- Gradients of any kind (background, text, border, overlay)
- `box-shadow` with spread or color
- `backdrop-filter: blur()`
- Glassmorphism or frosted surfaces
- Purple, indigo, or teal as accent colors (overused in AI-generated portfolios)
- Particle backgrounds, animated blobs, aurora effects
- Testimonials section
- Skills progress bars or percentage indicators
- Timeline components with vertical lines and dots
- "Download CV" as a primary CTA
- Emoji in headings or section labels
- Section headers like "About Me", "My Work", "Get In Touch" — these are template phrases
- `font-family: Inter` (too default), `font-family: 'Space Grotesk'` (AI slop signal)
- `border-radius` above 12px on non-pill elements
- Centered hero text with a subtitle and two CTA buttons side by side
- Lottie animations or SVG blob shapes as decorative elements

---

## Voice & Copy rules

These apply if you are generating or editing any copy:

- Lead with what was decided or built, not what was felt or believed.
- No "passionate about", "obsessed with", "love to", "eager to".
- Age and student status appear last, if at all. Never in the first sentence.
- Project descriptions follow: **role → decision → tradeoff**. Not: description → tech stack.
- Tradeoffs are required. A project entry without a rejected alternative is incomplete.
- Titles are flat nouns: "Design Engineer", "Lead Product Designer". Not "Creative Technologist" or "Digital Craftsman".

---

## The test

Before shipping any section, ask:
1. If I remove all the styling, does the content still communicate a design engineer who reasons?
2. Does this look like it could be a Linear or Raycast internal tool?
3. Is there anything here that exists purely because it looks nice rather than because it communicates something?

If the answer to 3 is yes: remove it.
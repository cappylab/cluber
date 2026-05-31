---
id: cluber
name: Cluber
country: KR
category: club-management
homepage: ""
primary_color: "#7C3AED"
logo:
  type: lucide
  slug: users-round
verified: "2026-05-31"
omd: "0.1"
ds:
  name: Cluber Soft-Clay UI
  type: hybrid
  description: A deliberate blend of Neumorphism (soft monochrome molded depth) and High-Fidelity Claymorphism (candy-gradient accents, super-rounded shapes, tactile bouncy motion). Calm and professional in structure, youthful and energetic in personality.
---

# Cluber Soft-Clay Design System

> A deliberate split of duties between two systems (not a 50/50 blend):
> **Claymorphism owns the palette + personality** — lavender canvas, candy-gradient accents, Nunito, super-rounded, squishy/floaty motion (this is what makes it "trẻ trung").
> **Neumorphism owns the depth physics** — soft dual-shadow surfaces, **convex 4-layer bulge** on accents, and **inset-deep carved wells** with **nested depth** (Extruded → Inset → Convex). This is what makes it tactile and "có chiều sâu".
> Result: **"trẻ trung & năng động nhưng vẫn chuyên nghiệp."**

## 1. Visual Theme & Atmosphere

Cluber feels like a soft, premium object you can press. The whole interface is **molded from one pale lavender surface** (`#F4F1FA`) — cards, headers, and inputs are not "placed on" the page, they **rise out of it or press into it** via paired soft shadows (light from top-left, cool shadow bottom-right). This is the Neumorphism base: restrained, monochrome, tactile, calm.

On top of that calm base, Claymorphism supplies the **joy**: primary actions wear a **violet→pink candy gradient**, statistic icons sit in vibrant gradient orbs, corners are **generously rounded** (28px+), and every interactive element **lifts on hover and squishes on press**. Two large blurred color blobs drift slowly behind the content at low opacity, giving ambient life without noise.

The discipline that keeps it professional: **color is rationed**. Surfaces stay monochrome; saturated color appears only on things you can act on (buttons, badges, stat orbs, focus rings). The eye reads structure from shadow and shape, and reads *meaning* from the rare bursts of color.

**Key characteristics**
- One molded lavender surface; depth comes from soft **dual shadows**, never borders.
- Candy gradient (violet→pink) reserved for primary CTAs and accents only.
- Super-rounded corners everywhere (cards 28px, buttons 18px, pills/orbs full).
- Tactile micro-motion: hover **lift**, active **squish**, inputs are **pressed wells**.
- Nunito (rounded display) + DM Sans (clean body); high-contrast charcoal text.
- Ambient blurred blobs at ~10–12% opacity — alive but never loud.
- **SVG icons only (Lucide). No emoji anywhere.**

## 2. Color Palette & Roles

### Surface (monochrome — Neumorphism)
- **Canvas** `#F4F1FA` — the single base surface; page + cards share it ("same-surface").
- **Elevated/Glass (optional)** `rgba(255,255,255,0.6)` + `backdrop-blur` — only for overlays/modals that should reveal blobs.

### Foreground
- **Text primary** `#332F3A` (soft charcoal) — body + headings. WCAG AA on canvas.
- **Text muted** `#635F69` — labels, metadata. Never lighter than this.

### Accents (candy — Claymorphism, used sparingly)
- **Primary / Violet** `#7C3AED` — brand, primary CTA, links, focus ring.
- **Violet light** `#A78BFA` — gradient start, hover.
- **Pink** `#DB2777` — gradient end, secondary emphasis.
- **Teal** `#10B981` — success / `납부` (paid) status.
- **Amber** `#F59E0B` — warning / `미납` (unpaid) status.
- **Sky** `#0EA5E9` — info, neutral stat orb.
- **Danger** `#EF4444` — destructive actions (delete) + form validation errors. Amber stays reserved for `미납`.

### Gradients
- **Primary action**: `linear-gradient(135deg, #A78BFA, #7C3AED)`.
- **Stat orbs**: per-metric gradients (violet, pink, sky, amber) `from light → saturated`.

### Shadow colors (RGBA for smooth blend)
- **Light** `rgba(255,255,255,0.9)` (top-left).
- **Dark** `rgba(174,167,193,0.55)` — cool lavender-grey matched to canvas (bottom-right).
- **Colored (clay float)** `rgba(124,58,237,0.22)` — only under accent elements.

## 3. Typography Rules

### Font families
- **Display / numbers**: **Nunito** (700/800/900) — rounded terminals = friendly.
- **Body / UI**: **DM Sans** (400/500/700).
- **Hangul fallback (critical)**: UI is Korean, but Nunito/DM Sans have no Hangul glyphs. Pair with **Pretendard** so Korean renders consistently:
  - Headings: `font-family: "Nunito", "Pretendard", sans-serif;`
  - Body: `font-family: "DM Sans", "Pretendard", sans-serif;`
  - Latin/numbers use Nunito/DM Sans; Hangul falls through to Pretendard automatically.

### Hierarchy
| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Page title / brand | Nunito | 24–28px | 800–900 | tracking-tight; brand may use gradient text |
| Section heading | Nunito | 18–20px | 800 | |
| Stat number | Nunito | 24–28px | 900 | the "hero" numbers on dashboard |
| Card / row name | DM Sans | 15–16px | 700 | |
| Body | DM Sans | 14–15px | 400–500 | |
| Label / meta | DM Sans | 12–13px | 500 | color muted `#635F69` |

### Principles
- Nunito Black (900) for numbers/headlines = maximum friendly impact.
- Gradient text only on large brand/hero text (≥20px) for readability.
- Body left-aligned; never lighter than `#635F69` for body/label text.
- Mixed number+Hangul (e.g., "24명"): give Pretendard the same weight as Nunito (both have 900) so the digits and the Hangul don't differ in weight/baseline.

## 4. Component Stylings

### Buttons
- Radius `18px` (`rounded-[18px]`); min height 44px (touch).
- **Primary**: candy gradient bg, white text, **convex 4-layer clay shadow** (bulges out, not flat).
- **Secondary**: canvas bg, charcoal text, soft dual shadow (extruded).
- **Ghost**: transparent, violet text, soft tint on hover.
- Hover `-translate-y-0.5` + deeper shadow; **active `scale-[0.96]` + inset** (squish).
- Focus: `2px` violet ring, 2px offset.

### Inputs (pressed wells — Neumorphism)
- Radius `18px`; bg canvas; **inset shadow** (recessed); prominent inputs (search) use **inset-deep** for a carved well.
- Focus: deeper inset + violet ring; placeholder `#8B7FA8` (≈3.3:1 — the ≥3:1 bar for placeholders, which are not body content).
- Error: danger ring/border `#EF4444` + helper text in danger.

### Cards / Panels
- Radius `28px` (panels up to `32–40px`); bg canvas; soft dual shadow (extruded).
- Hover (interactive cards): `-translate-y-1` + hover shadow.
- Nested depth allowed: extruded card → inset well → gradient orb.

### Stat Orb (dashboard) — nested-depth showcase
- Perfect circle (`rounded-full`), gradient bg per metric, white Lucide icon, **convex 4-layer clay shadow** (bulges out).
- Sits inside an **inset-deep well** on the card: Extruded card → Inset well → Convex orb. The convex/concave contrast is the core Neum moment; optional slow "breathe" scale.

### Table / Member Row
- No table borders. Each row = a soft block with `gap` separation.
- Hover: row lifts (`-translate-y-0.5`) + small soft shadow.
- Status via **Badge**, not text color alone.

### Badges (pills, `rounded-full`)
- **Officer/운영진**: violet gradient bg, white text.
- **General/일반회원**: canvas bg + inset shadow, muted text.
- **Paid/납부**: teal gradient. **Unpaid/미납**: amber gradient.

### Navigation
- Top bar = extruded soft panel; active link = **inset well** + violet text.
- Mobile: collapse to icon menu (Lucide `menu` / `x`).

## 5. Layout Principles

- **Spacing**: airy; base 4px scale (gap 12–20px for grids, section gaps 24–28px).
- **Container**: centered, `max-width ~1080px`.
- **Background**: canvas globally + 2 fixed blurred blobs (violet, pink) at ~10–12% opacity, `blur(70px)`, slow float. Never a flat empty background, never a loud one.
- **Rhythm**: stat orbs row → toolbar (search + primary CTA) → content panel.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Recessed | `inset` dual shadow | inputs, active nav, "general" badge |
| Carved well (inset-deep) | deep inset dual shadow | orb wells, search field, icon-button rest |
| Flat-on-surface | none (same canvas) | plain text blocks |
| Extruded (1) | soft dual shadow | cards, header, secondary buttons |
| Lifted (hover) | larger dual shadow + `-translate-y` | hover on cards/buttons/rows |
| Convex bulge (Clay 4-layer) | colored drop + white highlight + inset rims | primary CTA, stat orbs |

**Philosophy**: depth is the primary visual language. Surfaces use soft dual shadows (Neum); interactive accents **bulge** with a 4-layer convex stack (Clay); and the signature move is **nested depth** — an Extruded card holds an **Inset-deep well** that cradles a **Convex orb** (Extruded → Inset → Convex). That convex/concave contrast is the real Neumorphic depth. Reserve full 4-layer stacks for accents + wells (not every surface) to stay professional.

## 7. Do's and Don'ts

### Do
- Keep all surfaces the single canvas color; express depth with paired soft shadows.
- Ration saturated color to actionable elements (CTA, badges, orbs, focus).
- Use generous radii (≥18px) and Nunito for numbers/headings.
- Add hover-lift + active-squish to every interactive element.
- Use Lucide icons with `currentColor`; pair Korean text with Pretendard.

### Don't
- DON'T use borders to separate elements — use shadow + spacing.
- DON'T use emojis anywhere (UI, labels, status). Use Lucide icons.
- DON'T flood the UI with gradients — surfaces stay monochrome.
- DON'T use sharp corners (`rounded-md`/`-lg`); minimum `rounded-[18px]`.
- DON'T use body/label text lighter than `#635F69` (placeholders use a dedicated ≥3:1 value).
- DON'T let blobs exceed ~12% opacity (keeps it professional).

## 8. Responsive Behavior

| Breakpoint | Changes |
|---|---|
| Mobile (<640px) | Stats 2-col; nav → icon menu; hide secondary table columns (phone); CTA full-width; radii kept generous |
| Tablet (640–1024px) | Stats 2–4 col; full nav |
| Desktop (>1024px) | Stats 4-col; centered `max-w-[1080px]` container |

- Keep shadows, depth, radii, and accent colors at all sizes (don't flatten on mobile).
- Touch targets ≥44px. Respect `prefers-reduced-motion` (disable lift/squish/blobs).

## 9. Agent Prompt Guide

### Quick token reference
- Canvas `#F4F1FA` · Text `#332F3A` · Muted `#635F69`
- Primary `#7C3AED` · gradient `135deg #A78BFA→#7C3AED` · Pink `#DB2777`
- Paid/teal `#10B981` · Unpaid/amber `#F59E0B` · Info/sky `#0EA5E9` · Danger `#EF4444`
- Shadow out: `8px 8px 18px rgba(174,167,193,.55), -8px -8px 18px rgba(255,255,255,.9)`
- Shadow in: `inset 5px 5px 10px rgba(174,167,193,.5), inset -5px -5px 10px rgba(255,255,255,.9)`
- Inset-deep well (Neum): `inset 10px 10px 20px rgba(174,167,193,.7), inset -10px -10px 20px rgba(255,255,255,.6)`
- Convex bulge (Clay 4-layer): `12px 12px 24px rgba(124,58,237,.30), -8px -8px 16px rgba(255,255,255,.85), inset 4px 4px 8px rgba(255,255,255,.45), inset -5px -5px 10px rgba(91,33,182,.18)`
- Radius: card 28 · button/input 18 · pill/orb full

### Example prompts
- "Stat orb card: canvas bg, `rounded-[28px]`, soft dual shadow; inside a `rounded-full` violet-gradient orb (48px) with a white Lucide `users-round` icon; number in Nunito 900 28px, label DM Sans 13px muted. Hover: `-translate-y-1`."
- "Primary button: violet→pink gradient, white DM Sans 700, `rounded-[18px]`, clay colored shadow; hover `-translate-y-0.5`, active `scale-[0.96]` inset; focus 2px violet ring."
- "Member row: canvas block, `rounded-[18px]`, hover lift + small shadow; name DM Sans 700, meta muted; status as teal `납부` / amber `미납` pill; actions as Lucide `credit-card` / `pencil` / `trash-2` icon-buttons (inset on press)."

### Iteration rules
1. Surfaces monochrome; color only on actionable elements.
2. Depth before decoration; borders never.
3. Nunito for numbers/headings, DM Sans + Pretendard for everything else.
4. Lucide icons only — no emoji.
5. Every interactive element: hover-lift + active-squish + visible focus ring.

## Iconography & SVG Guidelines

- **Library (standard)**: **Lucide** (`lucide-react`). Rounded, consistent 24px grid, tree-shakeable, `currentColor`. Optional swap: **Phosphor** if a rounder/duotone look is wanted — pick ONE, don't mix.
- All icons are inline SVG components (never `<img>`), color via `currentColor`.
- Sizes: 16px inline · 18–20px in buttons · 24px standalone/nav · 20–24px inside stat orbs.
- Suggested mapping: members `users-round` · fee/money `wallet` / `coins` · stats `chart-column` · unpaid `clock` · search `search` · add `plus` · pay `credit-card` · edit `pencil` · delete `trash-2` (danger `#EF4444`) · ranking `trophy` · logout `log-out`.

## Document Policies

### No Emojis
This product and its mockups must **not** use emojis in any UI element, label, status, or doc. Use Lucide SVG icons instead (emojis render inconsistently and break the soft-clay coherence). Status = colored badge/dot + icon, never an emoji.

## Dark Mode Tokens (optional, Phase 2+)

| Token | Light | Dark |
|---|---|---|
| Canvas | `#F4F1FA` | `#1B1820` (violet-tinted near-black) |
| Foreground | `#332F3A` | `#F5F3F7` |
| Muted | `#635F69` | `#A7A2AE` |
| Shadow dark | `rgba(174,167,193,.55)` | `rgba(0,0,0,.55)` |
| Shadow light | `rgba(255,255,255,.9)` | `rgba(255,255,255,.04)` |
| Primary | `#7C3AED` | `#A78BFA` (lifted for contrast) |

Guidance: drive every color via CSS variables; in dark mode soften shadows (lower light-layer opacity) and re-audit contrast to WCAG AA. Phase 1 ships light mode only.

# DESIGN.md — ClaimSathi design system

Read before generating any component (SKILL.md §4 "UI Phase"). Values live only in
`frontend/src/shared/theme/tokens.css`; components use token classes (`bg-dominant`, `text-ink`…), never hex.

## Colour: 60 / 30 / 10 per track

| Token | Share | Crop | Health | Used for |
|---|---|---|---|---|
| `--color-dominant` | 60% | olive `#6B6E4A` | sky `#87BFE6` | page background, top bar, sidebar, title bands |
| `--color-secondary` | 30% | beige `#DFD5C5` | cloud `#F4F6F8` | cards, panels, inputs, bottom nav |
| `--color-accent` | ≤10% | terracotta `#B5532F` | muted red `#B04A4A` | the six allowed uses only (below) |
| `--color-ink` | text | `#2B2C1E` | `#0F2A3D` | text on secondary |
| `--color-on-dominant` | text | `#FFFFFF` | `#0F2A3D` | text/icons on dominant |
| `--color-muted` | — | `#8A8670` | `#6B8599` | borders, dividers only (fails AA as text) |
| `--color-success` | — | `#4F7A3A` | `#2E7D5B` | settled / approved, as fills |
| `--color-on-accent` | — | `#FFFFFF` | `#FFFFFF` | text on accent/success fills. **Not in PRD §2 — pending approval** |

The theme switches with `data-track` on `<html>`. A single element can carry its own `data-track` to render
in the other theme (landing track cards, settings members/parcels).

**Accent is allowed on exactly six things:** the one primary CTA per screen; missing-document / missing-stamp
alerts; deadline countdowns; readiness score < 60; "Query raised" / "Rejected" status; the amount on the
expected-settlement card. Never on headings, icons, borders, links, hovers, charts or illustrations.

**Contrast rule we added:** crop accent and success fail AA as small text on beige (3.4:1), so they are used as
**fills with `on-accent` text** (≈5:1). Captions use `text-caption` (ink at 72%), never `muted`.

## Type

Mukta only (Latin + Devanagari in one family, 400/500/700/800). Base 16 px, minimum 14 px.
Headings 800, tight leading, `text-wrap: balance`. Numbers use `tabular-nums`. No all-caps labels.

## Layout

Mobile-first at 360 px; bottom nav (Home, Policies, Claims, Voice). Desktop: centred 1200 px, left sidebar.
Touch targets ≥ 48 px. Cards: `rounded-2xl`, no shadows (one exception: the floating caption over the scroll
sequence). Hierarchy comes from the dominant/secondary split, not from borders.

## Motion

- Scroll-linked sequences only on x-01 (tractor = Crop, MRI = Health). Canvas, rAF, repaint on frame change only.
- x-09 timeline draws in; line fills to the current stage.
- Track switch: 400 ms opacity cross-fade + sliding pill.
- Transform and opacity only. No bounce/elastic. Everything off under `prefers-reduced-motion`;
  sequences show one static frame then, and on devices reporting < 4 GB RAM.

## States

Every screen goes through `QueryView` (loading skeleton → error + retry → empty + one action → data).
Uploads queue while offline and say "waiting for network". Long jobs show `JobProgress` steps.

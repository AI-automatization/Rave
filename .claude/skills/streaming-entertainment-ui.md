---
name: streaming-entertainment-ui
description: WeWatch-specific UI/UX principles for dark streaming/entertainment apps. Combines Emil Kowalski restraint + Jakub Krehel production polish adapted for Twitch/Spotify/Linear-style dark glass interfaces. Apply when building or reviewing any WeWatch web/mobile UI.
---

# Streaming Entertainment UI — WeWatch

> Context type: **Mobile app + SaaS dashboard** hybrid  
> Primary lens: **Jakub** (production polish) + **Emil** (frequency gate)  
> Selective: **Jhey** (empty states, celebrations, first-run only)

---

## WeWatch Design System

```css
/* Core palette */
--bg: #07070D;
--surface: rgba(10, 10, 18, 0.9);
--glass: rgba(255, 255, 255, 0.03);
--border: rgba(255, 255, 255, 0.06);
--border-hover: rgba(255, 255, 255, 0.14);
--accent: #7C3AED;          /* violet — primary CTA, active state */
--accent-light: #A78BFA;    /* violet light — hover, icons */
--cyan: #22d3ee;             /* cyan — viewers, secondary stats */
--red: #E53E3E;              /* red — LIVE badge, danger */

/* Strong easing curves (not CSS defaults) */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

---

## Animation Decision Table

Apply Emil's frequency gate FIRST before any animation:

| Element | Frequency | Decision | Duration |
|---------|-----------|----------|----------|
| Room card hover | Frequent | Subtle only — border color, no translate | 150ms ease-out |
| LIVE badge pulse | Always visible | CSS `animate-pulse` (no JS) | built-in |
| Skeleton shimmer | Loading only | CSS keyframe, no interaction | 1.5s linear |
| Modal open/close | Occasional | Fade + scale(0.96→1) | 200ms ease-out |
| Toast notification | Occasional | Slide in from bottom | 180ms ease-out |
| Thumbnail hover | Frequent | scale(1.05) on img only | 400ms ease |
| Play overlay appear | On hover | opacity 0→1 | 150ms |
| Ambient orbs | Always | Fixed, no animation needed | — |
| Quick stats update | Data-driven | No animation — numbers just change | — |
| Room join button | Frequent | scale(0.97) on :active | 100ms |
| Video progress bar | Always | linear, no animation | linear |
| Skeleton → content | Once per load | Fade in: opacity 0→1 translateY(4px→0) | 200ms ease-out |

**Never animate:** navigation between pages (router handles), keyboard shortcuts, data refetch.

---

## Glass Card Pattern

```tsx
// Standard room/content card
<div
  className="rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.14] transition-colors duration-150 cursor-pointer"
  style={{ background: 'rgba(10,10,18,0.9)' }}
>
  {/* backdrop-blur only when truly floating (modals, dropdowns) — not on list cards */}
```

**Rule:** `backdrop-blur` only on modals, dropdowns, nav. Not on every card — it tanks GPU on long lists.

---

## LIVE Badge — Mandatory Pattern

```tsx
// Red LIVE — Twitch-style, no pulse animation on the badge itself
<div
  className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
  style={{ background: '#E53E3E', boxShadow: '0 0 8px rgba(229,62,62,0.4)' }}
>
  LIVE
</div>

// Pulse dot (section header only, not on each card)
<span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
```

---

## Skeleton Loading Pattern

```tsx
// Shimmer skeleton — defined in globals.css
<div className="skeleton aspect-video rounded-lg" />
<div className="skeleton h-4 w-3/4 rounded mt-2" />
<div className="skeleton h-3 w-1/2 rounded mt-1" />
```

```css
/* globals.css — already defined */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.07) 50%,
    rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## Section Header Pattern

```tsx
// Colored bar + icon + uppercase label — used everywhere
<div className="flex items-center gap-2.5">
  <div className="w-0.5 h-4 rounded-full"
    style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
  <Icon size={14} style={{ color }} />
  <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
    {label}
  </span>
  {live && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
</div>
```

---

## Platform Color Coding

```ts
const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  vk: '#0077FF',
  rutube: '#FF6600',
  default: '#64748B',
};
```

---

## Button States (Emil: must feel responsive)

```tsx
// Primary CTA
className="... active:scale-[0.97] transition-transform duration-100 hover:opacity-90"
style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}

// Ghost/secondary
className="... hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-150"

// Danger
className="... hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-150"
```

---

## Video Player Controls

```
Progress bar:    linear-gradient(to right, #7c3aed X%, rgba(255,255,255,0.15) 0%)
Volume slider:   same gradient pattern
Fullscreen:      always top-right corner
Controls fade:   opacity 0→1 on container hover, 200ms ease-out
Autoplay block:  80px violet circle, glow effect, centered play button
```

---

## Typography Scale

```
Page title:      text-[26px] font-black tracking-tight
Section label:   text-[12px] font-bold uppercase tracking-[0.16em]
Card title:      text-[13px] font-semibold
Card subtitle:   text-[11px] text-slate-500
Stats number:    text-[18px] font-black
Timestamp/meta:  text-[10px] text-slate-600
Badge:           text-[9px] font-bold
```

---

## Anti-Patterns (AI slop to avoid)

| Wrong | Right | Why |
|-------|-------|-----|
| `backdrop-blur` on every card | Only on floating elements | GPU cost on lists |
| `transition: all` | `transition-colors duration-150` | Specificity + performance |
| `scale(0)` appear | `opacity-0 scale-[0.96]` → `opacity-100 scale-100` | Real physics |
| `ease-in` on dropdown | `ease-out` or `--ease-out` | ease-in = sluggish feel |
| Glow on everything | Glow only on LIVE badge + active accent | Visual hierarchy |
| Animate on every hover | Limit to transform+opacity only | No layout thrash |
| Long animation (>300ms) | Under 200ms for card hovers | Streaming = fast context |
| Complex enter animations on room cards | Simple border-color change | Seen 100s/day |
| No reduced-motion support | Always wrap in `@media (prefers-reduced-motion: reduce)` | Accessibility |

---

## Ambient Background Orbs

```tsx
// Two orbs — fixed position, no animation needed
<div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[400px] rounded-full z-0"
  style={{
    background: 'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)',
    transform: 'translate(20%, -30%)'
  }} />
<div className="pointer-events-none fixed bottom-0 left-60 w-[500px] h-[300px] rounded-full z-0"
  style={{
    background: 'radial-gradient(ellipse, rgba(34,211,238,0.04) 0%, transparent 70%)',
    transform: 'translateY(30%)'
  }} />
```

---

## When to use Motion (Framer Motion / spring)

- Drag-to-dismiss (mobile bottom sheet) — spring with `{ type: "spring", duration: 0.4, bounce: 0.15 }`
- Room cards entering DOM for the first time (onboarding / first visit) — `initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}`
- **Never:** page transitions, room list re-renders, polling updates, real-time viewer count changes

---

## Accessibility Checklist

- [ ] `prefers-reduced-motion` kills all animations (already in globals.css)
- [ ] `:focus-visible` ring on all interactive elements (already in globals.css)
- [ ] `touch-action: manipulation` on buttons/links (already in globals.css)
- [ ] LIVE badge has `aria-label="Live"` (screen readers)
- [ ] Skeleton has `aria-busy="true"` on container
- [ ] Video controls accessible via keyboard (Space = play/pause)

---

## Reference Skills

- `.claude/skills/emil-design-eng.md` — full Emil Kowalski philosophy
- `.claude/skills/design-motion-principles.md` — three-designer lens system
- `.claude/skills/frontend-design.md` — WeWatch dark glass patterns
- `.claude/skills/ui-ux-pro-max.md` — 99 rules (accessibility + touch critical)

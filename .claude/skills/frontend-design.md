---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when building web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
argument-hint: "frontend-design"
---

# Frontend Design — WeWatch Edition

*Based on official Anthropic frontend-design skill, adapted for WeWatch dark-themed UI.*

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics.

## Design Thinking (Before Coding)

Before writing a single line, commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: WeWatch uses: dark/cinematic, glassmorphism, purple accent (#7B72F8), cyan accent (#22d3ee)
- **Differentiation**: What makes this screen UNFORGETTABLE?

**WeWatch Design Language:**
```
Background:     #0a0a0f (deep dark)
Card bg:        rgba(255,255,255,0.04) — glass
Card border:    rgba(255,255,255,0.08)
Primary accent: #7B72F8 (purple)
Secondary:      #22d3ee (cyan)
Success:        #22c55e (green)
Text primary:   #f0f0f0
Text muted:     rgba(255,255,255,0.5)
Blur:           backdrop-filter: blur(20px)
```

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Use `font-family: 'Bebas Neue', sans-serif` for headings (WeWatch style), clean sans for body. Avoid generic Inter/Arial.
- **Color & Theme**: Dark-first. Glass cards over solid backgrounds. Purple gradients for CTAs.
- **Motion**: Framer Motion for React. Use `useReducedMotion()` for accessibility. Staggered reveals > scattered micro-interactions.
- **Spatial Composition**: Generous negative space. Asymmetric layouts work. Grid-breaking hero sections.
- **Backgrounds**: Radial gradients + grain texture for depth. Never flat solid backgrounds for hero sections.

## GlassCard Pattern (WeWatch Standard)

```tsx
const GlassCard = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}
  >
    {children}
  </div>
);
```

## Motion Patterns (Framer Motion)

```tsx
import { motion, useReducedMotion } from 'framer-motion';

// Always respect reduced motion
const prefersReduced = useReducedMotion();

const fadeUp = {
  hidden: { opacity: 0, y: prefersReduced ? 0 : 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Staggered children
const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};
```

## WeWatch Component Checklist

Before shipping any UI component:

- [ ] Dark background (#0a0a0f or similar)
- [ ] Glass cards with blur + border
- [ ] Purple (#7B72F8) as primary CTA color
- [ ] `useReducedMotion()` applied to all animations
- [ ] Mobile responsive (375px minimum width)
- [ ] next-intl `useTranslations()` for all visible strings
- [ ] No hardcoded Russian/Uzbek/English strings in JSX
- [ ] `font-display: swap` on any Google Fonts

## NEVER in WeWatch UI

❌ White backgrounds (landing page uses gradient + dark)
❌ Generic purple-on-white gradients
❌ Inter font for headings (use Bebas Neue or similar display font)
❌ Fake stats / testimonials (honesty principle from redesign)
❌ Animations without `useReducedMotion` check
❌ Hardcoded text strings (use translation keys)

## Landing Page Sections (Reference)

The landing page (`LandingContent.tsx`) structure:
1. **Hero** — Badge + H1 ("WATCH VIDEOS — TOGETHER") + subtitle + CTA buttons
2. **How it works** — 3 steps with built-in browser flow
3. **Sync** — Same frame, pause/skip sync explanation  
4. **App demo** — Mock phone screen with browser tiles
5. **Features** — 4 feature cards (Watch Party, Battle, Achievements, Friends)
6. **Battle** — Challenge section
7. **Why WeWatch** — 3 honest value props (no fake testimonials)
8. **CTA** — Download section

## Implementation Reminder

When making a frontend change:
1. Run `npm run dev` and verify in browser
2. Test all 3 locales: `?locale=uz`, `?locale=ru`, `?locale=en`
3. Check mobile viewport (375px)
4. Run `tsc --noEmit` — zero type errors
5. Screenshot before shipping

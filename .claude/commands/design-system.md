# design-system

Audit or generate a production-ready design system. Use when creating new components, checking visual consistency, or reviewing styling-related changes.

**Source:** LobeHub Skills Marketplace — affaan-m/ECC

---

## Three Modes

### Mode 1: Generate
Scan the codebase for existing patterns and produce:
- Design tokens documentation
- Component inventory
- Missing token identification

```bash
# Run on mobile theme:
# Check apps/mobile/src/theme/index.ts for completeness
```

### Mode 2: Visual Audit
Evaluate UI across 10 dimensions (score 0–10):

| Dimension | Check |
|-----------|-------|
| Color consistency | All from `colors.*`? |
| Typography hierarchy | Bebas Neue / DM Sans used correctly? |
| Spacing rhythm | `spacing.*` tokens used? |
| Component uniformity | Same card/button style throughout? |
| Dark mode | All backgrounds `colors.bg*`? |
| Animations | Purposeful, not decorative? |
| Accessibility | 44pt touch targets, contrast ratio? |
| Information density | Not overcrowded, not too sparse? |
| Loading states | Skeleton screens present? |
| Empty states | Empty state UI present? |

### Mode 3: Slop Detection
Identify generic AI patterns:
- Hardcoded hex colors instead of tokens
- Inline styles instead of `StyleSheet.create`
- Missing `React.memo` on list item components
- `console.log` without `__DEV__` guard

---

## CineSync Token Reference

```typescript
// apps/mobile/src/theme/index.ts

colors: {
  primary: '#E50914',        // Netflix red — CTA, active states
  bgVoid: '#060608',         // Deepest background
  bgBase: '#0A0A0F',         // Screen background
  bgElevated: '#111118',     // Cards, modals
  bgOverlay: '#16161F',      // Overlays
  bgSurface: '#1C1C28',      // Input fields, chips
  gold: '#FFD700',           // Achievement, #1 rank
  silver: '#C0C0C0',         // #2 rank
  diamond: '#88CCFF',        // Top rank special
}

spacing: { xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32 }
borderRadius: { sm:4, md:8, lg:12, xl:16, full:9999 }
```

## When to Run

- Before shipping a new screen
- When a screen feels "off" visually
- When adding a new reusable component
- During PR review for UI changes

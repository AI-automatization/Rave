# frontend-design

Create distinctive, production-grade frontend interfaces with high design quality. Use when the user asks to build web components, pages, or applications and the visual direction matters as much as the code quality.

**Source:** LobeHub Skills Marketplace — affaan-m/ECC

---

## Design Direction Framework

Before writing any code, establish:
- **Purpose & audience** — Who uses this and what do they need to accomplish?
- **Tone** — Dense/quiet/scannable (ops tools), bold/expressive (consumer), minimal/clean (productivity)
- **Constraints** — Existing design tokens, component library, responsive breakpoints
- **Memorable differentiator** — One thing this UI does that generics don't

## Implementation Principles

- Leverage existing components and design tokens (CineSync: `theme/colors`, `theme/spacing`, `theme/borderRadius`)
- Use real or placeholder visual assets — never leave empty grey boxes
- Employ responsive constraints with stable dimensions
- Apply motion sparingly for clarity, not decoration
- Maintain multi-dimensional color palettes — never solid-only

## CineSync Design Tokens

```typescript
// Always import from theme, never hardcode:
import { colors, spacing, borderRadius } from '../theme';

colors.primary      // #E50914
colors.bgBase       // #0A0A0F
colors.bgElevated   // #111118
colors.bgSurface    // #1C1C28
colors.gold         // #FFD700
colors.diamond      // #88CCFF
```

## Anti-Patterns (NEVER)

- Purple gradients, decorative blobs, oversized cards
- Nested card layouts with 3+ levels
- Marketing copy sections obscuring core functionality
- Inline styles — always use `StyleSheet.create`
- Importing new design libraries without discussion

## Review Checklist

Before finishing any UI work:
- [ ] Interface immediately communicates its purpose
- [ ] Visual hierarchy is clear (primary → secondary → tertiary)
- [ ] Typography is readable with proper contrast
- [ ] Dark mode only — all backgrounds from `colors.bg*`
- [ ] Responsive / safe area insets handled
- [ ] Aligned with existing screen patterns in `apps/mobile/src/screens/`

# Aqua Theme — UI Documentation

**Framework:** Tailwind v4 + DaisyUI v5  
**Theme Name:** `aqua`  
**Mode:** Dark (`color-scheme: dark`)  
**Purpose:** Cinematic dark UI with aqua/violet highlights

---

## 1. Color Palette

### Base Colors

| Token | OKLCH | Usage |
|-------|--------|-------|
| `--color-base-100` | oklch(14% 0.004 49.25) | Page background |
| `--color-base-200` | oklch(26% 0.007 34.298) | Elevated surfaces |
| `--color-base-300` | oklch(45% 0.187 3.815) | Borders / lines |
| `--color-base-content` | oklch(94% 0.028 342.258) | Main text |

---

### Primary

| Token | OKLCH | Usage |
|--------|--------|--------|
| `--color-primary` | oklch(67% 0.182 276.935) | CTA buttons |
| `--color-primary-content` | oklch(25% 0.09 281.288) | Text on primary |

---

### Secondary

| Token | OKLCH | Usage |
|--------|--------|--------|
| `--color-secondary` | oklch(74% 0.16 232.661) | Secondary actions |
| `--color-secondary-content` | oklch(29% 0.066 243.157) | Text on secondary |

---

### Accent

| Token | OKLCH | Usage |
|--------|--------|--------|
| `--color-accent` | oklch(67% 0.182 276.935) | Highlights |
| `--color-accent-content` | oklch(25% 0.09 281.288) | Highlight text |

---

### Neutral

| Token | OKLCH | Usage |
|--------|--------|--------|
| `--color-neutral` | oklch(59% 0.249 0.584) | Neutral surfaces |
| `--color-neutral-content` | oklch(97% 0.014 343.198) | Neutral text |

---

## 2. Semantic Colors

| Type | Token | Purpose |
|------|--------|---------|
| Info | `--color-info` | Information states |
| Success | `--color-success` | Completed states |
| Warning | `--color-warning` | Alerts |
| Error | `--color-error` | Error states |

---

## 3. Radius System

| Variable | Value | Purpose |
|----------|--------|---------|
| `--radius-selector` | 0.25rem | Toggles |
| `--radius-field` | 0.5rem | Form fields |
| `--radius-box` | 1rem | Cards / containers |

---

## 4. Border & Effects

| Variable | Value | Description |
|----------|--------|--------------|
| `--border` | 2px | Strong border edge |
| `--depth` | 1 | Light shadow depth |
| `--noise` | 1 | Background noise texture |

---

## 5. Component Examples

### Buttons

```html
<button class="btn btn-primary">Play</button>
<button class="btn btn-secondary">Browse</button>
<button class="btn btn-accent">New</button>
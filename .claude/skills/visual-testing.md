# SKILL: Visual Testing (QA Visual Agent)
# Screenshot-based UI verification after code changes

---

## TRIGGER

After QA Code Agent passes, QA Visual Agent runs this skill.
Also runs on-demand for UI changes (screens, components, styles).

## TOOLS

- **Playwright MCP** — for apps/web/ and apps/admin-ui/
- **Maestro** — for apps/mobile/ E2E flows
- **Screenshots** — saved to screenshots/ directory

## PHASE 1: IDENTIFY UI CHANGES

```bash
git diff --name-only HEAD~1 | grep -E '\.(tsx|css|ts)$'
# Filter for UI-related files:
# screens/, components/, theme/, styles/, pages/
```

## PHASE 2: WEB VISUAL TESTS (Playwright)

```javascript
// For apps/web/ changes:
// 1. Start dev server
// 2. Navigate to affected pages
// 3. Take screenshots
// 4. Compare with baseline

const pages = [
  { name: 'home', url: '/home' },
  { name: 'movie-detail', url: '/movies/test-movie' },
  { name: 'watch-party', url: '/party/test-room' },
  { name: 'login', url: '/login' },
];

for (const page of pages) {
  await browser.navigate(page.url);
  await browser.takeScreenshot(`screenshots/web-${page.name}.png`);
}
```

## PHASE 3: ADMIN UI VISUAL TESTS

```javascript
// For apps/admin-ui/ changes:
const adminPages = [
  { name: 'dashboard', url: 'http://localhost:5173/' },
  { name: 'users', url: 'http://localhost:5173/users' },
  { name: 'movies', url: 'http://localhost:5173/movies' },
];
```

## PHASE 4: MOBILE VISUAL TESTS (Maestro)

```yaml
# .maestro/flows/watch-party-flow.yaml
appId: com.cinesync.mobile
---
- launchApp
- tapOn: "Watch Party"
- assertVisible: "Create Room"
- tapOn: "Create Room"
- assertVisible: "Room Created"
- screenshot: screenshots/mobile-watchparty-create.png

# .maestro/flows/video-player-flow.yaml
- tapOn: "Play"
- assertVisible: "Video Player"
- screenshot: screenshots/mobile-video-player.png
```

## PHASE 5: VISUAL COMPARISON

```
Compare current screenshots with previous baselines:
- If baseline exists → pixel diff (tolerance: 5%)
- If no baseline → save as new baseline
- If diff > 5% → flag as VISUAL REGRESSION
```

## PHASE 6: VISUAL TEST REPORT

```
QA VISUAL TEST REPORT:
  web_pages_tested: 4
  admin_pages_tested: 3
  mobile_flows_tested: 2
  screenshots_taken: 9

  REGRESSIONS:
    - NONE (all within 5% tolerance)
    OR
    - web-home.png: 12% diff — hero banner layout shifted

  SCREENSHOTS: screenshots/

VERDICT: VISUAL PASS / VISUAL REGRESSION DETECTED
```

## RULES

- Save ALL screenshots to screenshots/ (gitignored)
- NEVER delete baseline screenshots manually
- Flag regressions but don't auto-fix — report to Orchestrator
- Focus on layout, not content (dynamic data will differ)

# SKILL: Auto Write Tests + Auto Fix Tests
# QA Code Agent writes tests for changed code and fixes failing tests

---

## TRIGGER

After Critic Agent APPROVES code changes, QA Code Agent runs this skill.

## PHASE 1: IDENTIFY CHANGED CODE

```bash
# Get list of changed files
git diff --name-only HEAD~1

# Categorize by zone:
# services/** → Backend tests (Jest + supertest)
# apps/mobile/** → Mobile tests (Jest + Maestro)
# apps/web/** → Web tests (Jest + Playwright)
```

## PHASE 2: AUTO WRITE TESTS

For each changed file, write appropriate tests:

### Backend Service Tests
```typescript
// Pattern: services/{name}/src/__tests__/{name}.test.ts
import request from 'supertest';
import app from '../app';

describe('POST /api/v1/content/extract', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/content/extract')
      .send({ url: 'https://example.com' });
    expect(res.status).toBe(401);
  });

  it('should extract video URL from valid site', async () => {
    const res = await request(app)
      .post('/api/v1/content/extract')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ url: 'https://kinogo.cc/movie/123' });
    expect(res.status).toBe(200);
    expect(res.body.data.videoUrl).toBeTruthy();
  });
});
```

### Mobile Hook Tests
```typescript
// Pattern: apps/mobile/src/__tests__/hooks/{hook}.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useVideoExtraction } from '@hooks/useVideoExtraction';

describe('useVideoExtraction', () => {
  it('should detect direct .mp4 URL without backend call', async () => {
    const { result } = renderHook(() => useVideoExtraction());
    await act(async () => {
      await result.current.extract('https://cdn.example.com/video.mp4');
    });
    expect(result.current.result?.videoUrl).toBe('https://cdn.example.com/video.mp4');
    expect(result.current.result?.type).toBe('mp4');
  });
});
```

### Socket Event Tests
```typescript
// Verify client↔server event consistency
describe('Socket Event Consistency', () => {
  it('every client listener should have a server emitter', () => {
    // Grep for socket.on(SERVER_EVENTS.X) in mobile
    // Grep for io.emit(SERVER_EVENTS.X) in services
    // They must match
  });
});
```

## PHASE 3: RUN TESTS

```bash
# Backend:
cd services/{changed_service} && npx jest --passWithNoTests

# Mobile:
cd apps/mobile && npx jest --passWithNoTests

# All workspaces type check:
npm run typecheck
```

## PHASE 4: AUTO FIX FAILING TESTS

If tests fail:
1. Read the error message carefully
2. Determine if the TEST is wrong or the CODE is wrong
3. If test wrong → fix the test (wrong assertion, missing mock)
4. If code wrong → report back to Orchestrator (code needs fix)
5. Re-run tests after fix

## PHASE 5: TEST REPORT

```
QA CODE TEST REPORT:
  tsc: ✅ PASS (0 errors)
  jest_backend: ✅ 12/12 tests pass
  jest_mobile: ✅ 37/37 tests pass (3 new)
  new_tests_added: 3
    - useVideoExtraction.test.ts (2 tests)
    - MediaWebViewScreen.test.ts (1 test)
  coverage_change: +2.1%

VERDICT: TESTS PASS
```

## RULES

- NEVER skip tests — always run after code changes
- NEVER write tests that pass by accident (test the right thing)
- Test behavior, not implementation details
- Mock external services, not internal modules
- Each test should be independent (no shared mutable state)

# SKILL: Root Cause Tracing
# Backward debugging — trace from symptom to root cause, never guess

---

## TRIGGER

When a bug is reported or a test fails. Use this INSTEAD of guessing.

## THE 5-STEP BACKWARD TRACE

### Step 1: WHAT is the symptom?
```
Describe the exact error:
- Error message (exact text)
- Where it occurs (file:line or network response)
- When it occurs (which user action triggers it)
- How often (always, sometimes, specific conditions)
```

### Step 2: WHERE does the error originate?
```
Trace backward from the symptom:
- If HTTP error → which endpoint? → which controller? → which service?
- If UI error → which component? → which hook? → which API call?
- If Socket error → which event? → which handler? → which emit?

Use grep to find the exact code path:
  grep -rn "error_message_text" services/
  grep -rn "function_that_failed" apps/mobile/src/
```

### Step 3: WHY does it fail at that point?
```
Read the code at the failure point:
- What does it expect? (input type, state, precondition)
- What does it actually receive? (log output, network response)
- What's the gap between expected and actual?
```

### Step 4: WHAT is the root cause?
```
The root cause is the FIRST point where reality diverges from expectation.

Common root causes in CineSync:
- Missing API endpoint (mobile calls it, backend doesn't have it)
- Socket event mismatch (client listens, server doesn't emit)
- Missing referer header (CDN returns 403)
- Cookie not loaded (extraction before WebView loads)
- Type mismatch (backend returns 'playerjs', client expects 'direct')
- Race condition (async operation completes in wrong order)
```

### Step 5: WHAT is the minimal fix?
```
Fix ONLY the root cause. Do NOT:
- "Clean up" surrounding code
- Add defensive checks for symptoms
- Work around the bug instead of fixing it
- Change multiple things at once

The fix should be:
- As small as possible
- At the root cause location
- Verified by the self-check protocol
```

## EXAMPLE

```
Bug: "Video doesn't play in Watch Party"

Step 1: SYMPTOM
  expo-av Video component shows 403 Forbidden error
  Happens when user picks video from MediaWebView

Step 2: WHERE
  VideoPlayerScreen → UniversalPlayer → expo-av Video
  source={{ uri: extractedUrl }}
  → 403 from CDN server

Step 3: WHY
  CDN requires Referer header
  expo-av sends request WITHOUT Referer
  → CDN rejects with 403

Step 4: ROOT CAUSE
  MediaWebViewScreen.tsx:181 — when direct .mp4 URL detected:
    setDetectedMediaOnce({
      videoUrl: state.url,
      videoPlatform: 'direct',
      // ← videoReferer is MISSING
    });

  Backend extraction path (line 154) sets videoReferer correctly.
  But direct URL detection does NOT.

Step 5: MINIMAL FIX
  Add one field:
    videoReferer: lastKnownUrlRef.current || state.url,

  This is a 1-line fix at the root cause location.
```

## RULES

- NEVER guess the cause — TRACE it
- NEVER fix symptoms — fix the ROOT CAUSE
- ALWAYS provide evidence (grep output, error logs, code references)
- If you can't find the root cause in 3 steps → ask for help
- Document the trace in your submission (helps future debugging)

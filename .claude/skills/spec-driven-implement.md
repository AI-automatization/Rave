# SKILL: Spec-Driven Implementation
# Every task starts with a spec → code follows the spec → verify against spec

---

## TRIGGER

Before writing ANY code for a task. Create spec FIRST, then implement.

## SPEC FORMAT

```yaml
TASK_SPEC:
  id: T-XXXX
  title: [Short description]

  PROBLEM:
    what: [Exact bug/feature description]
    where: [File:line where the issue is]
    evidence: [Error message, screenshot, grep output]

  SOLUTION:
    approach: [How to fix — specific steps]
    files_to_modify:
      - path/to/file.ts: [What to change]
    files_to_create: [] # Only if absolutely necessary

  EXPECTED_OUTCOME:
    before: [What happens now — broken behavior]
    after: [What should happen — correct behavior]

  VERIFICATION:
    compile: "tsc --noEmit"
    test: "npx jest [test_file]"
    manual: [Steps to manually verify]

  CONSTRAINTS:
    - Zone: [allowed directories]
    - No: [specific things to avoid]
```

## IMPLEMENTATION FLOW

```
1. WRITE SPEC    → Before any code
2. REVIEW SPEC   → Does it make sense? Is it specific enough?
3. IMPLEMENT     → Follow spec exactly, no extra changes
4. VERIFY        → Run spec's verification steps
5. SELF-CHECK    → Run Self-Reflection Protocol
6. SUBMIT        → With spec + self-check results
```

## EXAMPLE

```yaml
TASK_SPEC:
  id: T-E077
  title: Fix cookie-less extraction in MediaWebView

  PROBLEM:
    what: Backend extraction runs before WebView loads cookies
    where: MediaWebViewScreen.tsx:194-198
    evidence: |
      useEffect(() => {
        void tryBackendExtract(params.defaultUrl); // cookiesRef.current is empty!
      }, []);
      CIS sites (kinogo, hdrezka) return 403 without cookies.

  SOLUTION:
    approach: Move extraction trigger to WebView's onLoadEnd callback
    files_to_modify:
      - apps/mobile/src/screens/modal/MediaWebViewScreen.tsx:
          Remove useEffect extraction on mount
          Add onLoadEnd prop to WebView that calls tryBackendExtract
          Pass cookiesRef.current to extraction call

  EXPECTED_OUTCOME:
    before: "kinogo.cc → extraction starts → 403 → no video found"
    after: "kinogo.cc → WebView loads → cookies collected → extraction → video found"

  VERIFICATION:
    compile: "cd apps/mobile && npx tsc --noEmit"
    test: "npx jest MediaWebView"
    manual: |
      1. Open WatchParty → SourcePicker → kinogo.cc
      2. Navigate to a movie page
      3. Bottom bar should appear with "Video Found"

  CONSTRAINTS:
    - Zone: apps/mobile/ only
    - No: touching services/ or shared/
    - No: changing the extraction API contract
```

## RULES

- Spec FIRST, code SECOND — always
- Spec must be SPECIFIC — file paths, line numbers, exact changes
- If spec is vague → you don't understand the problem yet → research more
- Implementation must MATCH spec — no extra "improvements"
- Verification must PASS — or the task is not done

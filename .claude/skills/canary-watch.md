---
name: canary-watch
description: Post-deploy production monitoring — polls WeWatch's live services on an interval, checks HTTP status/latency against a baseline, and alerts on threshold breaches. Use after a deploy, or standing (via Hermes cron) to catch a live incident before a user has to screen-record it.
argument-hint: "canary-watch [once|watch]"
---

# Canary Watch — WeWatch production monitoring

Added 2026-08-26 after a real incident: a stuck vb-media-proxy fetch (missing upstream
timeout, fixed in PR #191) went unnoticed for 5+ minutes of a live user session — the only
reason it surfaced at all was Saidazim sending a screen recording. `deploy.md`'s health check
is a ONE-SHOT check right after deploy; nothing was watching continuously *after* that.

This does not replace `deploy.md`'s pre-deploy checks — it's the missing "keep watching"
half, borrowed from ECC's `skills/canary-watch` (see the 2026-08-26 ECC comparison in memory)
adapted to WeWatch's actual services instead of a generic frontend LCP/CLS check.

## What it checks, per service

```
1. HTTP status of the public URL (or /health where the service exposes one — watch-party,
   auth, user, content, notification, admin all do; app-web/web/admin-ui/payment don't, so
   those get a plain root-path GET instead)
2. Response latency (ms)
3. For services WITH /health: the JSON body's own `status` field (watch-party's /health
   independently checks Mongo + Redis — a 200 with status:"degraded" is a real finding
   this catches that a bare curl-for-200 would miss)
```

## Thresholds

```
CRITICAL — non-2xx status, OR /health body says "degraded"/non-"ok", OR latency > 8000ms
WARNING  — latency > 3000ms (2xx status)
OK       — 2xx status, latency ≤ 3000ms, health body (if present) says ok
```

These are deliberately coarse (not p99 SLA tracking — that needs real APM, out of scope
here). The point is catching "something is actually broken or hanging," which is exactly
what a stuck-fetch-style incident looks like from outside: slow or non-responding, not
subtly-degraded.

## Running

```bash
bash .claude/scripts/canary-watch.sh once     # single pass, prints a report, exits 1 on any CRITICAL
bash .claude/scripts/canary-watch.sh watch    # loops every 5 min until killed, same checks each pass
```

Logs every run (pass or fail) to `~/.claude/canary-watch.log` (JSONL, one line per service per
run) so a failure has history around it, not just the moment it was noticed.

## Standing monitoring (not just ad-hoc)

A one-shot run only helps if someone remembers to run it. For continuous coverage without
babysitting a terminal, wire it into Hermes cron (same mechanism already used in this project
for escalation reminders):

```bash
hermes cron create --interval 15m "bash ~/Desktop/Rave/.claude/scripts/canary-watch.sh once"
```

If a run exits 1 (CRITICAL found), have the cron job's own alerting (or a wrapper that greps
the exit code) forward it to Telegram — don't rely on someone reading the log file. This
script itself does not send Telegram messages; it is deliberately just a checker, so it can be
invoked standalone (`once`) during any conversation without side effects, or wrapped for
unattended alerting (`watch` / cron) without changing the checking logic itself.

## When to run `once` manually

- Right after `deploy.md`'s post-deploy health check, as a second, independent look 30-60s
  later — a service that came up healthy at deploy time can still degrade shortly after
  under real traffic (exactly what happened with the vb-media-proxy incident: it wasn't
  broken at deploy time, it broke under a real slow-upstream request later).
- Any time a user reports "it's slow/not loading" and you want to rule out (or confirm)
  the whole service being down versus one specific feature/room/request being broken.

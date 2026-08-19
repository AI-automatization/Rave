# payment — port 3009

Bridges WeWatch (`apps/app-web`) to **tezcode-billing** (`https://pay.tezcode.dev`, a
Tezcode-wide shared billing platform, not part of this monorepo) for the Pro plan.
`apps/app-web` never sees a billing secret — it only calls this service's own
JWT-authenticated endpoints; this service is the only thing that ever talks to
tezcode-billing directly.

## Status — 2026-08-19

Implemented against the real contract (`docs/INTEGRATION.md`, provided by Abdulaziz
2026-08-19 — see [`src/services/billingClient.ts`](src/services/billingClient.ts) for the
full checkout/webhook/pull-fallback client). Code-complete; **not yet deployable** — two
real-world prerequisites are still missing, both are "Шаг 0" in that doc, both are
Abdulaziz's to hand over, not something to work around in code:

- [ ] `BILLING_API_KEY` — shown once at creation, put straight into Railway env
- [ ] `BILLING_HMAC_SECRET` — verifies incoming webhook signatures
- [ ] Give Abdulaziz this service's public webhook URL once it's deployed to Railway:
      `https://<payment-service-railway-domain>/api/v1/payment/webhooks/tezcode-billing`
- [ ] Confirm plan `pro` (29 000 so'm/oy) is fisc­ally set up under productCode `WEWATCH` —
      the 2026-07-04 setup predates this integration; worth a one-line confirmation before
      the first real checkout

### Also still open (unchanged from the original scaffold)
- [ ] Add `services/payment` env vars to Railway (see `.env.example`)
- [ ] Add `PAYMENT_SERVICE_URL` to `apps/app-web`'s Railway env
- [ ] `services/user` has no `plan`/`isPremium` field — this service only tracks *whether* a
      user paid, not what that unlocks. Actual Pro feature gating (4K, no ads, unlimited
      history — the claims already on the pricing page) is a separate follow-up.
- [ ] `apps/mobile`: per the App Store/Play Store subscription rules in the owner's original
      message, it must read plan status from this service (via its own backend proxy, same
      BFF pattern as app-web) and must **never** show a buy button or link out to web
      payment — not built here, out of scope (apps/mobile is Saidazim+Emirhan's zone).
- [ ] The studio-wide "30 days free trial before first checkout" policy
      (docs/INTEGRATION.md, "Частые вопросы → Триал") doesn't map cleanly onto WeWatch's
      model — WeWatch already has a permanently-free Free tier, Pro is an opt-in upgrade,
      not a trial-gated paywall. Left unimplemented on purpose; flag to the owner if WeWatch
      is expected to follow the same trial policy as RAOS/CoreMed/TezDetal/MaxSavdo.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/payment/plan` | JWT (`verifyToken`) | Current user's plan (`free`/`pro`) |
| POST | `/api/v1/payment/checkout` | JWT (`verifyToken`) | `{ provider: 'PAYME' \| 'CLICK' }` → starts a tezcode-billing checkout, returns `{ paymentId, checkoutUrl }` |
| POST | `/api/v1/payment/webhooks/tezcode-billing` | HMAC signature (`X-Signature`/`X-Nonce`/`X-Timestamp`/`X-Event-Id`, raw body) | tezcode-billing → us; flips the user's plan on `subscription.activated` / `subscription.refunded` |
| GET | `/health` | none | liveness + Mongo check |

## Receiver contract coverage (docs/INTEGRATION.md §Шаг 2)

All 5 points from the doc's checklist are implemented:
1. **Signature** — `billingClient.verifyWebhookSignature()`, HMAC-SHA256 over the raw body, `timingSafeEqual`.
2. **Replay** — `billingClient.isTimestampFresh()` (5 min window) + `webhookSecurity.model.ts`'s `BillingWebhookNonce` (unique, 15 min TTL).
3. **Dedup** — `BillingWebhookEvent` unique index on `eventId`.
4. **Ordering** — `Subscription.lastAppliedVersion`, only advances on a strictly-greater `version`.
5. **Fast ACK** — the controller does no slow I/O before responding.

Pull-fallback reconciliation (`PaymentService.reconcileExpiringSoon`) runs on a daily
`setInterval` in `server.ts` — no Redis/Bull dependency added for one call a day.

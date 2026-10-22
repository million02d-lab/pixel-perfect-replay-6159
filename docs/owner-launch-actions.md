# Ozannif — owner actions required before public launch

This checklist separates implementation work from decisions and credentials only the platform owner can supply. Do not announce a public launch until required checks are complete.

## Confirmed during the latest review (2026-10-22)
- Supabase project is active and the `ozannif-api` Edge Function is deployed (version 29).
- Supabase Security Advisor returned no findings at the latest check.
- Homepage hero polish PR #8 was merged after its CI workflow completed successfully.
- No production fare rules exist or are active. The server quote flow intentionally fails closed until an approved rule is activated.

## Owner actions (external dashboards or real-world decisions)

### 1. Production domain and hosting
- [ ] Confirm the final domain and hosting target.
- [ ] Configure hosting environment variables from `.env.example` using the real Supabase URL and publishable key.
- [ ] Configure the exact production origin and approved preview origins in the Edge Function's `ALLOWED_ORIGINS` secret.
- [ ] Verify the actual deployed commit and run a browser smoke test on desktop and mobile.

### 2. Maps and routing
- [ ] Choose a production geocoding/directions provider (Mapbox, Google Maps, or an operated/contracted routing service).
- [ ] Add the provider key/endpoint as Supabase Edge Function secrets; restrict browser keys to approved domains and APIs.
- [ ] Test pickup/destination geocoding, routed distance/duration, errors, rate limits, and service-area rejection.
- [ ] Keep public community OSM/OSRM fallback disabled for production unless its usage policies and reliability have been explicitly reviewed.

### 3. Pricing — mandatory before any real booking
- [ ] Approve fixed zone/destination fares or the distance/time calculation model.
- [ ] Confirm vehicle classes and eligibility, fuel price and consumption assumptions, whether fuel is already included in per-km pricing, minimum driver payout, and platform commission.
- [ ] Decide waiting, cancellation, tolls, rounding, quote expiry, and price-lock rules.
- [ ] Review the approved tariff against representative Rabat–Salé routes and each supported vehicle class.
- [ ] Only then, use the admin console to create and activate fare rules. Do not use demo rates as production tariffs.

The previously discussed MAD 30 fare / MAD 2 platform fee is an example only, not an approved or active tariff.

### 4. Owner/admin account
- [ ] Sign up with the intended owner email and confirm the account.
- [ ] Sign in once so the profile row exists.
- [ ] Follow the one-time secure instructions in [admin-bootstrap.md](./admin-bootstrap.md) in the Supabase SQL Editor.
- [ ] Verify that only the intended owner account has the admin role.

### 5. Support and account emails
- [ ] Provide a monitored support inbox and support phone/contact policy.
- [ ] If email delivery is required, configure Resend API key, support address and verified sender domain as Edge Function secrets.
- [ ] Configure Supabase Auth SMTP/email confirmation and the exact password-reset redirect URL.
- [ ] Test signup, confirmation, password reset, contact submission, and email failure states.

### 6. Legal, safety and operations
- [ ] Obtain qualified Moroccan legal advice on transport authorization, driver/vehicle eligibility, insurance, rental-partner model, consumer disclosures, tax, privacy and retention.
- [ ] Approve terms, privacy notice, cancellation/refund policy, incident escalation, and document retention/deletion workflow.
- [ ] Verify driver identity/documents and approve partners manually before matching.
- [ ] Add durable rate limiting and CAPTCHA/Turnstile for public forms before marketing.
- [ ] Define loyalty thresholds, reward expiry, redemption and driver compensation before publishing rewards.

## Required technical acceptance tests
- [ ] A real route quote uses provider-derived distance and an approved active tariff.
- [ ] A passenger can request a trip; an eligible approved driver can accept it exactly once.
- [ ] Trip status transitions, ownership permissions and cancellation behavior are verified.
- [ ] Loyalty points are awarded only once after server-confirmed completion.
- [ ] Contact messages persist and delivery success/failure is shown truthfully.
- [ ] Arabic RTL, French, English, mobile layout, accessibility, backup/recovery and logs are reviewed.

## Launch status
**Not yet approved for public production launch.** The website and backend foundation exist, but real tariff approval, production routing configuration, owner admin provisioning, legal review, operational setup, and full end-to-end acceptance testing remain mandatory. Keep demo/preview notices visible until verified.

# Ozannif production-readiness plan

## Current verified state (updated 2026-10-21)

The connected Supabase project is confirmed and has the core application schema with RLS enabled. The ozannif-api Edge Function is deployed (version tracked in Supabase; source is committed at supabase/functions/ozannif-api/index.ts). Core auth/profile, server-side geocoding and quote, trip persistence/lifecycle, driver presence, loyalty ledger, partner/vehicle applications, rental matching, admin review/fare-rule operations, and contact persistence are implemented in the current branch.

The React + TypeScript + TanStack Start frontend now includes:
- Supabase Auth signup/sign-in, with session refresh and server-side profile provisioning.
- Contact form persistence; optional support email when verified Resend settings are configured.
- Driver profile, vehicle application, partner application, and driver-without-car rental request forms.
- Passenger trip history and loyalty balance, driver availability/trip lifecycle, and an admin console with review queues, fare-rule creation and rental matching.
- A server-side quote flow that geocodes locations within the configured Rabat–Salé area, obtains directions, calculates fuel cost from fare-rule fuel price and vehicle consumption, and persists trip requests with an idempotency key.
- An OpenStreetMap view for resolved trip locations and tests/CI for lint, unit tests, typecheck and build.

The project is **not ready for public production launch**:
- Mapbox or Google Maps secrets must be configured in Supabase Edge Function secrets; live geocoding/directions fail closed until then.
- No production fare rules are active. An authorized admin must validate prices and activate a rule including fuel price and litres per 100 km.
- A trusted admin must be provisioned through the Supabase SQL Editor; see docs/admin-bootstrap.md.
- Support email requires a Resend API key, support inbox and verified sender; otherwise contact messages are saved in the database only.
- Contact throttling is best-effort per function instance and requires durable rate limiting/CAPTCHA before public promotion.
- Realtime notifications/live GPS, payment processing, receipts, document uploads, reward redemption, cancellation reasons, ratings, full admin audit tooling, Moroccan legal/privacy review and full end-to-end testing remain incomplete.
- The existing home page still includes truthful demo notices; do not remove them until the complete customer journey is verified in the deployed environment.
- The app client uses a public Supabase publishable key only. Never put a service-role key in the browser or repository.

## Delivery rule

Work in small, reviewable pull requests. Do not remove truthful availability notices or mark features as live until the relevant backend flow has been implemented and tested. Never write secrets to the repository or expose service-role keys to the browser.

## Phase 0 — Establish a safe baseline

- Confirm the intended hosting target, production domain, environment-variable configuration, and actual backend provider.
- Confirm the existing Lovable-to-GitHub sync and the latest deployed commit.
- Run the existing build, lint, and test scripts; record baseline failures before modifying behavior.
- Add CI for install, type/build, lint, and tests. Keep production secrets in hosting/provider secret settings.
- Keep the existing main branch untouched while changes are reviewed on feature branches.

## Phase 1 — Backend and identity

Supabase is confirmed as the primary backend. Keep privileged writes in Edge Functions and enforce RLS/ownership on all browser-accessible tables.

Required capabilities:
- Passenger and driver identity, email confirmation/session handling and sign-out. Password reset and phone verification still need implementation.
- A server-controlled role model for passenger, driver, operations/admin. Never trust a role supplied by client-side metadata.
- Driver profile, vehicle details, document review status, and approval workflow.
- Row-level access control for every exposed data table; ownership checks for every read/write; deny by default.
- Rate limiting, input validation, audit events, secure upload policies, and safe error messages.

Proposed entities: profiles, user_roles, driver_profiles, vehicles, trips, trip_events, pricing_rules, ratings, rewards_ledger, rental_partners, rental_applications, transactions, contact_messages, audit_logs.

## Phase 2 — Real routes and pricing

- Integrate a map/geocoding/directions provider only after credentials and billing are configured; restrict browser keys to approved domains.
- Resolve pickup and destination to validated coordinates; reject invalid/out-of-service-area locations.
- Get route distance and duration from the provider. Never derive a real distance from the text of the address.
- Keep pricing rules versioned with effective dates and currency (MAD). Authorized operators can update monthly fuel-cost assumptions and vehicle cost parameters.
- Compute quotes server-side and store the pricing-rule version, distance, duration, vehicle class, line items, expiry, and total with each quote.
- Validate that price inputs are finite, bounded, and supported. Do not trust client-supplied totals.
- Define driver payout and platform commission independently; make the published commission and all deductions auditable.
- Start with an explicit, configurable quote formula reviewed against local operating costs and applicable Moroccan requirements.

## Phase 3 — Trip lifecycle and dispatch

Initial server-validated lifecycle is implemented: requested → matched → driver_arriving → in_progress → completed, with cancellation checks. Expand it with cancellation reasons, dispatch notifications and realtime updates before launch.

- Persist every transition and its actor/timestamp.
- Prevent double acceptance and duplicate requests using database constraints/idempotency.
- Match only eligible, approved, available drivers within configured service limits.
- Provide passenger/driver status updates via an authenticated realtime channel or controlled polling.
- Do not display "live tracking" unless location updates are actually being received and permissioned.
- Add cancellation reasons, incident reporting, trip history, receipts, and mutual ratings after completion.

## Phase 4 — Rental-driver onboarding

The dedicated driver-without-car journey is implemented in the UI and Edge Function. Remaining work: partner confirmation workflow, rental contract/document storage, and operational testing.
- Explain eligibility and required documents.
- Collect applicant contact details and preferred city securely.
- Store applications with explicit pending/approved/rejected/contacted status.
- Show partner contact details only after the business has approved and configured them.
- Track the one-week zero-platform-commission offer with server-side start/end timestamps, eligibility, and an auditable ledger.
- Do not promise that an application or rental is approved before a human/operator has confirmed it.

## Phase 5 — Loyalty, contact and administration

- Award loyalty points only from server-confirmed completed trips; use an immutable ledger and idempotency key to avoid duplicate awards.
- Define reward thresholds, expiry, exclusions, redemption and anti-abuse rules before publishing rewards.
- Require the passenger to acknowledge reward conditions; record the version and timestamp. For a free-hour reward, define what "one hour" means and how driver compensation is handled.
- Send contact messages through a server-side email provider. Validate inputs, add abuse protection, and show success only after the provider/backend accepts the message.
- Protect admin routes on the server, not only in the UI. Add role checks, audit logging, search/filtering and pagination.
- Admin pricing changes must be permissioned, validated and versioned.

## Phase 6 — Design and accessibility

- Preserve the current brand foundation and Arabic/French/English support.
- Add a professionally produced, licensed automotive hero video with a poster fallback, muted autoplay where supported, pause/reduced-motion behavior, mobile compression and no blocking of the main booking call-to-action.
- Use real, licensed photography; do not present generated driver portraits as verified real drivers.
- Add vehicle categories only when the supply and service rules support them.
- Improve responsive layouts, keyboard focus, form labels/errors, contrast, loading/empty/error states and reduced-motion behavior.
- Keep route prices marked as estimates until generated by the live quote service.

## Phase 7 — Legal, privacy and launch checks

- Obtain qualified local review of the Moroccan transport model, required authorizations, driver/vehicle eligibility, rental arrangement, terms, cancellation/refund handling, and consumer disclosures.
- Publish accurate privacy and retention policies; collect only necessary personal data and define deletion/access workflows.
- Verify email domain, deliverability, support contact, incident escalation, and backup/recovery.
- Run tests for quote math, permissions, trip transitions, double booking, reward idempotency, language/RTL, mobile layout, and failure states.
- Perform dependency/security checks and review logs for accidental personal data or secrets.
- Launch to a limited pilot only after critical flows pass acceptance tests.

## Acceptance criteria

The project is not launch-ready until:
1. Signup/signin/reset use the configured identity provider and persist correctly.
2. A quote uses actual routed distance/duration and server-side pricing rules.
3. A trip request persists, can be matched/accepted exactly once, and has a traceable lifecycle.
4. Contact messages reach the configured inbox/provider and failed sends show an error.
5. Driver rental applications and the zero-commission offer are tracked server-side.
6. Loyalty points are earned only from completed trips and cannot be duplicated by repeated requests.
7. Admin authorization is enforced server-side and every privileged action is auditable.
8. Arabic/French/English, mobile, accessibility, privacy and security checks pass.
9. CI build, lint and test jobs pass, and the deployed commit is identified.

## Required configuration still to verify

- Production hosting domain and environment configuration.
- Actual backend project and authentication provider.
- Map/geocoding/directions provider and restricted keys.
- Transactional email provider and verified sender domain.
- Operations/support inbox and phone number.
- Confirmed vehicle classes, service area, pricing formula, commission rules and reward terms.
- Approved rental partner contact details and legal onboarding requirements.

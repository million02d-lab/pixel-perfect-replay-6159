# Supabase baseline

Project: `OZANNIF` (region `eu-central-1`). The initial database migration was applied on 2026-10-21 as `20261021125414_initial_ozannif_core_schema`.

## Tables created

- `profiles`: user profile fields and preferred language.
- `driver_profiles`: driver verification workflow.
- `partner_profiles`: rental / fleet partner applications and verification.
- `vehicles`: driver vehicle details and review status.
- `fare_rules`: versionable fare inputs, vehicle class, fuel assumptions and platform fee.
- `trips`: passenger/driver assignment, pickup/drop-off coordinates, route metrics, quote and lifecycle status.
- `trip_events`: append-style trip activity history.
- `rental_requests`: driver requests to find a partner vehicle, with terms and commission-free eligibility fields.
- `loyalty_ledger`: passenger reward accounting ledger.
- `contact_messages`: contact form submissions, reserved for backend processing.

## Security baseline

- Row Level Security is enabled on all ten application tables.
- Profile, driver, partner and vehicle rows have owner-scoped policies.
- Trip reads are restricted to the passenger and assigned driver.
- Rental request creation/read is owner-scoped.
- Loyalty ledger is read-only to the passenger who owns it.
- Current active fare rules can be read by the public site; writes are not granted to browser roles.
- Contact messages are deliberately blocked from direct browser-role access until a rate-limited server-side submission endpoint is implemented.
- The `private` schema is not granted to browser roles.
- No service-role/secret key is configured in client code.

## Important remaining work

This migration is a **database foundation**, not a completed ride-hailing backend. It intentionally does not yet provide public client-side write access to trips, fare rules, review status, reward entries, or trip events. These operations must be implemented through authenticated server-side actions / Edge Functions with authorization, idempotency, rate limits, audit events and server-verified route metrics.

Before launch, implement and test:
1. Signup/sign-in integration and a safe profile provisioning flow.
2. Server-side fare quoting from a real directions provider; do not trust browser-supplied distance, duration, fare, commission or role.
3. Atomic trip request and driver matching, plus validated trip state transitions.
4. Admin-only driver/vehicle/partner review with server-side role checks.
5. Contact form endpoint with abuse prevention.
6. Reward issuance only for verified completed trips, with duplicate prevention.
7. Rental matching and one-week commission-free terms with explicit acceptance and server-calculated eligibility.
8. RLS and authorization tests using passenger, driver, partner, admin and unauthenticated test identities.

## Current verification

After the migration, the Supabase table inspection confirmed all ten tables and RLS enabled. Security advisors initially reported the expected lack of direct client policies on backend-only `contact_messages` and read-only-by-policy `fare_rules`; policies were then added for active fare-rule reads and to explicitly deny browser-role contact writes. Performance advisor findings for missing indexes on three foreign-key columns were addressed. Re-run the Supabase security and performance advisors after the next schema changes and confirm that the current findings are clear.

This document is a deployment record, not a substitute for automated integration tests or a security audit.

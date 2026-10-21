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
- `driver_presence`: server-managed online/offline state for approved drivers.
- `driver_documents`: private document metadata for identity, driving licence, vehicle registration and insurance; underlying files are stored in a private Storage bucket.

## Security baseline

- Row Level Security is enabled on all ten application tables.
- Profile, driver, partner and vehicle rows have owner-scoped policies.
- Trip reads are restricted to the passenger and assigned driver.
- Rental request creation/read is owner-scoped.
- Loyalty ledger is read-only to the passenger who owns it.
- Current active fare rules can be read by the public site; writes are not granted to browser roles.
- Contact messages are deliberately blocked from direct browser-role access; the Edge Function saves them using server-side credentials and applies best-effort per-instance rate limiting.
- The `private` schema is not granted to browser roles.
- No service-role/secret key is configured in client code.

## Important remaining work

This migration is a **database foundation**, not a completed ride-hailing backend. It intentionally does not yet provide public client-side write access to trips, fare rules, review status, reward entries, or trip events. These operations must be implemented through authenticated server-side actions / Edge Functions with authorization, idempotency, rate limits, audit events and server-verified route metrics.

Before launch, implement and test:
1. Signup/sign-in integration and a safe profile provisioning flow.
2. Server-side fare quoting from a real directions provider; do not trust browser-supplied distance, duration, fare, commission or role.
3. Atomic trip request and driver matching, plus validated trip state transitions.
4. Admin-only driver/vehicle/partner and document review with server-side role checks; driver approval requires approved identity and driving-licence documents, and vehicle approval requires approved registration and insurance documents.
5. Contact form endpoint with abuse prevention.
6. Reward issuance only for verified completed trips, with duplicate prevention.
7. Rental matching and one-week commission-free terms with explicit acceptance and server-calculated eligibility.
8. RLS and authorization tests using passenger, driver, partner, admin and unauthenticated test identities.
9. Configure Mapbox/Google Maps, allowed origins, verified Resend sender and durable public-contact abuse prevention before public launch.
10. Provision at least one admin through the trusted Supabase SQL Editor only; see [admin bootstrap](admin-bootstrap.md).

## Current verification

After the migration, the Supabase table inspection confirmed all ten tables and RLS enabled. Security advisors initially reported the expected lack of direct client policies on backend-only `contact_messages` and read-only-by-policy `fare_rules`; policies were then added for active fare-rule reads and to explicitly deny browser-role contact writes. Performance advisor findings for missing indexes on three foreign-key columns were addressed. Re-run the Supabase security and performance advisors after the next schema changes and confirm that the current findings are clear.

This document is a deployment record, not a substitute for automated integration tests or a security audit.

## Edge Function status

The `ozannif-api` Edge Function is deployed and currently handles account-profile provisioning, geocoding, server-side quote calculation, trip creation, driver availability, trip acceptance and status transitions, loyalty points on completion, partner/vehicle applications, private driver-document registration/review, rental requests, admin reviews, fare-rule management, rental matching, and contact persistence. Its source is versioned at `supabase/functions/ozannif-api/index.ts`.

The function is configured with gateway JWT verification disabled because the public contact action accepts anonymous submissions. Every other action independently validates the bearer token through Supabase Auth; admin actions additionally check the server-side `profiles.role`. Configure `ALLOWED_ORIGINS` explicitly before production. Public contact throttling is currently per-instance only and needs a durable rate limiter/CAPTCHA for a public launch.

Live route geocoding and directions will fail closed until `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` is configured. Proximity matching uses the latest driver GPS while online, with a configurable `MATCH_RADIUS_KM` (default 10 km); stale locations older than 60 seconds are not eligible. Fare quotes and trip creation will fail closed until active fare rules are reviewed and entered. Email delivery is optional and requires `RESEND_API_KEY`, `SUPPORT_EMAIL` and a verified `RESEND_FROM_EMAIL`. No production fare rates have been seeded.

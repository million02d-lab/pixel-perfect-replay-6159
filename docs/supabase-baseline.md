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

- Row Level Security is enabled on all twelve application tables.
- Profile, driver, partner and vehicle rows have owner-scoped policies.
- Trip reads are restricted to the passenger and assigned driver.
- Rental request creation/read is owner-scoped.
- Loyalty ledger is read-only to the passenger who owns it.
- Current active fare rules can be read by the public site; writes are not granted to browser roles.
- Contact messages are deliberately blocked from direct browser-role access; the Edge Function saves them using server-side credentials and applies best-effort per-instance rate limiting.
- The `private` schema is not granted to browser roles.
- No service-role/secret key is configured in client code. Direct table write privileges are revoked from anon and authenticated; the server-side Edge Function is the only application mutation path. Default privileges for future public tables created by the migration role also deny browser-role writes; future public functions are not executable by browser roles by default, and browser roles have no sequence privileges.

## Important remaining work

The backend foundation is implemented but not production-launched. Complete these environment and operational gates:
1. Configure and verify a real directions/geocoding provider and domain restrictions; the visual map panel is still a placeholder.
2. Add reviewed active fare rules for every vehicle class, with validated fuel prices, consumption assumptions, minimum fares and commission terms. No active rates are currently seeded, so booking quotes fail closed.
3. Test the full passenger-to-driver trip lifecycle against real authenticated test accounts, including race conditions, cancellations, stale GPS and idempotent retries.
4. Finish loyalty reward redemption and define how any free-trip/hour reward is funded and compensated to drivers before activation.
5. Configure Resend sender/domain and verify support/contact delivery; add durable rate limiting and CAPTCHA/Turnstile to public anonymous contact.
6. Configure Auth email confirmation, SMTP and the exact /reset-password redirect allowlist.
7. Provision the trusted administrator through the SQL Editor and test every admin review action with separate passenger, driver, partner, admin and unauthenticated identities.
8. Verify driver/vehicle/partner documents, private Storage access, retention/deletion procedures and access logging.
9. Complete Moroccan transport/licensing, insurance, consumer protection, privacy, data-retention and contractual review with qualified local counsel.
10. Complete staging acceptance tests, monitoring/alerting, backup/restore drills and incident-response procedures before enabling real trips.

## Current verification

- Supabase inspection confirms all twelve public application tables have RLS enabled.
- The security advisor currently reports no findings.
- Read-only SQL checks confirm anon and authenticated cannot update profiles, driver approvals or vehicle approvals, while authenticated users retain RLS-scoped profile reads.
- Performance advisor output contains unused-index notices, which are informational for this newly provisioned, currently empty database; do not remove indexes without workload evidence.
- These checks do not replace automated end-to-end authorization tests or a professional security audit.

## Edge Function status

The `ozannif-api` Edge Function is deployed version 26 and currently handles account-profile provisioning, geocoding, server-side quote calculation, trip creation, driver availability, trip acceptance and status transitions, loyalty points on completion, partner/vehicle applications, private driver-document registration/review, rental requests with explicit contact-sharing consent, partner dashboards that disclose driver contact details only after consent, admin reviews, fare-rule management, rental matching with partner-confirmed seven-day commission-free eligibility, and contact persistence. Its source is versioned at `supabase/functions/ozannif-api/index.ts`.

The function is configured with gateway JWT verification disabled because the public contact action accepts anonymous submissions. Every other action independently validates the bearer token through Supabase Auth; admin actions additionally check the server-side `profiles.role`. Configure `ALLOWED_ORIGINS` explicitly before production. Public contact throttling is currently per-instance only and needs a durable rate limiter/CAPTCHA for a public launch.

Live route geocoding and directions will fail closed until `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` is configured. Proximity matching uses the latest driver GPS while online, with a configurable `MATCH_RADIUS_KM` (default 10 km); stale locations older than 60 seconds are not eligible. Fare quotes and trip creation will fail closed until active fare rules are reviewed and entered. Email delivery is optional and requires `RESEND_API_KEY`, `SUPPORT_EMAIL` and a verified `RESEND_FROM_EMAIL`. No production fare rates have been seeded.

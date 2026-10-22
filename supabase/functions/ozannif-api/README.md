# Ozannif Edge Function

The `ozannif-api` function is deployed to the connected Supabase project. The repository copy must be kept in sync with deployed versions; the current live version is tracked in Supabase.

## Actions

- `ensure-profile`: creates the user's profile if missing; driver intent creates a pending driver profile. It does not grant a privileged role.
- `geocode`: resolves a Morocco location through the configured Mapbox or Google geocoding API and limits results to the current Rabat–Salé service area.
- `quote`: calculates route distance/duration through the configured directions provider and uses an active database fare rule. Pricing model A is selected: the per-kilometre rate includes fuel, so no separate fuel component is added.
- `create-trip`: recalculates the route and fare on the server, persists a trip, and uses a caller-supplied UUID idempotency key.
- `partner-application`: persists a partner application as pending review.
- `vehicle-application`, `register-document`: persist vehicle applications and private driver-document metadata; files are stored in a non-public Storage bucket.
- `admin-review-document`, `admin-document-url`: allow admins to review document metadata and generate five-minute signed URLs for private files.
- `rental-request`: requires an approved driver profile and explicit acceptance of the recorded terms version.
- `contact`: saves a public contact message and sends a support email when Resend is configured. It has a best-effort per-instance rate limit; this is not a substitute for durable rate limiting or CAPTCHA.
- `my-trips`, `my-loyalty`, `driver-dashboard`: return authenticated, user-scoped dashboard data.
- `set-driver-availability`, `accept-trip`, `transition-trip`: enforce approved driver/vehicle checks and server-side trip state transitions.
- `admin-overview`, `admin-review`, `admin-create-fare-rule`, `admin-match-rental`: require an admin role stored in `profiles.role`; they are not available to ordinary users.

## Required deployment configuration

Supabase provides its own project URL and server database credentials to Edge Functions. Do not copy the service-role key to the client or repository.

Set the following secrets in Supabase Function Secrets before enabling real route pricing:
- `MAPBOX_ACCESS_TOKEN` **or** `GOOGLE_MAPS_API_KEY` (geocoding and driving directions)
- `ALLOWED_ORIGINS` as a comma-separated allowlist of the exact production and preview origins that should be allowed to call the function
- `RESEND_API_KEY`, `SUPPORT_EMAIL`, and a verified `RESEND_FROM_EMAIL` for support email delivery (optional; without these, messages are saved to the database only)

Restrict provider keys to the necessary APIs and usage limits. For Google Maps, enable Geocoding API and Directions API and configure billing/quotas. For Mapbox, enable Search and Directions.

## Fare rules

The function intentionally refuses to quote or create a trip when no active, time-valid fare rule exists for the requested vehicle class. Pricing model A is selected: passenger total = max(minimum fare, base fare + routed distance × per-km rate + routed duration × per-minute rate). The per-km rate is intended to include fuel; the API does not add a separate fuel component. Legacy fuel price and consumption columns remain in the schema for compatibility but are not used by this calculation. No production fare rules have been activated because the actual commercial price schedule still needs approval. Do not activate illustrative rates without validating fuel prices, vehicle costs, distance/time cost, driver net earnings and the platform fee.

## Security notes

- JWT verification at the gateway is disabled only because the same function accepts unauthenticated public contact submissions. All non-contact actions independently validate the bearer token against Supabase Auth before doing any work.
- Privileged database writes use server-side Supabase credentials, never browser-supplied roles.
- Public contact rate limiting is in-memory and resets when the function instance restarts. Add a durable IP/email rate limiter and CAPTCHA/Turnstile before broad public promotion.
- Add admin-only review, dispatch and fare-management endpoints only after a trusted admin account is provisioned through Supabase Auth app metadata or a controlled server-side procedure.
- Email delivery is not configured; contact messages are persisted to the database only.

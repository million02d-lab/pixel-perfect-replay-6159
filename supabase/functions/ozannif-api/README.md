# Ozannif Edge Function

The `ozannif-api` function is deployed to the connected Supabase project. The repository copy must be kept in sync with deployed versions.

## Actions

- `ensure-profile`: creates the user's profile if missing; driver intent creates a pending driver profile. It does not grant a privileged role.
- `geocode`: resolves a Morocco location through the configured Mapbox or Google geocoding API and limits results to the current Rabat–Salé service area.
- `quote`: calculates route distance/duration through the configured directions provider and uses an active database fare rule.
- `create-trip`: recalculates the route and fare on the server, persists a trip, and uses a caller-supplied UUID idempotency key.
- `partner-application`: persists a partner application as pending review.
- `rental-request`: requires an approved driver profile and explicit acceptance of the recorded terms version.
- `contact`: saves a public contact message. It has a best-effort per-instance rate limit; this is not a substitute for durable rate limiting or CAPTCHA.

## Required deployment configuration

Supabase provides its own project URL and server database credentials to Edge Functions. Do not copy the service-role key to the client or repository.

Set the following secrets in Supabase Function Secrets before enabling real route pricing:
- `MAPBOX_ACCESS_TOKEN` **or** `GOOGLE_MAPS_API_KEY` (geocoding and driving directions)
- `ALLOWED_ORIGINS` as a comma-separated allowlist of the exact production and preview origins that should be allowed to call the function

Restrict provider keys to the necessary APIs and usage limits. For Google Maps, enable Geocoding API and Directions API and configure billing/quotas. For Mapbox, enable Search and Directions.

## Fare rules

The function intentionally refuses to quote or create a trip when no active, time-valid fare rule exists for the requested vehicle class. No production fare rules have been activated because the commercial price schedule still needs approval. Do not activate illustrative rates without reviewing fuel prices, vehicle consumption, distance/time cost, driver net earnings and the platform fee.

## Security notes

- JWT verification at the gateway is disabled only because the same function accepts unauthenticated public contact submissions. All non-contact actions independently validate the bearer token against Supabase Auth before doing any work.
- Privileged database writes use server-side Supabase credentials, never browser-supplied roles.
- Public contact rate limiting is in-memory and resets when the function instance restarts. Add a durable IP/email rate limiter and CAPTCHA/Turnstile before broad public promotion.
- Add admin-only review, dispatch and fare-management endpoints only after a trusted admin account is provisioned through Supabase Auth app metadata or a controlled server-side procedure.
- Email delivery is not configured; contact messages are persisted to the database only.

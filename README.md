# Ozannif — Moroccan urban mobility

Ozannif is being developed for an initial Rabat and Salé service area. The frontend supports Arabic (RTL), French and English.

## Current repository status

The existing frontend has been connected to the Ozannif Supabase project, and an Edge Function (`ozannif-api`, deployed version 25 at the time of writing) now handles authenticated account provisioning, server-side fare quotes, trip creation and state changes, driver availability and proximity matching, driver/vehicle and partner applications, private driver-document metadata/review, rental requests and partner confirmation, loyalty points on trip completion, and admin operations.

The database foundation is applied: the public tables have RLS enabled, private driver-document storage is configured, and direct client-side table writes have been revoked so privileged changes must pass through the server-side API. The Supabase security advisor currently reports no security findings.

**Ozannif is not yet ready for public production launch.** Verified launch blockers and incomplete integrations:
- No active fare rules are configured for any vehicle class; quotes intentionally fail closed until approved rates and fuel/consumption inputs are entered.
- A real routing provider is not confirmed configured. `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` is required for live route distance/duration and server-side fare quotes.
- The map panel can show an OpenStreetMap embed when pickup and destination coordinates are resolved, but it does not yet show a live driver position or a route line; without resolved points it falls back to a visual placeholder. Passenger live tracking and real-time notifications are not finished.
- `RESEND_API_KEY`, `SUPPORT_EMAIL`, and a verified `RESEND_FROM_EMAIL` are needed for email delivery.
- The full loyalty reward redemption flow, cancellation/refund/payment integrations, and comprehensive operational monitoring still need implementation and testing.
- Legal, licensing, privacy, data-retention, consumer terms and Moroccan transport compliance require qualified local review before real rides.
- Driver and partner verification, account recovery redirect settings, admin bootstrap and end-to-end tests must be completed in the target deployment environment.

Do not advertise bookings or maps as live until provider configuration and end-to-end acceptance tests confirm the complete journey.

## Technology and structure

- React + TypeScript + TanStack Start
- Tailwind CSS
- Supabase project `OZANNIF` — initial schema and RLS baseline applied
- `src/i18n` — Arabic, French and English dictionaries and direction handling
- `src/components` — brand, navigation, footer and shared UI
- `src/features` — booking, map placeholder, forms, home sections and dashboards
- `src/lib/fare.ts` — illustrative fare calculation only
- `src/routes` — home, booking, services, FAQ, sign-in, sign-up, driver, partner, passenger, dashboard and legal pages

See [docs/supabase-baseline.md](docs/supabase-baseline.md) for the applied database foundation and its security boundaries. See [docs/admin-bootstrap.md](docs/admin-bootstrap.md) for secure administrator setup and required production secrets.

## Development commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — lint checks
- `npm test` — test suite

Run these commands locally or in CI after each change and record any existing baseline failures.

## Environment and secrets

See `.env.example` for placeholder configuration. Do not commit `.env`, API secrets, service-role keys, private keys or credentials. Public map keys must be restricted to approved origins. Server-only secrets belong in the hosting provider's secret store.

The Supabase project and client integration are in place. Set the project URL and publishable key explicitly in the deployment environment for each target domain. Never put a service-role or secret key in browser code.

## Production plan

See [docs/production-readiness-plan.md](docs/production-readiness-plan.md) for the phased delivery plan, architecture, security controls and acceptance criteria.

Core rules:
- Calculate and validate quotes, commissions, rewards and trip state transitions server-side.
- Use actual provider-supplied route distance and duration, never a pseudo-distance derived from address text.
- Enforce authorization server-side and apply row-level access control to exposed data.
- Persist auditable trip and commission events; make rewards idempotent.
- Do not show success for an action unless the backend/provider has confirmed it.
- Preserve the existing multilingual UI and work through reviewed branches and pull requests.

## Maps

`src/features/booking/MapPanel.tsx` renders an OpenStreetMap embed when valid coordinates are available and a decorative placeholder otherwise. A production implementation still needs a configured geocoding/directions provider, domain-restricted keys, a real route line, live driver tracking, route validation and server-side quote calculation. Do not label a map embed as live GPS.

## Launch gate

No production/security audit is complete. The deployed Edge Function requires map-provider secrets and an approved active fare schedule before quoting or accepting real rides. Launch only after account, booking, dispatch, pricing, contact, rental application, rewards, admin authorization, privacy, legal review and CI acceptance criteria in the production plan have passed.

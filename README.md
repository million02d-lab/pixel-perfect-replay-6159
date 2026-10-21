# Ozannif — Moroccan urban mobility

Ozannif is being developed for an initial Rabat and Salé service area. The frontend currently supports Arabic (RTL), French and English.

## Current repository status

This repository currently contains a **frontend foundation**, not a production ride-hailing service. The following flows are not yet connected to live services:
- account creation and sign-in
- booking persistence and driver dispatch
- real geocoding, route distance, duration and GPS tracking
- production pricing and commission calculations
- contact email delivery
- rental-driver application processing
- loyalty rewards and the operations/admin data layer

The interface contains illustrative pricing and simulated form/booking states. Do not advertise those as live services until the backend flows have been implemented and verified.

## Technology and structure

- React + TypeScript + TanStack Start
- Tailwind CSS
- `src/i18n` — Arabic, French and English dictionaries and direction handling
- `src/components` — brand, navigation, footer and shared UI
- `src/features` — booking, map placeholder, forms, home sections and dashboards
- `src/lib/fare.ts` — illustrative fare calculation
- `src/routes` — home, booking, services, FAQ, sign-in, sign-up, driver, partner, passenger, dashboard and legal pages

## Development commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — lint checks
- `npm test` — test suite

Run these commands locally or in CI after each change and record any existing baseline failures.

## Environment and secrets

See `.env.example` for placeholder configuration. Do not commit `.env`, API secrets, service-role keys, private keys or credentials. Public map keys must be restricted to approved origins. Server-only secrets belong in the hosting provider's secret store.

The repository mentions Supabase placeholders, but that does **not** confirm that a Supabase project is connected. Verify the current Lovable/deployment settings before selecting or changing the backend. Do not introduce a second backend without a deliberate migration plan.

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

`src/features/booking/MapPanel.tsx` currently renders a placeholder SVG. A production implementation needs a configured geocoding/directions provider, domain-restricted keys, route validation and server-side quote calculation. Do not label a placeholder map as live GPS.

## Launch gate

No production/security audit is complete. Launch only after account, booking, dispatch, pricing, contact, rental application, rewards, admin authorization, privacy, legal review and CI acceptance criteria in the production plan have passed.

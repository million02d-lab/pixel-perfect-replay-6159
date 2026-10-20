# Ozannif — Premium Moroccan Mobility (frontend preview)

Rabat & Salé launch. Brand name provisional. Arabic (RTL, default), French, English.

## Status
Everything here is **frontend demo**. No accounts, bookings, drivers, payments, maps or emails are connected. Demo states are labelled in the UI.

## Structure
- `src/i18n` — dictionaries (ar/fr/en) + provider (sets `lang`/`dir`)
- `src/components` — brand logo (editable SVG), header/footer, UI
- `src/features` — booking panel, map provider, forms, home sections, dashboards
- `src/lib/fare.ts` — illustrative fare estimate (tested in `fare.test.ts`)
- `src/routes` — pages: /, /services, /how-it-works, /safety, /about, /faq, /signin, /signup, /driver, /book, /partners, /passenger, /driver-dashboard, /admin, /privacy, /terms

## Environment
See `.env.example`. Never commit `.env`. Never put a service-role key in client code.

## Backend (next step)
Enable Lovable Cloud for auth + database. Planned tables: profiles, driver_profiles, vehicles, trips, trip_events, pricing_rules, ratings, rewards_ledger, rental_partners, transactions, marketing_preferences.
- RLS on every table; users read/write only their own rows.
- Roles in a separate `user_roles` table checked by a security-definer function — never trust client flags.
- Fare, commission, rewards, trip state transitions, matching and admin actions run in server functions only.

## Maps
`MapPanel` is a demo SVG. Replace with Mapbox or Google Maps: create a key, restrict it to your domains, enable billing, geocoding and directions. Route distance/ETA must come from the provider via the server.

## Security notes
No security audit has been performed. Before launch: rate limiting, input validation server-side, secure document uploads, audit logs, abuse prevention.

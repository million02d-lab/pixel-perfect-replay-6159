# Ozannif fare policy and launch tariff decisions

Status: **proposal for owner review — not an approved tariff**  
Scope: first launch in Rabat–Salé / nearby Temara. Currency: Moroccan dirham (MAD).

## Non-negotiable launch rules

1. Never activate a tariff until the owner has approved its values and representative routes have been tested.
2. A quote must use the server-calculated driving route, not client-provided distance or a browser-only estimate.
3. Show the passenger a clear final price before confirmation. Do not allow an unannounced price change after confirmation.
4. Show drivers the platform fee and estimated net amount before accepting a trip. Do not describe net earnings as profit: fuel, maintenance, insurance, depreciation and other costs still apply.
5. Keep the fare-rule ID and quoted price attached to each trip so later tariff edits do not silently change an existing booking.
6. If routing, an active tariff, or required fuel inputs are unavailable, fail closed and do not create a booking using a guessed/demo price.
7. Never treat public demo rates or UI pseudo-distance as operational prices.

## Current server-side quote model

The API currently calculates:

- distance_km = routed_distance_m / 1000
- duration_minutes = routed_duration_s / 60
- distance_component = distance_km × per_km_mad
- time_component = duration_minutes × per_minute_mad
- fuel_component = distance_km × fuel_price_mad_per_l × assumed_l_per_100km / 100
- passenger_total = max(minimum_fare_mad, base_fare_mad + distance_component + time_component + fuel_component)
- driver_net_before_other_costs = passenger_total − platform_fee_mad

This is the current implementation's calculation shape, not a recommendation that every component is commercially correct. The owner must decide whether per-km pricing already includes fuel; if it does, adding the fuel component again would double-count fuel. Before enabling rules, choose one consistent model and update implementation/tests if needed.

## Decisions required before activating fare rules

| Decision | Required owner choice | Why it matters |
|---|---|---|
| Pricing structure | Fixed destination/zone prices, or transparent distance + time formula | Product promise should match the quote engine. |
| Vehicle classes | Confirm economy, comfort, van and real eligibility criteria | Avoid unclear or misleading vehicle pricing. |
| Fuel treatment | Fuel included in per-km rate, or separate fuel component | Prevent double counting. |
| Driver fairness floor | Minimum driver net / minimum trip payout, including deadhead-distance policy | A fare can be profitable for the platform but unfair to a driver. |
| Platform fee | Fixed MAD per completed trip, percentage, or a clearly defined combination | Must be visible to the driver and reconcilable. |
| Waiting, cancellation, tolls | Decide if/how these are charged and who receives them | Avoid disputes and unpriced costs. |
| Rounding | Calculate internally with decimals, then use an owner-approved display rule | Consistency across quote, trip and receipt. |
| Quote expiry | Choose how long a quote remains valid; recalculate if expired | Prevent stale prices after route or tariff changes. |
| Promotions / free-hour reward | Define eligibility, cap, funding source and driver compensation before launch | A passenger reward must not silently reduce driver pay. |

## Owner's previously discussed example

A 30 MAD trip with a 2 MAD platform fee would leave 28 MAD to the driver before operating costs, if those values are approved and the trip is completed. This example is a discussion anchor only; it is not activated in Supabase and must not be presented as a live price.

## Suggested validation matrix

Before activation, manually compare quote results against route-provider results and the approved tariff for:

- a short trip near the minimum fare;
- a medium trip across Rabat;
- a Rabat–Salé crossing;
- each supported vehicle class;
- identical pickup and destination (must be rejected);
- coordinates outside the service area (must be rejected);
- unavailable routing, missing fuel inputs, expired tariff and no active rule (must fail closed);
- fee equal to the total, greater than the total, negative values, and non-finite values (must be rejected);
- a tariff change after a quote is created (existing quote/trip must retain its original fare-rule reference and agreed total).

Record input route distance/duration, tariff version, component breakdown, passenger total and driver net. Do not use made-up route distances as evidence.

## Activation checklist

- [ ] Owner approves the pricing structure and values.
- [ ] Product wording matches the actual price model (fixed destination price vs calculated route fare).
- [ ] Backend calculation and tests match the approved model.
- [ ] Driver net and fee are displayed before acceptance.
- [ ] Quote expiry and post-confirmation price-lock behavior are tested.
- [ ] Admin account is provisioned securely and only authorized staff can edit/activate rules.
- [ ] At least one complete passenger-to-driver trip has passed in the deployed environment.
- [ ] Moroccan transport, insurance, consumer, tax and privacy obligations are reviewed by qualified local advisers.

Until these are complete, leave public.fare_rules without active production rules and keep demo/preview notices visible.

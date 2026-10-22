# Ozannif distance-and-time tariff review (Model B)

Status: **owner review only — no production fare rules activated**
Launch area: Rabat–Salé / nearby Temara. Currency: MAD.

## Confirmed pricing decision

The owner selected **Model B: distance + time**. The server must calculate driving distance and duration from the configured routing provider and then apply an approved vehicle-class tariff:

`passenger_total = max(minimum_fare, base_fare + routed_km × per_km_rate + routed_minutes × per_minute_rate)`

Fuel is included in the per-kilometre rate; do not add a second fuel surcharge. The platform fee is deducted from the passenger fare for driver-net display; do not add it on top of the passenger total.

`driver_net_before_other_costs = passenger_total - platform_fee`

This is not driver profit: fuel, maintenance, insurance, depreciation and other costs remain the driver's operating costs.

## Tariff values to approve

No values below are approved. Existing demo constants in `src/lib/fare.ts` are mock UI values only and must not be copied into production without review.

| Vehicle class | Base fare (MAD) | Per km (MAD) | Per minute (MAD) | Minimum fare (MAD) | Platform fee per completed trip (MAD) | Owner decision |
|---|---:|---:|---:|---:|---:|---|
| Economy | **To approve** | **To approve** | **To approve** | **To approve** | **To approve** | Pending |
| Comfort | **To approve** | **To approve** | **To approve** | **To approve** | **To approve** | Pending |
| Van | **To approve** | **To approve** | **To approve** | **To approve** | **To approve** | Pending |

### Owner's previous example (not approved)

For a hypothetical completed trip priced at 30 MAD with a 2 MAD platform fee, the driver receives 28 MAD before operating costs. This example is a discussion anchor, not a live fare or tariff recommendation.

## Route validation worksheet

Fill this using actual routing-provider results and the final proposed tariff. Do not invent route distance or duration.

| Test route | Vehicle class | Provider distance (km) | Provider duration (min) | Fare result (MAD) | Platform fee (MAD) | Driver net before costs (MAD) | Decision |
|---|---|---:|---:|---:|---:|---:|---|
| Short trip in Rabat | Economy | Pending live test | Pending live test | Pending tariff | Pending tariff | Pending tariff | Not tested |
| Cross-city Rabat | Economy | Pending live test | Pending live test | Pending tariff | Pending tariff | Pending tariff | Not tested |
| Rabat to Salé | Economy | Pending live test | Pending live test | Pending tariff | Pending tariff | Pending tariff | Not tested |
| Representative comfort route | Comfort | Pending live test | Pending live test | Pending tariff | Pending tariff | Pending tariff | Not tested |
| Representative van route | Van | Pending live test | Pending live test | Pending tariff | Pending tariff | Pending tariff | Not tested |

## Required product and backend behavior

- Show the server-calculated final price and its components before the passenger confirms.
- Show the driver the fare, platform fee and expected net before accepting.
- Persist the route distance/duration, fare-rule ID, quoted total and fee on the trip so later tariff edits cannot alter an accepted price.
- Reject identical pickup/destination, invalid/out-of-service-area coordinates, missing route results, absent or expired tariff, and invalid fee values.
- Add a quote expiry policy and ensure the displayed quote cannot silently change after confirmation.
- Verify rounding behavior is consistent in the quote, trip, driver dashboard and receipt.
- Test that cancellation, waiting time, tolls, promotions and rewards have explicit rules before launch.
- Do not activate any rule until the owner approves values and route tests demonstrate reasonable driver net earnings.

## Acceptance checklist

- [x] Owner selected Model B (distance + time).
- [x] Fuel is included in the per-km rate; no separate fuel line is added.
- [ ] Owner approves values for all supported vehicle classes.
- [ ] Owner approves the platform fee and driver-net floor.
- [ ] Live route tests completed for representative Rabat, Salé and cross-city journeys.
- [ ] Passenger and driver interfaces display consistent quote breakdowns.
- [ ] Quote expiry, price locking, cancellation and rounding tests pass.
- [ ] Secure admin account is verified before fare-management actions are used.
- [ ] At least one full passenger-to-driver test trip passes in the deployed environment.
- [ ] Qualified local advisers review transport licensing, insurance, consumer, tax and privacy requirements.

**Release gate:** `public.fare_rules` must remain without active production rows until all required owner decisions and tests are complete.

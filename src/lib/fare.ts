/**
 * ILLUSTRATIVE fare estimate for the demo UI only.
 * Real fares, commissions and eligibility MUST be computed server-side.
 * Demo totals mirror model A's shape only: fuel is included in perKm, and the platform fee is deducted from the fare, not added to the passenger total.
 */
export type VehicleClass = "economy" | "comfort" | "van";

export const DEMO_RATES: Record<VehicleClass, { base: number; perKm: number; perMin: number; fee: number }> = {
  economy: { base: 8, perKm: 3, perMin: 0.4, fee: 2 },
  comfort: { base: 12, perKm: 4, perMin: 0.5, fee: 2 },
  van: { base: 18, perKm: 5, perMin: 0.6, fee: 3 },
};

export function estimateFare(vehicle: VehicleClass, distanceKm: number, durationMin: number) {
  const r = DEMO_RATES[vehicle];
  const km = Math.max(0, distanceKm);
  const min = Math.max(0, durationMin);
  const perKm = +(km * r.perKm).toFixed(2);
  const perMin = +(min * r.perMin).toFixed(2);
  const total = Math.round(r.base + perKm + perMin);
  return { base: r.base, perKm, perMin, fee: r.fee, total, driverNet: Math.max(0, +(total - r.fee).toFixed(2)) };
}

/** Deterministic pseudo-distance for demo routes (no real routing). */
export function demoDistance(a: string, b: string) {
  const s = (a + "|" + b).toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const km = 3 + (h % 120) / 10; // 3 – 15 km
  return { km: +km.toFixed(1), min: Math.round(km * 2.6 + 4) };
}

export function validateRoute(pickup: string, destination: string) {
  const p = pickup.trim(), d = destination.trim();
  return {
    pickup: p ? null : ("errPickup" as const),
    destination: !d ? ("errDest" as const) : p && p.toLowerCase() === d.toLowerCase() ? ("errSame" as const) : null,
  };
}

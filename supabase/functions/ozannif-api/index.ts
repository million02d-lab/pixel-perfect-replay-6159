import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN") ?? "";
const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const VEHICLES = new Set(["economy", "comfort", "van"]);
const CITIES = new Set(["Rabat", "Sale", "Temara", "Other"]);
const contactAttempts = new Map<string, { start: number; count: number }>();

type Json = Record<string, unknown>;
const json = (body: Json, status = 200, origin = "*") =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, idempotency-key", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
const fail = (message: string, status = 400, origin = "*") => json({ error: message }, status, origin);
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 240) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;
const num = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;

function originFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!origin) return "*";
  if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) return null;
  return origin;
}
async function userFrom(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || !SUPABASE_URL || !ANON_KEY) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, authorization: auth } });
  if (!r.ok) return null;
  const u = await r.json();
  return typeof u.id === "string" ? { id: u.id as string, email: typeof u.email === "string" ? u.email : null, metadata: isObj(u.user_metadata) ? u.user_metadata : {} } : null;
}
async function db(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Server database credentials are not configured.");
  const headers = new Headers(init.headers);
  headers.set("apikey", SERVICE_KEY);
  headers.set("authorization", `Bearer ${SERVICE_KEY}`);
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}
async function readFare(vehicle: string) {
  const r = await db(`fare_rules?select=id,base_fare_mad,per_km_mad,per_minute_mad,minimum_fare_mad,platform_fee_mad,valid_from,valid_until&vehicle_class=eq.${vehicle}&active=eq.true&order=valid_from.desc&limit=20`);
  if (!r.ok) throw new Error("Unable to read fare rules.");
  const rows = await r.json();
  const now = Date.now();
  return rows.find((x: Json) => Date.parse(String(x.valid_from)) <= now && (!x.valid_until || Date.parse(String(x.valid_until)) > now)) ?? null;
}
async function routeFor(aLat: number, aLng: number, bLat: number, bLng: number) {
  if (MAPBOX_TOKEN) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${aLng},${aLat};${bLng},${bLat}?overview=false&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("The route provider is temporarily unavailable.");
    const d = await r.json();
    const route = d.routes?.[0];
    if (!route || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) throw new Error("No drivable route was found.");
    return { distanceM: Math.round(route.distance), durationS: Math.round(route.duration) };
  }
  if (GOOGLE_MAPS_KEY) {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", `${aLat},${aLng}`);
    url.searchParams.set("destination", `${bLat},${bLng}`);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", GOOGLE_MAPS_KEY);
    const r = await fetch(url);
    if (!r.ok) throw new Error("The route provider is temporarily unavailable.");
    const d = await r.json();
    const route = d.routes?.[0]?.legs?.[0];
    if (d.status !== "OK" || !route || !Number.isFinite(route.distance?.value) || !Number.isFinite(route.duration?.value)) throw new Error("No drivable route was found.");
    return { distanceM: Math.round(route.distance.value), durationS: Math.round(route.duration.value) };
  }
  throw new Error("Live route calculation is not configured yet. Add MAPBOX_ACCESS_TOKEN or GOOGLE_MAPS_API_KEY to Supabase Edge Function secrets.");
}
async function quote(aLat: number, aLng: number, bLat: number, bLng: number, vehicle: string) {
  const route = await routeFor(aLat, aLng, bLat, bLng);
  const rule = await readFare(vehicle);
  if (!rule) throw new Error(`No active fare rule is configured for ${vehicle}. Add and approve a fare rule before accepting bookings.`);
  const km = route.distanceM / 1000;
  const minutes = route.durationS / 60;
  const base = Number(rule.base_fare_mad);
  const distance = km * Number(rule.per_km_mad);
  const time = minutes * Number(rule.per_minute_mad);
  const total = Math.max(Number(rule.minimum_fare_mad), base + distance + time);
  const fee = Number(rule.platform_fee_mad);
  if (![base, distance, time, total, fee].every(Number.isFinite) || total < 0 || fee < 0 || fee > total) throw new Error("The active fare rule is invalid.");
  return { route, ruleId: rule.id, vehicleClass: vehicle, currency: "MAD", breakdown: { base: round2(base), distance: round2(distance), time: round2(time), platformFee: round2(fee), total: round2(total), driverNetBeforeOtherCosts: round2(total - fee) } };
}
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

Deno.serve(async (req: Request) => {
  const origin = originFor(req);
  if (origin === null) return fail("Origin not allowed.", 403, "null");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, idempotency-key", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  if (req.method !== "POST") return fail("Method not allowed.", 405, origin);
  let body: Json;
  try { const parsed = await req.json(); if (!isObj(parsed)) return fail("Invalid request body.", 400, origin); body = parsed; }
  catch { return fail("Invalid JSON.", 400, origin); }

  const action = str(body.action, 40);
  const user = await userFrom(req);
  if (!user && action !== "contact") return fail("Sign in is required.", 401, origin);
  try {
    if (action === "ensure-profile") {
      const fullName = str(body.fullName, 120) ?? str(user.metadata.full_name, 120) ?? (user.email?.split("@")[0] ?? "Ozannif user");
      const phone = str(body.phone, 32);
      const language = body.language === "fr" || body.language === "en" ? body.language : "ar";
      const r = await db("profiles?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ id: user.id, full_name: fullName, phone, preferred_language: language }) });
      if (!r.ok) throw new Error("Could not create the account profile.");
      if (body.accountType === "driver") {
        const d = await db("driver_profiles?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: user.id }) });
        if (!d.ok) throw new Error("Profile created, but driver application setup failed.");
      }
      return json({ ok: true }, 200, origin);
    }

    if (action === "geocode") {
      const query = str(body.query, 200);
      if (!query) return fail("Enter a pickup or destination.", 422, origin);
      let point: { label: string; latitude: number; longitude: number } | null = null;
      if (MAPBOX_TOKEN) {
        const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
        url.searchParams.set("q", query);
        url.searchParams.set("country", "MA");
        url.searchParams.set("bbox", "-7.10,33.80,-6.50,34.20");
        url.searchParams.set("limit", "1");
        url.searchParams.set("access_token", MAPBOX_TOKEN);
        const r = await fetch(url);
        if (!r.ok) throw new Error("The geocoding provider is temporarily unavailable.");
        const d = await r.json();
        const feature = d.features?.[0];
        const coords = feature?.geometry?.coordinates;
        if (Array.isArray(coords) && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
          point = { label: str(feature.properties?.full_address, 240) ?? str(feature.properties?.name, 240) ?? query, longitude: coords[0], latitude: coords[1] };
        }
      } else if (GOOGLE_MAPS_KEY) {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("address", query);
        url.searchParams.set("components", "country:MA");
        url.searchParams.set("region", "ma");
        url.searchParams.set("bounds", "33.80,-7.10|34.20,-6.50");
        url.searchParams.set("key", GOOGLE_MAPS_KEY);
        const r = await fetch(url);
        if (!r.ok) throw new Error("The geocoding provider is temporarily unavailable.");
        const d = await r.json();
        const result = d.results?.[0];
        if (d.status === "OK" && result?.geometry?.location) {
          point = { label: str(result.formatted_address, 240) ?? query, latitude: result.geometry.location.lat, longitude: result.geometry.location.lng };
        }
      } else {
        throw new Error("Live geocoding is not configured. Add a Mapbox or Google Maps key to Supabase Edge Function secrets.");
      }
      if (!point || point.latitude < 33.80 || point.latitude > 34.20 || point.longitude < -7.10 || point.longitude > -6.50) {
        return fail("Choose a location within the current Rabat–Salé service area.", 422, origin);
      }
      return json({ point }, 200, origin);
    }

    if (action === "quote" || action === "create-trip") {
      const pickup = str(body.pickupLabel, 240), destination = str(body.destinationLabel, 240);
      const aLat = num(body.pickupLatitude, -90, 90), aLng = num(body.pickupLongitude, -180, 180);
      const bLat = num(body.destinationLatitude, -90, 90), bLng = num(body.destinationLongitude, -180, 180);
      const vehicle = typeof body.vehicleClass === "string" && VEHICLES.has(body.vehicleClass) ? body.vehicleClass : "economy";
      if (!pickup || !destination || aLat === null || aLng === null || bLat === null || bLng === null) return fail("Valid pickup/destination labels and coordinates are required.", 422, origin);
      if (Math.abs(aLat - bLat) < 0.00001 && Math.abs(aLng - bLng) < 0.00001) return fail("Pickup and destination must be different.", 422, origin);
      const q = await quote(aLat, aLng, bLat, bLng, vehicle);
      if (action === "quote") return json({ quote: { ...q, distanceKm: round2(q.route.distanceM / 1000), durationMinutes: Math.ceil(q.route.durationS / 60) } }, 200, origin);
      const key = req.headers.get("idempotency-key");
      if (!key || !/^[0-9a-f-]{36}$/i.test(key)) return fail("A UUID Idempotency-Key is required.", 422, origin);
      const check = await db(`trips?select=id,status,quoted_fare_mad,platform_fee_mad,route_distance_m,route_duration_s&passenger_id=eq.${user.id}&client_request_id=eq.${key}&limit=1`);
      if (!check.ok) throw new Error("Unable to check the booking request.");
      const existing = (await check.json())[0];
      if (existing) return json({ trip: existing, duplicate: true }, 200, origin);
      const trip = {
        passenger_id: user.id, client_request_id: key, pickup_label: pickup, pickup_latitude: aLat, pickup_longitude: aLng,
        destination_label: destination, destination_latitude: bLat, destination_longitude: bLng,
        route_distance_m: q.route.distanceM, route_duration_s: q.route.durationS, vehicle_class: vehicle,
        quoted_fare_mad: q.breakdown.total, platform_fee_mad: q.breakdown.platformFee, fare_rule_id: q.ruleId, status: "requested"
      };
      const r = await db("trips?select=id,status,quoted_fare_mad,platform_fee_mad,route_distance_m,route_duration_s,created_at", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(trip) });
      if (!r.ok) throw new Error("Booking could not be saved. Please try again.");
      const rows = await r.json();
      return json({ trip: rows[0], duplicate: false }, 201, origin);
    }

    if (action === "partner-application") {
      if (!user) return fail("Sign in is required to submit a partner application.", 401, origin);
      const businessName = str(body.businessName, 160);
      const email = str(body.email, 254);
      const city = typeof body.city === "string" && CITIES.has(body.city) ? body.city : null;
      const fleetSize = num(body.fleetSize, 1, 10000);
      if (!businessName || businessName.length < 2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !city || fleetSize === null || !Number.isInteger(fleetSize) || body.licensesConfirmed !== true) {
        return fail("Complete the partner details and confirm you hold the required transport authorizations.", 422, origin);
      }
      const r = await db("partner_profiles?on_conflict=owner_user_id&select=id,verification_status,created_at", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ owner_user_id: user.id, business_name: businessName, city, contact_email: email, fleet_size: fleetSize })
      });
      if (!r.ok) throw new Error("Partner application could not be saved.");
      return json({ application: (await r.json())[0] }, 201, origin);
    }

    if (action === "rental-request") {
      const city = typeof body.city === "string" && CITIES.has(body.city) ? body.city : null;
      const notes = body.notes == null ? null : str(body.notes, 1000);
      if (!city || (body.notes != null && notes === null)) return fail("Valid city and notes are required.", 422, origin);
      const driver = await db(`driver_profiles?select=user_id&user_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
      if (!driver.ok || (await driver.json()).length === 0) return fail("A verified driver profile is required before requesting a rental match.", 403, origin);
      if (body.termsAccepted !== true) return fail("Please accept the rental and commission terms first.", 422, origin);
      const r = await db("rental_requests?select=id,status,created_at", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ driver_id: user.id, city, notes, terms_version: "rental-v1", terms_accepted_at: new Date().toISOString() }) });
      if (!r.ok) throw new Error("Rental request could not be saved.");
      return json({ request: (await r.json())[0] }, 201, origin);
    }

    if (action === "contact") {
      const name = str(body.name, 120), email = str(body.email, 254), message = str(body.message, 5000);
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return fail("Valid name, email and message are required.", 422, origin);
      const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const now = Date.now();
      const previous = contactAttempts.get(ip);
      if (previous && now - previous.start < 10 * 60 * 1000 && previous.count >= 5) return fail("Too many messages. Please try again later.", 429, origin);
      if (!previous || now - previous.start >= 10 * 60 * 1000) contactAttempts.set(ip, { start: now, count: 1 });
      else contactAttempts.set(ip, { start: previous.start, count: previous.count + 1 });
      const r = await db("contact_messages?select=id,created_at", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ sender_id: user?.id ?? null, name, email, message }) });
      if (!r.ok) throw new Error("Message could not be saved.");
      return json({ message: (await r.json())[0] }, 201, origin);
    }
    return fail("Unknown action.", 400, origin);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected server error.";
    return fail(message, 503, origin);
  }
});

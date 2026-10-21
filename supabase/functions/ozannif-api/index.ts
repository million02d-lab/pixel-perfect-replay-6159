import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN") ?? "";
const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") ?? "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
const CONFIGURED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const DEFAULT_ORIGINS = ["https://pixel-perfect-replay-6159.lovable.app", "http://localhost:5173", "http://127.0.0.1:5173"];
const VEHICLES = new Set(["economy", "comfort", "van"]);
const CITIES = new Set(["Rabat", "Sale", "Temara", "Other"]);
const MATCH_RADIUS_KM = Math.min(30, Math.max(1, Number(Deno.env.get("MATCH_RADIUS_KM") ?? "10") || 10));
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
  const allowed = CONFIGURED_ORIGINS.length ? CONFIGURED_ORIGINS : DEFAULT_ORIGINS;
  if (!allowed.includes(origin)) return null;
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
  const r = await db(`fare_rules?select=id,base_fare_mad,per_km_mad,per_minute_mad,minimum_fare_mad,platform_fee_mad,fuel_price_mad_per_l,assumed_l_per_100km,valid_from,valid_until&vehicle_class=eq.${vehicle}&active=eq.true&order=valid_from.desc&limit=20`);
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
  const fuelPrice = rule.fuel_price_mad_per_l == null ? null : Number(rule.fuel_price_mad_per_l);
  const consumption = rule.assumed_l_per_100km == null ? null : Number(rule.assumed_l_per_100km);
  if (fuelPrice === null || consumption === null || fuelPrice <= 0 || consumption <= 0) throw new Error("The active fare rule is missing validated fuel price or vehicle consumption inputs.");
  const fuel = km * fuelPrice * consumption / 100;
  const total = Math.max(Number(rule.minimum_fare_mad), base + distance + time + fuel);
  const fee = Number(rule.platform_fee_mad);
  if (![base, distance, time, fuel, total, fee].every(Number.isFinite) || total < 0 || fee < 0 || fee > total) throw new Error("The active fare rule is invalid.");
  return { route, ruleId: rule.id, vehicleClass: vehicle, currency: "MAD", breakdown: { base: round2(base), distance: round2(distance), time: round2(time), fuel: round2(fuel), platformFee: round2(fee), total: round2(total), driverNetBeforeOtherCosts: round2(total - fee) } };
}
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const rad = (v: number) => v * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

async function isAdmin(userId: string) {
  const r = await db(`profiles?select=role&id=eq.${userId}&limit=1`);
  if (!r.ok) return false;
  const rows = await r.json();
  return rows[0]?.role === "admin";
}
async function appendTripEvent(tripId: string, actorId: string, eventType: string, details: Json = {}) {
  const r = await db("trip_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ trip_id: tripId, actor_id: actorId, event_type: eventType, details }) });
  if (!r.ok) throw new Error("Trip status changed, but the audit event could not be saved.");
}
async function exactCount(table: string, filters = "") {
  const r = await db(`${table}?select=id${filters}`, { method: "HEAD", headers: { Prefer: "count=exact" } });
  if (!r.ok) throw new Error("Could not load the admin overview.");
  const range = r.headers.get("content-range");
  const count = range?.split("/")[1];
  return count && count !== "*" ? Number(count) : 0;
}

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
      const r = await db("profiles?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ id: user.id, full_name: fullName, phone, preferred_language: language, role: body.accountType === "driver" ? "driver" : "passenger" }) });
      if (!r.ok) throw new Error("Could not create the account profile.");
      if (body.accountType === "driver") {
        const roleUpdate = await db(`profiles?id=eq.${user.id}&role=eq.passenger`, { method: "PATCH", body: JSON.stringify({ role: "driver" }) });
        if (!roleUpdate.ok) throw new Error("Could not update the account role.");
        const d = await db("driver_profiles?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: user.id }) });
        if (!d.ok) throw new Error("Profile created, but driver application setup failed.");
      }
      return json({ ok: true }, 200, origin);
    }

    if (action === "register-document") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const docType = typeof body.docType === "string" && ["identity", "driving_license", "vehicle_registration", "insurance"].includes(body.docType) ? body.docType : null;
      const storagePath = str(body.storagePath, 512);
      const filename = str(body.originalFilename, 180);
      const mimeType = typeof body.mimeType === "string" && ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(body.mimeType) ? body.mimeType : null;
      const fileSize = num(body.fileSizeBytes, 1, 10485760);
      if (!docType || !storagePath || !filename || !mimeType || fileSize === null || !Number.isInteger(fileSize) || !storagePath.startsWith(`${user.id}/${docType}/`) || storagePath.includes("..")) return fail("Invalid document metadata.", 422, origin);
      const driver = await db(`driver_profiles?select=user_id,verification_status&user_id=eq.${user.id}&limit=1`);
      if (!driver.ok) throw new Error("Could not verify the driver application.");
      const profile = (await driver.json())[0];
      if (!profile || ["rejected", "suspended"].includes(profile.verification_status)) return fail("A current driver application is required before uploading documents.", 403, origin);
      const r = await db("driver_documents?select=id,doc_type,review_status,created_at", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ driver_id: user.id, doc_type: docType, storage_path: storagePath, original_filename: filename, mime_type: mimeType, file_size_bytes: fileSize }),
      });
      if (!r.ok) throw new Error("Document metadata could not be saved.");
      return json({ document: (await r.json())[0] }, 201, origin);
    }

    if (action === "vehicle-application") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const make = str(body.make, 80), model = str(body.model, 80), plate = str(body.plateNumber, 24)?.toUpperCase();
      const color = body.color == null ? null : str(body.color, 60);
      const vehicle = typeof body.vehicleClass === "string" && VEHICLES.has(body.vehicleClass) ? body.vehicleClass : null;
      const seats = num(body.seats, 1, 15);
      if (!make || !model || !plate || plate.length < 2 || !vehicle || seats === null || !Number.isInteger(seats) || (body.color != null && color === null)) return fail("Complete the vehicle details with valid values.", 422, origin);
      const driver = await db(`driver_profiles?select=user_id,verification_status&user_id=eq.${user.id}&limit=1`);
      if (!driver.ok) throw new Error("Could not verify the driver application.");
      const profile = (await driver.json())[0];
      if (!profile || ["rejected", "suspended"].includes(profile.verification_status)) return fail("A current driver application is required before adding a vehicle.", 403, origin);
      const r = await db("vehicles?select=id,driver_id,make,model,plate_number,vehicle_class,seats,verification_status,created_at", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ driver_id: user.id, make, model, plate_number: plate, color, vehicle_class: vehicle, seats }),
      });
      if (!r.ok) {
        if (r.status === 409) return fail("This plate number is already registered.", 409, origin);
        throw new Error("Vehicle application could not be saved.");
      }
      return json({ vehicle: (await r.json())[0] }, 201, origin);
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
      await appendTripEvent(rows[0].id, user.id, "trip_requested", { vehicleClass: vehicle });
      return json({ trip: rows[0], duplicate: false }, 201, origin);
    }

    if (action === "my-trips") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const scope = body.scope === "driver" ? "driver" : "passenger";
      const column = scope === "driver" ? "driver_id" : "passenger_id";
      const r = await db(`trips?select=id,status,pickup_label,destination_label,vehicle_class,quoted_fare_mad,platform_fee_mad,route_distance_m,route_duration_s,created_at,matched_at,started_at,completed_at,cancelled_at,driver_id&${column}=eq.${user.id}&order=created_at.desc&limit=30`);
      if (!r.ok) throw new Error("Could not load your trips.");
      return json({ trips: await r.json() }, 200, origin);
    }

    if (action === "partner-dashboard") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const partnerResult = await db(`partner_profiles?select=id,business_name,city,verification_status&owner_user_id=eq.${user.id}&limit=1`);
      if (!partnerResult.ok) throw new Error("Could not load partner profile.");
      const partner = (await partnerResult.json())[0];
      if (!partner) return fail("An approved partner profile is required.", 403, origin);
      const requests = partner.verification_status === "approved" ? await db(`rental_requests?select=id,driver_id,city,notes,status,created_at,terms_accepted_at,partner_confirmed_at,commission_free_until,terms_version&partner_id=eq.${partner.id}&status=in.(matched,approved)&order=created_at.desc&limit=50`) : null;
      if (requests && !requests.ok) throw new Error("Could not load assigned rental requests.");
      return json({ partner, requests: requests ? await requests.json() : [] }, 200, origin);
    }

    if (action === "partner-confirm-rental") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const requestId = str(body.requestId, 64);
      if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId) || body.confirmed !== true) return fail("Confirm the rental agreement to continue.", 422, origin);
      const partnerResult = await db(`partner_profiles?select=id&owner_user_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
      if (!partnerResult.ok) throw new Error("Could not verify partner profile.");
      const partner = (await partnerResult.json())[0];
      if (!partner) return fail("An approved partner profile is required.", 403, origin);
      const now = new Date();
      const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const r = await db(`rental_requests?id=eq.${requestId}&partner_id=eq.${partner.id}&status=eq.matched&select=id,driver_id,partner_id,status,partner_confirmed_at,commission_free_until,terms_version`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "approved", partner_confirmed_at: now.toISOString(), commission_free_until: until, terms_version: "rental-v1-confirmed" }),
      });
      if (!r.ok) throw new Error("Rental confirmation could not be saved.");
      const rows = await r.json();
      if (!rows.length) return fail("This request is no longer awaiting partner confirmation.", 409, origin);
      return json({ request: rows[0] }, 200, origin);
    }

    if (action === "my-loyalty") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const r = await db(`loyalty_ledger?select=id,trip_id,points_delta,reason,created_at&passenger_id=eq.${user.id}&order=created_at.desc&limit=100`);
      if (!r.ok) throw new Error("Could not load loyalty history.");
      const entries = await r.json();
      return json({ points: entries.reduce((sum: number, row: Json) => sum + Number(row.points_delta), 0), entries }, 200, origin);
    }

    if (action === "driver-dashboard") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const driver = await db(`driver_profiles?select=verification_status&user_id=eq.${user.id}&limit=1`);
      if (!driver.ok) throw new Error("Could not load driver profile.");
      const driverProfile = (await driver.json())[0] ?? null;
      const presenceResult = await db(`driver_presence?select=online,last_seen_at,updated_at,latitude,longitude&user_id=eq.${user.id}&limit=1`);
      const presence = presenceResult.ok ? (await presenceResult.json())[0] ?? { online: false } : { online: false };
      const assignedResult = await db(`trips?select=id,status,pickup_label,destination_label,vehicle_class,quoted_fare_mad,platform_fee_mad,route_distance_m,route_duration_s,created_at,passenger_id&driver_id=eq.${user.id}&order=created_at.desc&limit=30`);
      if (!assignedResult.ok) throw new Error("Could not load assigned trips.");
      const rentalResult = await db(`rental_requests?select=id,city,notes,status,created_at,partner_id,partner_confirmed_at,commission_free_until&driver_id=eq.${user.id}&order=created_at.desc&limit=10`);
      if (!rentalResult.ok) throw new Error("Could not load rental request status.");
      let openTrips: Json[] = [];
      if (driverProfile?.verification_status === "approved") {
        const vehicles = await db(`vehicles?select=id&driver_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
        if (vehicles.ok && (await vehicles.json()).length > 0 && presence.online && Number.isFinite(presence.latitude) && Number.isFinite(presence.longitude) && Number.isFinite(Date.parse(String(presence.last_seen_at))) && Date.now() - Date.parse(String(presence.last_seen_at)) < 60000) {
          const open = await db("trips?select=id,status,pickup_label,destination_label,pickup_latitude,pickup_longitude,vehicle_class,quoted_fare_mad,platform_fee_mad,route_distance_m,route_duration_s,requested_at&status=eq.requested&driver_id=is.null&order=requested_at.asc&limit=100");
          if (open.ok) {
            const candidates = await open.json();
            openTrips = candidates.map((trip: Json) => ({
              ...trip,
              pickup_distance_km: round2(haversineKm(Number(presence.latitude), Number(presence.longitude), Number(trip.pickup_latitude), Number(trip.pickup_longitude))),
            })).filter((trip: Json) => Number(trip.pickup_distance_km) <= MATCH_RADIUS_KM)
              .sort((a: Json, b: Json) => Number(a.pickup_distance_km) - Number(b.pickup_distance_km))
              .slice(0, 20);
          }
        }
      }
      return json({ driverProfile, presence, assignedTrips: await assignedResult.json(), openTrips, rentalRequests: await rentalResult.json() }, 200, origin);
    }

    if (action === "update-driver-location") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const latitude = num(body.latitude, -90, 90);
      const longitude = num(body.longitude, -180, 180);
      if (latitude === null || longitude === null) return fail("Valid GPS coordinates are required.", 422, origin);
      const driver = await db(`driver_profiles?select=user_id&user_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
      if (!driver.ok || (await driver.json()).length === 0) return fail("Only approved drivers can share location.", 403, origin);
      const vehicles = await db(`vehicles?select=id&driver_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
      if (!vehicles.ok || (await vehicles.json()).length === 0) return fail("An approved vehicle is required to share location.", 403, origin);
      const r = await db(`driver_presence?user_id=eq.${user.id}&online=eq.true&select=user_id,online,latitude,longitude,last_seen_at`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ latitude, longitude, last_seen_at: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error("Driver location could not be saved.");
      const rows = await r.json();
      if (!rows.length) return fail("Go online before sharing your location.", 409, origin);
      return json({ presence: rows[0] }, 200, origin);
    }

    if (action === "set-driver-availability") {
      if (!user) return fail("Sign in is required.", 401, origin);
      if (typeof body.online !== "boolean") return fail("A valid online state is required.", 422, origin);
      if (body.online) {
        const driver = await db(`driver_profiles?select=user_id&user_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
        if (!driver.ok || (await driver.json()).length === 0) return fail("Your driver profile must be approved before going online.", 403, origin);
        const vehicles = await db(`vehicles?select=id&driver_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
        if (!vehicles.ok || (await vehicles.json()).length === 0) return fail("You need an approved vehicle before going online.", 403, origin);
      }
      const r = await db("driver_presence?on_conflict=user_id&select=user_id,online,last_seen_at,updated_at", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ user_id: user.id, online: body.online, last_seen_at: body.online ? new Date().toISOString() : null, latitude: null, longitude: null }),
      });
      if (!r.ok) throw new Error("Availability could not be saved.");
      return json({ presence: (await r.json())[0] }, 200, origin);
    }

    if (action === "admin-overview") {
      if (!user || !(await isAdmin(user.id))) return fail("Admin access required.", 403, origin);
      const [passengers, trips, pendingDrivers, pendingPartners, pendingVehicles, pendingDocuments, newMessages, driversQueue, partnersQueue, vehiclesQueue, documentsQueue, messagesQueue, rentalsQueue, approvedPartners] = await Promise.all([
        exactCount("profiles", "&role=eq.passenger"),
        exactCount("trips"),
        exactCount("driver_profiles", "&verification_status=eq.pending"),
        exactCount("partner_profiles", "&verification_status=eq.pending"),
        exactCount("vehicles", "&verification_status=eq.pending"),
        exactCount("driver_documents", "&review_status=eq.pending"),
        exactCount("contact_messages", "&status=eq.new"),
        db("driver_profiles?select=user_id,verification_status,created_at,profiles(full_name,phone)&verification_status=eq.pending&order=created_at.asc&limit=20").then(async r => r.ok ? await r.json() : []),
        db("partner_profiles?select=id,business_name,city,contact_email,fleet_size,verification_status,created_at&verification_status=eq.pending&order=created_at.asc&limit=20").then(async r => r.ok ? await r.json() : []),
        db("vehicles?select=id,driver_id,make,model,plate_number,vehicle_class,verification_status,created_at&verification_status=eq.pending&order=created_at.asc&limit=20").then(async r => r.ok ? await r.json() : []),
        db("driver_documents?select=id,driver_id,doc_type,storage_path,original_filename,mime_type,file_size_bytes,review_status,created_at&review_status=eq.pending&order=created_at.asc&limit=30").then(async r => r.ok ? await r.json() : []),
        db("contact_messages?select=id,name,email,message,status,created_at&status=eq.new&order=created_at.asc&limit=20").then(async r => r.ok ? await r.json() : []),
        db("rental_requests?select=id,driver_id,city,notes,status,created_at,terms_accepted_at&status=eq.pending&order=created_at.asc&limit=20").then(async r => r.ok ? await r.json() : []),
        db("partner_profiles?select=id,business_name,city&verification_status=eq.approved&order=business_name.asc&limit=100").then(async r => r.ok ? await r.json() : []),
      ]);
      return json({ overview: { passengers, trips, pendingDrivers, pendingPartners, pendingVehicles, pendingDocuments, newMessages }, queues: { drivers: driversQueue, partners: partnersQueue, vehicles: vehiclesQueue, documents: documentsQueue, messages: messagesQueue, rentals: rentalsQueue, approvedPartners } }, 200, origin);
    }

    if (action === "admin-document-url") {
      if (!user || !(await isAdmin(user.id))) return fail("Admin access required.", 403, origin);
      const documentId = str(body.documentId, 64);
      if (!documentId || !/^[0-9a-f-]{36}$/i.test(documentId)) return fail("A valid document ID is required.", 422, origin);
      const found = await db(`driver_documents?select=id,storage_path& id=eq.${documentId}&limit=1`.replace("& id=", "&id="));
      if (!found.ok) throw new Error("Could not find the document.");
      const doc = (await found.json())[0];
      if (!doc) return fail("Document not found.", 404, origin);
      const objectPath = String(doc.storage_path).split("/").map(encodeURIComponent).join("/");
      const signed = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/driver-documents/${objectPath}`, {
        method: "POST",
        headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 300 }),
      });
      if (!signed.ok) throw new Error("Could not create a temporary document link.");
      const signedData = await signed.json();
      const path = typeof signedData.signedURL === "string" ? signedData.signedURL : signedData.signedUrl;
      if (typeof path !== "string") throw new Error("The storage provider did not return a signed link.");
      return json({ url: path.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1${path.startsWith("/") ? path : `/${path}`}` }, 200, origin);
    }

    if (action === "admin-review-document") {
      if (!user || !(await isAdmin(user.id))) return fail("Admin access required.", 403, origin);
      const documentId = str(body.documentId, 64);
      const status = body.status;
      if (!documentId || !/^[0-9a-f-]{36}$/i.test(documentId) || !["approved", "rejected"].includes(String(status))) return fail("Valid document and review status are required.", 422, origin);
      const r = await db(`driver_documents?id=eq.${documentId}&select=id,driver_id,doc_type,review_status,reviewed_at`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ review_status: status, reviewed_at: new Date().toISOString(), reviewed_by: user.id }),
      });
      if (!r.ok) throw new Error("Document review could not be saved.");
      const rows = await r.json();
      if (!rows.length) return fail("Document not found.", 404, origin);
      return json({ document: rows[0] }, 200, origin);
    }

    if (action === "admin-review") {
      if (!user || !(await isAdmin(user.id))) return fail("Admin access required.", 403, origin);
      const targetType = body.targetType;
      const targetId = str(body.targetId, 64);
      const reviewStatus = body.status;
      if (!targetId || !/^[0-9a-f-]{36}$/i.test(targetId) || !["approved", "rejected", "suspended"].includes(String(reviewStatus))) return fail("Valid review target and status are required.", 422, origin);
      const targets: Record<string, { table: string; key: string }> = {
        driver: { table: "driver_profiles", key: "user_id" },
        vehicle: { table: "vehicles", key: "id" },
        partner: { table: "partner_profiles", key: "id" },
      };
      const target = typeof targetType === "string" ? targets[targetType] : undefined;
      if (!target) return fail("Unknown review target.", 422, origin);
      if (reviewStatus === "approved" && targetType === "driver") {
        const docs = await db(`driver_documents?select=doc_type&driver_id=eq.${targetId}&review_status=eq.approved&doc_type=in.(identity,driving_license)`);
        if (!docs.ok) throw new Error("Could not verify driver documents.");
        const types = new Set((await docs.json()).map((doc: Json) => doc.doc_type));
        if (!types.has("identity") || !types.has("driving_license")) return fail("Approve the identity and driving-license documents before approving the driver.", 409, origin);
      }
      if (reviewStatus === "approved" && targetType === "vehicle") {
        const vehicleResult = await db(`vehicles?select=driver_id&id=eq.${targetId}&limit=1`);
        if (!vehicleResult.ok) throw new Error("Could not verify the vehicle owner.");
        const vehicle = (await vehicleResult.json())[0];
        if (!vehicle) return fail("Vehicle not found.", 404, origin);
        const driverResult = await db(`driver_profiles?select=verification_status&user_id=eq.${vehicle.driver_id}&limit=1`);
        if (!driverResult.ok || (await driverResult.json())[0]?.verification_status !== "approved") return fail("Approve the driver before approving the vehicle.", 409, origin);
        const docs = await db(`driver_documents?select=doc_type&driver_id=eq.${vehicle.driver_id}&review_status=eq.approved&doc_type=in.(vehicle_registration,insurance)`);
        if (!docs.ok) throw new Error("Could not verify vehicle documents.");
        const types = new Set((await docs.json()).map((doc: Json) => doc.doc_type));
        if (!types.has("vehicle_registration") || !types.has("insurance")) return fail("Approve the vehicle registration and insurance documents before approving the vehicle.", 409, origin);
      }
      const r = await db(`${target.table}?${target.key}=eq.${targetId}&select=*`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ verification_status: reviewStatus, reviewed_at: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error("Review decision could not be saved.");
      const rows = await r.json();
      if (!rows.length) return fail("Review target not found.", 404, origin);
      return json({ reviewed: rows[0] }, 200, origin);
    }

    if (action === "admin-match-rental") {
      if (!user || !(await isAdmin(user.id))) return fail("Admin access required.", 403, origin);
      const requestId = str(body.requestId, 64);
      const partnerId = str(body.partnerId, 64);
      if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId) || !partnerId || !/^[0-9a-f-]{36}$/i.test(partnerId)) return fail("Valid rental request and partner IDs are required.", 422, origin);
      const partner = await db(`partner_profiles?select=id,city&id=eq.${partnerId}&verification_status=eq.approved&limit=1`);
      if (!partner.ok) throw new Error("Could not verify rental partner.");
      const partnerRow = (await partner.json())[0];
      if (!partnerRow) return fail("An approved rental partner is required.", 422, origin);
      const requestResult = await db(`rental_requests?select=id,city,terms_accepted_at&id=eq.${requestId}&status=eq.pending&limit=1`);
      if (!requestResult.ok) throw new Error("Could not verify rental request.");
      const requestRow = (await requestResult.json())[0];
      if (!requestRow) return fail("Rental request is no longer pending.", 409, origin);
      if (!requestRow.terms_accepted_at) return fail("The driver must accept rental terms before matching.", 409, origin);
      if (requestRow.city !== "Other" && partnerRow.city !== "Other" && requestRow.city !== partnerRow.city) return fail("Choose an approved partner in the same city.", 422, origin);
      const r = await db(`rental_requests?id=eq.${requestId}&status=eq.pending&select=id,driver_id,partner_id,status,commission_free_until,terms_version,terms_accepted_at,partner_confirmed_at`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ partner_id: partnerId, status: "matched", commission_free_until: null, partner_confirmed_at: null, terms_version: "rental-v1" }),
      });
      if (!r.ok) throw new Error("Rental request could not be matched.");
      const rows = await r.json();
      if (!rows.length) return fail("Rental request is no longer pending.", 409, origin);
      return json({ request: rows[0] }, 200, origin);
    }

    if (action === "admin-create-fare-rule") {
      if (!user || !(await isAdmin(user.id))) return fail("Admin access required.", 403, origin);
      const vehicle = typeof body.vehicleClass === "string" && VEHICLES.has(body.vehicleClass) ? body.vehicleClass : null;
      const base = num(body.baseFare, 0, 100000);
      const perKm = num(body.perKm, 0, 100000);
      const perMinute = num(body.perMinute, 0, 100000);
      const minimum = num(body.minimumFare, 0, 100000);
      const fee = num(body.platformFee, 0, 100000);
      const fuelPrice = body.fuelPrice == null ? null : num(body.fuelPrice, 0, 1000);
      const consumption = body.litersPer100Km == null ? null : num(body.litersPer100Km, 0, 100);
      const active = body.active === true;
      if (!vehicle || base === null || perKm === null || perMinute === null || minimum === null || fee === null || (body.fuelPrice != null && fuelPrice === null) || (body.litersPer100Km != null && consumption === null) || fee > minimum || (active && (fuelPrice === null || fuelPrice <= 0 || consumption === null || consumption <= 0))) {
        return fail("Invalid fare rule. Minimum fare must cover the platform fee.", 422, origin);
      }
      if (active) {
        const deactivate = await db(`fare_rules?vehicle_class=eq.${vehicle}&active=eq.true`, { method: "PATCH", body: JSON.stringify({ active: false }) });
        if (!deactivate.ok) throw new Error("Could not deactivate the previous fare rule.");
      }
      const r = await db("fare_rules?select=*", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ vehicle_class: vehicle, base_fare_mad: base, per_km_mad: perKm, per_minute_mad: perMinute, minimum_fare_mad: minimum, platform_fee_mad: fee, fuel_price_mad_per_l: fuelPrice, assumed_l_per_100km: consumption, active, valid_from: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error("Fare rule could not be saved.");
      return json({ fareRule: (await r.json())[0] }, 201, origin);
    }

    if (action === "accept-trip") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const tripId = str(body.tripId, 64);
      if (!tripId || !/^[0-9a-f-]{36}$/i.test(tripId)) return fail("A valid trip ID is required.", 422, origin);
      const driver = await db(`driver_profiles?select=user_id&user_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
      if (!driver.ok || (await driver.json()).length === 0) return fail("Only approved drivers can accept trips.", 403, origin);
      const vehicles = await db(`vehicles?select=id&driver_id=eq.${user.id}&verification_status=eq.approved&limit=1`);
      if (!vehicles.ok || (await vehicles.json()).length === 0) return fail("An approved vehicle is required before accepting trips.", 403, origin);
      const presence = await db(`driver_presence?select=online,latitude,longitude,last_seen_at&user_id=eq.${user.id}&limit=1`);
      if (!presence.ok) throw new Error("Could not verify driver availability.");
      const presenceRow = (await presence.json())[0];
      if (presenceRow?.online !== true || !Number.isFinite(presenceRow.latitude) || !Number.isFinite(presenceRow.longitude) || !Number.isFinite(Date.parse(String(presenceRow.last_seen_at))) || Date.now() - Date.parse(String(presenceRow.last_seen_at)) >= 60000) return fail("Go online and allow fresh location updates before accepting trips.", 409, origin);
      const candidateResult = await db(`trips?select=pickup_latitude,pickup_longitude&id=eq.${tripId}&status=eq.requested&driver_id=is.null&limit=1`);
      if (!candidateResult.ok) throw new Error("Could not verify trip availability.");
      const candidate = (await candidateResult.json())[0];
      if (!candidate) return fail("This trip is no longer available.", 409, origin);
      const pickupDistance = haversineKm(Number(presenceRow.latitude), Number(presenceRow.longitude), Number(candidate.pickup_latitude), Number(candidate.pickup_longitude));
      if (pickupDistance > MATCH_RADIUS_KM) return fail("This pickup is outside your current matching radius.", 403, origin);
      const rental = await db(`rental_requests?select=id&driver_id=eq.${user.id}&status=eq.approved&commission_free_until=gt.${new Date().toISOString()}&limit=1`);
      const commissionFree = rental.ok && (await rental.json()).length > 0;
      const r = await db(`trips?id=eq.${tripId}&status=eq.requested&driver_id=is.null&select=id,status,passenger_id,driver_id,quoted_fare_mad,platform_fee_mad`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ driver_id: user.id, status: "matched", matched_at: new Date().toISOString(), ...(commissionFree ? { platform_fee_mad: 0 } : {}) }),
      });
      if (!r.ok) throw new Error("Trip acceptance failed.");
      const rows = await r.json();
      if (!rows.length) return fail("This trip is no longer available.", 409, origin);
      await appendTripEvent(tripId, user.id, "driver_accepted", { commissionFree });
      return json({ trip: rows[0] }, 200, origin);
    }

    if (action === "transition-trip") {
      if (!user) return fail("Sign in is required.", 401, origin);
      const tripId = str(body.tripId, 64);
      const nextStatus = body.status;
      if (!tripId || !/^[0-9a-f-]{36}$/i.test(tripId) || !["driver_arriving", "in_progress", "completed", "cancelled"].includes(String(nextStatus))) return fail("Valid trip and status are required.", 422, origin);
      const currentResult = await db(`trips?select=id,passenger_id,driver_id,status,quoted_fare_mad,platform_fee_mad,matched_at& id=eq.${tripId}&limit=1`.replace("& id=", "&id="));
      if (!currentResult.ok) throw new Error("Could not load the trip.");
      const current = (await currentResult.json())[0];
      if (!current) return fail("Trip not found.", 404, origin);
      const isPassenger = current.passenger_id === user.id;
      const isDriver = current.driver_id === user.id;
      if (nextStatus === "completed" && current.status === "completed" && isDriver) {
        const ledger = await db(`loyalty_ledger?select=id&trip_id=eq.${tripId}&reason=eq.completed_trip&limit=1`);
        if (ledger.ok && (await ledger.json()).length === 0) {
          await db("loyalty_ledger", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ passenger_id: current.passenger_id, trip_id: tripId, points_delta: 1, reason: "completed_trip" }) });
        }
        return json({ trip: current, alreadyCompleted: true }, 200, origin);
      }
      const transitions: Record<string, string[]> = { requested: ["cancelled"], matched: ["driver_arriving", "cancelled"], driver_arriving: ["in_progress", "cancelled"], in_progress: ["completed"] };
      if (!(transitions[current.status] ?? []).includes(String(nextStatus))) return fail("This trip transition is not allowed.", 409, origin);
      if (nextStatus === "cancelled") {
        if (!((isPassenger && ["requested", "matched"].includes(current.status)) || (isDriver && ["matched", "driver_arriving"].includes(current.status)))) return fail("Only a trip participant can cancel at this stage.", 403, origin);
      } else if (!isDriver) return fail("Only the assigned driver can update this trip.", 403, origin);
      const patch: Json = { status: nextStatus };
      if (nextStatus === "driver_arriving") patch.matched_at = current.matched_at ?? new Date().toISOString();
      if (nextStatus === "in_progress") patch.started_at = new Date().toISOString();
      if (nextStatus === "completed") patch.completed_at = new Date().toISOString();
      if (nextStatus === "cancelled") patch.cancelled_at = new Date().toISOString();
      const updated = await db(`trips?id=eq.${tripId}&status=eq.${current.status}&select=id,status,passenger_id,driver_id,quoted_fare_mad,platform_fee_mad,completed_at,cancelled_at`, {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch),
      });
      if (!updated.ok) throw new Error("Trip status could not be updated.");
      const rows = await updated.json();
      if (!rows.length) return fail("Trip status changed elsewhere. Refresh and try again.", 409, origin);
      await appendTripEvent(tripId, user.id, `status_${String(nextStatus)}`);
      if (nextStatus === "completed") {
        const reward = await db("loyalty_ledger", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ passenger_id: current.passenger_id, trip_id: tripId, points_delta: 1, reason: "completed_trip" }),
        });
        if (!reward.ok) throw new Error("Trip completed, but the loyalty point could not be recorded; retry completion to reconcile it.");
      }
      return json({ trip: rows[0] }, 200, origin);
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
      const saved = (await r.json())[0];
      let emailSent = false;
      if (RESEND_API_KEY && SUPPORT_EMAIL && RESEND_FROM_EMAIL) {
        try {
          const mail = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: RESEND_FROM_EMAIL,
              to: [SUPPORT_EMAIL],
              subject: `New Ozannif contact message #${saved.id}`,
              text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
              reply_to: email,
            }),
          });
          emailSent = mail.ok;
        } catch { emailSent = false; }
      }
      return json({ message: saved, emailSent }, 201, origin);
    }
    return fail("Unknown action.", 400, origin);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected server error.";
    return fail(message, 503, origin);
  }
});

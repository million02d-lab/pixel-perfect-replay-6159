import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, RefreshCw } from "lucide-react";
import { BookingPanel } from "@/features/booking/BookingPanel";
import { MapPanel } from "@/features/booking/MapPanel";
import { DemoNotice } from "@/components/site/DemoBadge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { type VehicleClass } from "@/lib/fare";
import { invokeOzannif } from "@/lib/supabase";

type Search = { pickup?: string | undefined; destination?: string | undefined; vehicle?: VehicleClass | undefined };
type Point = { label: string; latitude: number; longitude: number };
type Quote = {
  quote: {
    ruleId: string;
    distanceKm: number;
    durationMinutes: number;
    breakdown: { base: number; distance: number; time: number; platformFee: number; total: number; driverNetBeforeOtherCosts: number };
  };
};
type CreatedTrip = { trip: { id: string; status: string; quoted_fare_mad: number; platform_fee_mad: number; route_distance_m: number; route_duration_s: number }; duplicate: boolean };

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    pickup: typeof s["pickup"] === "string" ? s["pickup"] : undefined,
    destination: typeof s["destination"] === "string" ? s["destination"] : undefined,
    vehicle: s["vehicle"] === "comfort" || s["vehicle"] === "van" || s["vehicle"] === "economy" ? s["vehicle"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a ride — Ozannif" },
      { name: "description", content: "Request an Ozannif ride in Rabat and Salé." },
      { property: "og:title", content: "Book a ride — Ozannif" },
      { property: "og:description", content: "Route, vehicle and server-calculated fare." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { t, lang } = useI18n();
  const s = Route.useSearch();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "submitting" | "created">("idle");
  const [error, setError] = useState("");
  const [points, setPoints] = useState<{ pickup: Point; destination: Point } | null>(null);
  const [quote, setQuote] = useState<Quote["quote"] | null>(null);
  const [trip, setTrip] = useState<CreatedTrip["trip"] | null>(null);
  const [requestKey, setRequestKey] = useState<string | null>(null);
  const ready = Boolean(s.pickup?.trim() && s.destination?.trim());
  const vehicle = s.vehicle ?? "economy";
  const labels = {
    ar: { loading: "جارٍ تحديد المواقع وحساب السعر من الخادم…", unavailable: "خاصك تسجل الدخول باش تحسب السعر وتطلب رحلة.", retry: "إعادة المحاولة", request: "تأكيد طلب الرحلة", submitting: "جارٍ حفظ الطلب…", created: "تسجل طلب الرحلة بنجاح. ما زال خاص تعيين سائق.", noFare: "ما كايناش قاعدة تسعير مفعّلة لهاد الفئة حالياً. ما غاديش نخمّن الثمن.", route: "المسار", km: "كم", min: "دقيقة", id: "رقم الطلب", driverNet: "حصة السائق قبل مصاريفه", quote: "الثمن المعتمد من الخادم", login: "تسجيل الدخول" },
    fr: { loading: "Recherche des lieux et calcul du tarif côté serveur…", unavailable: "Connectez-vous pour calculer le tarif et demander une course.", retry: "Réessayer", request: "Confirmer la demande", submitting: "Enregistrement…", created: "Demande enregistrée. Un chauffeur doit encore être affecté.", noFare: "Aucune règle tarifaire active pour cette catégorie. Aucun prix ne sera inventé.", route: "Itinéraire", km: "km", min: "min", id: "Référence", driverNet: "Part chauffeur avant ses frais", quote: "Tarif calculé côté serveur", login: "Se connecter" },
    en: { loading: "Resolving locations and calculating the server-side fare…", unavailable: "Sign in to calculate a fare and request a ride.", retry: "Retry", request: "Confirm ride request", submitting: "Saving request…", created: "Ride request saved. A driver still needs to be assigned.", noFare: "No active fare rule exists for this category. No price will be guessed.", route: "Route", km: "km", min: "min", id: "Request ID", driverNet: "Driver share before operating costs", quote: "Server-calculated fare", login: "Sign in" },
  }[lang];

  useEffect(() => {
    let cancelled = false;
    if (!ready) {
      setStatus("idle"); setError(""); setPoints(null); setQuote(null); setTrip(null); setRequestKey(null);
      return () => { cancelled = true; };
    }
    setStatus("loading"); setError(""); setPoints(null); setQuote(null); setTrip(null); setRequestKey(null);
    (async () => {
      try {
        const [pickupResult, destinationResult] = await Promise.all([
          invokeOzannif<{ point: Point }>({ action: "geocode", query: s.pickup }),
          invokeOzannif<{ point: Point }>({ action: "geocode", query: s.destination }),
        ]);
        if (cancelled) return;
        const resolved = { pickup: pickupResult.point, destination: destinationResult.point };
        setPoints(resolved);
        const result = await invokeOzannif<Quote>({
          action: "quote",
          pickupLabel: resolved.pickup.label,
          pickupLatitude: resolved.pickup.latitude,
          pickupLongitude: resolved.pickup.longitude,
          destinationLabel: resolved.destination.label,
          destinationLatitude: resolved.destination.latitude,
          destinationLongitude: resolved.destination.longitude,
          vehicleClass: vehicle,
        });
        if (cancelled) return;
        setQuote(result.quote);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : labels.unavailable;
        setError(message);
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [ready, s.pickup, s.destination, vehicle, lang]);

  const createTrip = async () => {
    if (!points || !quote) return;
    const key = requestKey ?? crypto.randomUUID();
    setRequestKey(key);
    setStatus("submitting"); setError("");
    try {
      const result = await invokeOzannif<CreatedTrip>({
        action: "create-trip",
        pickupLabel: points.pickup.label,
        pickupLatitude: points.pickup.latitude,
        pickupLongitude: points.pickup.longitude,
        destinationLabel: points.destination.label,
        destinationLatitude: points.destination.latitude,
        destinationLongitude: points.destination.longitude,
        vehicleClass: vehicle,
      }, { idempotencyKey: key });
      setTrip(result.trip);
      setStatus("created");
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.unavailable);
      setStatus("error");
    }
  };
  const row = (k: string, v: string) => <div className="flex justify-between gap-4 py-1.5"><dt className="text-muted-foreground">{k}</dt><dd dir="ltr" className="text-end font-medium">{v}</dd></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-primary">{t.nav.book}</h1>
      <BookingPanel key={`${s.pickup}-${s.destination}-${vehicle}`} initial={s} />
      <div className="mt-6"><DemoNotice /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MapPanel pickup={s.pickup} destination={s.destination} pickupPoint={points?.pickup} destinationPoint={points?.destination} />
        <section className="rounded-2xl border bg-card p-6 shadow-soft" aria-live="polite">
          <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-primary">{t.fare.title}</h2></div>
          {status === "loading" && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{labels.loading}</p>}
          {status === "error" && (
            <div className="mt-4 space-y-3 rounded-lg bg-destructive/10 p-3 text-sm">
              <p role="alert">{error}</p>
              {error.toLowerCase().includes("sign in") || error.includes("تسجل الدخول") ? <Link to="/signin" className="inline-flex font-semibold text-primary underline">{labels.login}</Link> : <Button type="button" variant="outline" onClick={() => window.location.reload()}><RefreshCw className="me-2 h-4 w-4" />{labels.retry}</Button>}
            </div>
          )}
          {quote && points && status !== "error" ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">{labels.route}: {points.pickup.label} → {points.destination.label}</p>
              <dl className="mt-3 divide-y text-sm">
                {row(t.booking.vehicle, t.vehicles[vehicle])}
                {row(t.fare.distance, `${quote.distanceKm} ${labels.km}`)}
                {row(t.fare.duration, `${quote.durationMinutes} ${labels.min}`)}
                {row(t.fare.base, `${quote.breakdown.base.toFixed(2)} MAD`)}
                {row(t.fare.perKm, `${quote.breakdown.distance.toFixed(2)} MAD`)}
                {row(t.fare.perMin, `${quote.breakdown.time.toFixed(2)} MAD`)}
                {row(t.fare.fee, `${quote.breakdown.platformFee.toFixed(2)} MAD`)}
              </dl>
              <div className="mt-4 flex items-end justify-between border-t-2 border-gold pt-4">
                <span className="font-semibold">{labels.quote}</span>
                <span dir="ltr" className="text-3xl font-extrabold text-primary">{quote.breakdown.total.toFixed(2)} MAD</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{labels.driverNet}: {quote.breakdown.driverNetBeforeOtherCosts.toFixed(2)} MAD. {t.fare.note}</p>
              {status === "created" && trip ? (
                <p role="status" className="mt-4 rounded-lg bg-success/10 p-3 text-sm"><CheckCircle2 className="me-2 inline h-4 w-4 text-success" />{labels.created}<span className="mt-1 block break-all" dir="ltr">{labels.id}: {trip.id}</span></p>
              ) : (
                <Button size="lg" className="mt-4 w-full" onClick={createTrip} disabled={status === "submitting" || status === "loading"}>
                  {status === "submitting" ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{labels.submitting}</> : labels.request}
                </Button>
              )}
            </>
          ) : status === "idle" ? <p className="mt-4 text-muted-foreground">{t.booking.title}</p> : null}
        </section>
      </div>
    </div>
  );
}

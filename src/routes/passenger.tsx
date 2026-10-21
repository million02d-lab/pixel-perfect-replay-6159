import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel, Stat } from "@/features/dashboard/DashShell";
import { Button } from "@/components/ui/button";
import { invokeOzannif } from "@/lib/supabase";

type Trip = { id: string; status: string; pickup_label: string; destination_label: string; vehicle_class: string; quoted_fare_mad: number; route_distance_m: number | null; route_duration_s: number | null; created_at: string; driver_id: string | null };
type TripResponse = { trips: Trip[] };
type LoyaltyResponse = { points: number; entries: { id: string; points_delta: number; reason: string; created_at: string }[] };

export const Route = createFileRoute("/passenger")({
  head: () => seo("Passenger dashboard", "Your Ozannif rides, history and loyalty balance."),
  component: Page,
});

function Page() {
  const { t, lang } = useI18n();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyTrip, setBusyTrip] = useState("");
  const [error, setError] = useState("");
  const labels = {
    ar: { current: "الرحلات الحالية", history: "سجل الرحلات", points: "نقاط الولاء", login: "سجّل الدخول باش تشوف رحلاتك.", signin: "تسجيل الدخول", loading: "جارٍ تحميل بياناتك…", cancel: "إلغاء الرحلة", cancelled: "تلغات الرحلة.", error: "تعذر تحميل البيانات.", pending: "في انتظار سائق", matched: "تم تعيين سائق", arriving: "السائق في الطريق", progress: "الرحلة جارية", completed: "مكتملة", cancelledStatus: "ملغاة", empty: "ما عندك حتى رحلة مسجلة دابا." },
    fr: { current: "Courses en cours", history: "Historique des courses", points: "Points fidélité", login: "Connectez-vous pour consulter vos courses.", signin: "Se connecter", loading: "Chargement de vos données…", cancel: "Annuler la course", cancelled: "Course annulée.", error: "Impossible de charger les données.", pending: "En attente d'un chauffeur", matched: "Chauffeur affecté", arriving: "Chauffeur en route", progress: "Course en cours", completed: "Terminée", cancelledStatus: "Annulée", empty: "Aucune course enregistrée pour le moment." },
    en: { current: "Current rides", history: "Ride history", points: "Loyalty points", login: "Sign in to view your rides.", signin: "Sign in", loading: "Loading your data…", cancel: "Cancel ride", cancelled: "Ride cancelled.", error: "Unable to load your data.", pending: "Waiting for a driver", matched: "Driver assigned", arriving: "Driver on the way", progress: "Ride in progress", completed: "Completed", cancelledStatus: "Cancelled", empty: "You do not have any rides yet." },
  }[lang];
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [tripResult, loyaltyResult] = await Promise.all([
        invokeOzannif<TripResponse>({ action: "my-trips", scope: "passenger" }),
        invokeOzannif<LoyaltyResponse>({ action: "my-loyalty" }),
      ]);
      setTrips(tripResult.trips);
      setPoints(loyaltyResult.points);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    } finally { setLoading(false); }
  }, [lang]);
  useEffect(() => { void load(); }, [load]);
  const cancel = async (tripId: string) => {
    setBusyTrip(tripId); setError("");
    try {
      await invokeOzannif({ action: "transition-trip", tripId, status: "cancelled" });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : labels.error); }
    finally { setBusyTrip(""); }
  };
  const statusLabel = (status: string) => ({ requested: labels.pending, matched: labels.matched, driver_arriving: labels.arriving, in_progress: labels.progress, completed: labels.completed, cancelled: labels.cancelledStatus }[status] ?? status);
  const active = trips.filter((trip) => ["requested", "matched", "driver_arriving", "in_progress"].includes(trip.status));
  const history = trips.filter((trip) => !["requested", "matched", "driver_arriving", "in_progress"].includes(trip.status));
  const tripCard = (trip: Trip) => (
    <article key={trip.id} className="grid gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-primary">{trip.pickup_label} → {trip.destination_label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(trip.created_at).toLocaleString(lang)}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{statusLabel(trip.status)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span dir="ltr">{Number(trip.quoted_fare_mad).toFixed(2)} MAD</span>
        {trip.route_distance_m ? <span dir="ltr">{(trip.route_distance_m / 1000).toFixed(1)} km</span> : null}
      </div>
      {["requested", "matched"].includes(trip.status) && <Button variant="outline" size="sm" disabled={busyTrip === trip.id} onClick={() => void cancel(trip.id)}>{busyTrip === trip.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <XCircle className="me-2 h-4 w-4" />}{labels.cancel}</Button>}
    </article>
  );
  return (
    <DashShell title={t.dash.passengerT}>
      <Panel title={labels.points}><Stat value={String(points)} label="pts" /></Panel>
      <Panel title={labels.current} wide>
        {loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{labels.loading}</p>
          : error && trips.length === 0 ? <div className="grid gap-3"><p role="alert" className="text-sm text-destructive">{error}</p><Button asChild><Link to="/signin">{labels.signin}</Link></Button></div>
          : active.length ? <div className="grid gap-3">{active.map(tripCard)}</div>
          : <Empty text={labels.empty} />}
        {error && trips.length > 0 ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/book">{t.nav.book}</Link></Button><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="me-2 h-4 w-4" />{labels.loading.includes("Loading") ? "Refresh" : labels.loading.includes("Chargement") ? "Actualiser" : "تحديث"}</Button></div>
      </Panel>
      <Panel title={labels.history} wide>
        {history.length ? <div className="grid gap-3">{history.map(tripCard)}</div> : <Empty text={labels.empty} />}
      </Panel>
    </DashShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel, Stat } from "@/features/dashboard/DashShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { invokeOzannif } from "@/lib/supabase";

type Trip = { id: string; status: string; pickup_label: string; destination_label: string; vehicle_class: string; quoted_fare_mad: number; platform_fee_mad?: number; route_distance_m: number | null; route_duration_s: number | null; created_at?: string; requested_at?: string };
type Dashboard = { driverProfile: { verification_status: string } | null; presence: { online: boolean; updated_at?: string } ; assignedTrips: Trip[]; openTrips: Trip[] };

export const Route = createFileRoute("/driver-dashboard")({
  head: () => seo("Driver dashboard", "Driver availability, trip requests and trip status on Ozannif."),
  component: Page,
});

function Page() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const labels = {
    ar: { online: "متصل لاستقبال الطلبات", offline: "غير متصل", pending: "طلبك كسائق ما زال قيد المراجعة.", noProfile: "سجّل كـسائق أولاً.", noVehicle: "خاصك سيارة موثّقة قبل استقبال الرحلات.", open: "طلبات متاحة", assigned: "رحلاتي", accept: "قبول الرحلة", arriving: "وصلت إلى نقطة الانطلاق", start: "بدء الرحلة", complete: "إنهاء الرحلة", cancel: "إلغاء", refresh: "تحديث", loading: "جارٍ تحميل لوحة السائق…", empty: "لا توجد رحلات هنا حالياً.", earnings: "الصافي قبل مصاريف السيارة", login: "تسجيل الدخول", status: "الحالة", onlineError: "لا يمكن الاتصال قبل الموافقة على السائق والسيارة." },
    fr: { online: "En ligne pour recevoir des courses", offline: "Hors ligne", pending: "Votre candidature chauffeur est en cours de vérification.", noProfile: "Inscrivez-vous d'abord comme chauffeur.", noVehicle: "Un véhicule vérifié est nécessaire avant de recevoir des courses.", open: "Courses disponibles", assigned: "Mes courses", accept: "Accepter", arriving: "Arrivé au point de départ", start: "Démarrer la course", complete: "Terminer la course", cancel: "Annuler", refresh: "Actualiser", loading: "Chargement du tableau chauffeur…", empty: "Aucune course pour le moment.", earnings: "Net avant frais du véhicule", login: "Se connecter", status: "Statut", onlineError: "Le chauffeur et le véhicule doivent être approuvés avant la connexion." },
    en: { online: "Online to receive trips", offline: "Offline", pending: "Your driver application is still under review.", noProfile: "Apply as a driver first.", noVehicle: "An approved vehicle is required before receiving trips.", open: "Available trips", assigned: "My trips", accept: "Accept trip", arriving: "Driver is at pickup", start: "Start trip", complete: "Complete trip", cancel: "Cancel", refresh: "Refresh", loading: "Loading driver dashboard…", empty: "No trips here yet.", earnings: "Driver net before vehicle costs", login: "Sign in", status: "Status", onlineError: "Driver and vehicle approval are required before going online." },
  }[lang];
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await invokeOzannif<Dashboard>({ action: "driver-dashboard" })); }
    catch (e) { setError(e instanceof Error ? e.message : labels.loading); }
    finally { setLoading(false); }
  }, [lang]);
  useEffect(() => { void load(); }, [load]);
  const availability = async (online: boolean) => {
    setBusy("availability"); setError("");
    try { await invokeOzannif({ action: "set-driver-availability", online }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.onlineError); }
    finally { setBusy(""); }
  };
  const accept = async (tripId: string) => {
    setBusy(tripId); setError("");
    try { await invokeOzannif({ action: "accept-trip", tripId }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.empty); }
    finally { setBusy(""); }
  };
  const transition = async (tripId: string, status: string) => {
    setBusy(tripId); setError("");
    try { await invokeOzannif({ action: "transition-trip", tripId, status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.empty); }
    finally { setBusy(""); }
  };
  const statusLabel = (status: string) => ({ requested: lang === "ar" ? "بانتظار سائق" : lang === "fr" ? "En attente" : "Requested", matched: lang === "ar" ? "تم القبول" : lang === "fr" ? "Acceptée" : "Accepted", driver_arriving: lang === "ar" ? "في الطريق" : lang === "fr" ? "En route" : "En route", in_progress: lang === "ar" ? "جارية" : lang === "fr" ? "En cours" : "In progress", completed: lang === "ar" ? "مكتملة" : lang === "fr" ? "Terminée" : "Completed", cancelled: lang === "ar" ? "ملغاة" : lang === "fr" ? "Annulée" : "Cancelled" }[status] ?? status);
  const tripCard = (trip: Trip, isOpen: boolean) => {
    const next = trip.status === "matched" ? "driver_arriving" : trip.status === "driver_arriving" ? "in_progress" : trip.status === "in_progress" ? "completed" : null;
    const nextLabel = trip.status === "matched" ? labels.arriving : trip.status === "driver_arriving" ? labels.start : labels.complete;
    return (
      <article key={trip.id} className="grid gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="font-semibold text-primary">{trip.pickup_label} → {trip.destination_label}</p><p className="mt-1 text-xs text-muted-foreground">{trip.route_distance_m ? `${(trip.route_distance_m / 1000).toFixed(1)} km` : "—"}</p></div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{statusLabel(trip.status)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p dir="ltr" className="font-bold">{(Number(trip.quoted_fare_mad) - Number(trip.platform_fee_mad ?? 0)).toFixed(2)} MAD</p><p className="text-xs text-muted-foreground">{labels.earnings}</p></div>
          {isOpen ? <Button size="sm" onClick={() => void accept(trip.id)} disabled={busy === trip.id}>{busy === trip.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}{labels.accept}</Button>
            : <div className="flex flex-wrap gap-2">{next && <Button size="sm" onClick={() => void transition(trip.id, next)} disabled={busy === trip.id}>{busy === trip.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{nextLabel}</Button>}{["matched", "driver_arriving"].includes(trip.status) && <Button size="sm" variant="outline" onClick={() => void transition(trip.id, "cancelled")} disabled={busy === trip.id}>{labels.cancel}</Button>}</div>}
        </div>
      </article>
    );
  };
  return (
    <DashShell title={t.dash.driverT}>
      {error && <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {loading ? <Panel title={labels.loading}><Loader2 className="h-5 w-5 animate-spin" /></Panel> : !data?.driverProfile ? (
        <Panel title={labels.noProfile}><p className="text-sm text-muted-foreground">{labels.noProfile}</p><Button asChild className="mt-3"><Link to="/driver">{t.becomeDriver}</Link></Button></Panel>
      ) : data.driverProfile.verification_status !== "approved" ? (
        <Panel title={labels.status}><p className="text-sm text-muted-foreground">{labels.pending}</p><p className="mt-2 text-xs">{data.driverProfile.verification_status}</p></Panel>
      ) : (
        <>
          <Panel title={t.dash.availability}>
            <label className="flex items-center gap-3"><Switch checked={Boolean(data.presence?.online)} onCheckedChange={(checked) => void availability(checked)} disabled={busy === "availability"} aria-label={labels.online} /><span className="font-semibold">{data.presence?.online ? labels.online : labels.offline}</span></label>
            <p className="mt-2 text-xs text-muted-foreground">{labels.noVehicle}</p>
          </Panel>
          <Panel title={labels.open} wide>{data.openTrips.length ? <div className="grid gap-3">{data.openTrips.map((trip) => tripCard(trip, true))}</div> : <Empty text={labels.empty} />}</Panel>
          <Panel title={labels.assigned} wide>{data.assignedTrips.length ? <div className="grid gap-3">{data.assignedTrips.map((trip) => tripCard(trip, false))}</div> : <Empty text={labels.empty} />}</Panel>
        </>
      )}
      <div className="flex justify-end"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="me-2 h-4 w-4" />{labels.refresh}</Button></div>
    </DashShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel, Stat } from "@/features/dashboard/DashShell";
import { Button } from "@/components/ui/button";
import { invokeOzannif } from "@/lib/supabase";

type Overview = { passengers: number; trips: number; pendingDrivers: number; pendingPartners: number; pendingVehicles: number; pendingDocuments: number; newMessages: number };
type Queue = {
  drivers: { user_id: string; verification_status: string; created_at: string; profiles?: { full_name?: string; phone?: string | null } }[];
  partners: { id: string; business_name: string; city: string; contact_email: string; fleet_size: number; verification_status: string; created_at: string }[];
  vehicles: { id: string; driver_id: string; make: string; model: string; plate_number: string; vehicle_class: string; verification_status: string; created_at: string }[];
  messages: { id: string; name: string; email: string; message: string; status: string; created_at: string }[];
  rentals: { id: string; driver_id: string; city: string; notes: string | null; status: string; created_at: string; terms_accepted_at: string | null }[];
  documents: { id: string; driver_id: string; doc_type: string; storage_path: string; original_filename: string; mime_type: string; file_size_bytes: number; review_status: string; created_at: string }[];
  approvedPartners: { id: string; business_name: string; city: string }[];
};
type AdminData = { overview: Overview; queues: Queue };

export const Route = createFileRoute("/admin")({
  head: () => ({ ...seo("Admin console", "Restricted Ozannif operations console."), meta: [...seo("Admin console", "Restricted Ozannif operations console.").meta, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ vehicleClass: "economy", baseFare: "", perKm: "", perMinute: "", minimumFare: "", platformFee: "", fuelPrice: "", litersPer100Km: "", active: false });
  const [fareMessage, setFareMessage] = useState("");
  const [rentalPartner, setRentalPartner] = useState("");
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const labels = {
    ar: { load: "جارٍ تحميل لوحة الإدارة…", denied: "خاصك تدخل بحساب عندو صلاحية الإدارة.", signIn: "تسجيل الدخول", drivers: "طلبات السائقين", partners: "طلبات الشركاء", vehicles: "طلبات السيارات", documents: "وثائق التحقق", messages: "رسائل التواصل", view: "عرض آمن", approve: "موافقة", reject: "رفض", empty: "ما كاين حتى طلب معلّق.", refresh: "تحديث", pricingNote: "ما تفعّلش التسعير حتى تتأكد من الوقود، استهلاك السيارات، دخل السائق والعمولة.", vehicle: "فئة السيارة", base: "ثمن الانطلاق", perKm: "لكل كيلومتر (بدون الوقود)", perMinute: "لكل دقيقة", minimum: "الحد الأدنى", fee: "عمولة المنصة", fuel: "ثمن اللتر (اختياري)", consumption: "لتر/100 كم (اختياري)", activate: "تفعيل هاد القاعدة", save: "حفظ قاعدة التسعير", saved: "تسجلات قاعدة التسعير.", draft: "تسجلات كقاعدة غير مفعّلة.", pending: "معلّق", admin: "صلاحيات الإدارة مطلوبة.", rentals: "طلبات كراء السيارات", match: "مطابقة مع شريك", rentalTerms: "فترة 7 أيام بلا عمولة كتبدأ غير من بعد ما الشريك يأكد الكراء الفعلي.", noPartners: "ما كاين حتى شريك معتمد متاح." },
    fr: { load: "Chargement de la console…", denied: "Connectez-vous avec un compte administrateur.", signIn: "Se connecter", drivers: "Candidatures chauffeurs", partners: "Candidatures partenaires", vehicles: "Véhicules à vérifier", documents: "Documents de vérification", messages: "Messages reçus", view: "Ouvrir le document", approve: "Approuver", reject: "Refuser", empty: "Aucune demande en attente.", refresh: "Actualiser", pricingNote: "N'activez les tarifs qu'après validation du carburant, de la consommation, du revenu chauffeur et de la commission.", vehicle: "Catégorie", base: "Prise en charge", perKm: "Par km (hors carburant)", perMinute: "Par minute", minimum: "Tarif minimum", fee: "Commission plateforme", fuel: "Prix du litre (facultatif)", consumption: "L/100 km (facultatif)", activate: "Activer cette règle", save: "Enregistrer le tarif", saved: "Règle tarifaire enregistrée.", draft: "Règle enregistrée en brouillon.", pending: "En attente", admin: "Droits administrateur requis.", rentals: "Demandes de location de véhicule", match: "Associer un partenaire", rentalTerms: "La période de 7 jours sans commission commence uniquement après confirmation effective de la location par le partenaire.", noPartners: "Aucun partenaire agréé disponible." },
    en: { load: "Loading admin console…", denied: "Sign in with an account that has admin privileges.", signIn: "Sign in", drivers: "Driver applications", partners: "Partner applications", vehicles: "Vehicle reviews", documents: "Verification documents", messages: "Contact messages", view: "Open secure document", approve: "Approve", reject: "Reject", empty: "No pending items.", refresh: "Refresh", pricingNote: "Do not activate fares until fuel cost, vehicle consumption, driver earnings and commission have been reviewed.", vehicle: "Vehicle class", base: "Base fare", perKm: "Per kilometre (excluding fuel)", perMinute: "Per minute", minimum: "Minimum fare", fee: "Platform fee", fuel: "Fuel price per litre (optional)", consumption: "Litres per 100 km (optional)", activate: "Activate this rule", save: "Save fare rule", saved: "Fare rule saved.", draft: "Fare rule saved as inactive.", pending: "Pending", admin: "Admin privileges required.", rentals: "Driver rental requests", match: "Match partner", rentalTerms: "The seven-day commission-free period starts only after the partner confirms the actual rental.", noPartners: "No approved partners are available." },
  }[lang];
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await invokeOzannif<AdminData>({ action: "admin-overview" })); }
    catch (e) { setError(e instanceof Error ? e.message : labels.admin); }
    finally { setLoading(false); }
  }, [lang]);
  useEffect(() => { void load(); }, [load]);
  const review = async (targetType: "driver" | "partner" | "vehicle", targetId: string, status: "approved" | "rejected") => {
    setBusy(targetId); setError("");
    try { await invokeOzannif({ action: "admin-review", targetType, targetId, status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.admin); }
    finally { setBusy(""); }
  };
  const reviewDocument = async (documentId: string, status: "approved" | "rejected") => {
    setBusy(documentId); setError("");
    try { await invokeOzannif({ action: "admin-review-document", documentId, status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.admin); }
    finally { setBusy(""); }
  };
  const openDocument = async (documentId: string) => {
    setBusy(documentId); setError("");
    try {
      const result = await invokeOzannif<{ url: string }>({ action: "admin-document-url", documentId });
      setDocumentUrls((previous) => ({ ...previous, [documentId]: result.url }));
    } catch (e) { setError(e instanceof Error ? e.message : labels.admin); }
    finally { setBusy(""); }
  };
  const matchRental = async (requestId: string) => {
    if (!rentalPartner) { setError(labels.noPartners); return; }
    setBusy(requestId); setError("");
    try { await invokeOzannif({ action: "admin-match-rental", requestId, partnerId: rentalPartner }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.admin); }
    finally { setBusy(""); }
  };
  const createFare = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("fare"); setFareMessage(""); setError("");
    try {
      await invokeOzannif({ action: "admin-create-fare-rule", vehicleClass: form.vehicleClass, baseFare: Number(form.baseFare), perKm: Number(form.perKm), perMinute: Number(form.perMinute), minimumFare: Number(form.minimumFare), platformFee: Number(form.platformFee), fuelPrice: form.fuelPrice === "" ? null : Number(form.fuelPrice), litersPer100Km: form.litersPer100Km === "" ? null : Number(form.litersPer100Km), active: form.active });
      setFareMessage(form.active ? labels.saved : labels.draft);
    } catch (e) { setError(e instanceof Error ? e.message : labels.admin); }
    finally { setBusy(""); }
  };
  const reviewButtons = (type: "driver" | "partner" | "vehicle", id: string) => <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void review(type, id, "approved")} disabled={busy === id}>{busy === id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{labels.approve}</Button><Button size="sm" variant="outline" onClick={() => void review(type, id, "rejected")} disabled={busy === id}>{labels.reject}</Button></div>;
  return (
    <DashShell title={t.dash.adminT} note={t.dash.adminNote}>
      {error && <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {loading && !data ? <Panel title={labels.load}><Loader2 className="h-5 w-5 animate-spin" /></Panel> : !data ? <Panel title={labels.admin}><p className="text-sm text-muted-foreground">{labels.denied}</p><Button asChild className="mt-3"><Link to="/signin">{labels.signIn}</Link></Button></Panel> : (
        <>
          <Panel title={t.dash.passengers}><Stat value={String(data.overview.passengers)} /></Panel>
          <Panel title={t.dash.trips}><Stat value={String(data.overview.trips)} /></Panel>
          <Panel title={labels.drivers}><Stat value={String(data.overview.pendingDrivers)} label={labels.pending} /></Panel>
          <Panel title={labels.partners}><Stat value={String(data.overview.pendingPartners)} label={labels.pending} /></Panel>
          <Panel title={labels.vehicles}><Stat value={String(data.overview.pendingVehicles)} label={labels.pending} /></Panel>
          <Panel title={labels.documents}><Stat value={String(data.overview.pendingDocuments)} label={labels.pending} /></Panel>
          <Panel title={labels.messages}><Stat value={String(data.overview.newMessages)} /></Panel>
          <Panel title={labels.drivers} wide>
            {data.queues.drivers.length ? <div className="grid gap-3">{data.queues.drivers.map((item) => <article key={item.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{item.profiles?.full_name ?? item.user_id}</p><p className="text-xs text-muted-foreground">{item.profiles?.phone ?? item.user_id}</p></div>{reviewButtons("driver", item.user_id)}</article>)}</div> : <Empty text={labels.empty} />}
          </Panel>
          <Panel title={labels.partners} wide>
            {data.queues.partners.length ? <div className="grid gap-3">{data.queues.partners.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{item.business_name}</p><p className="text-xs text-muted-foreground">{item.city} · {item.contact_email} · {item.fleet_size}</p></div>{reviewButtons("partner", item.id)}</article>)}</div> : <Empty text={labels.empty} />}
          </Panel>
          <Panel title={labels.vehicles} wide>
            {data.queues.vehicles.length ? <div className="grid gap-3">{data.queues.vehicles.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{item.make} {item.model} · {item.plate_number}</p><p className="text-xs text-muted-foreground">{item.vehicle_class} · {item.driver_id}</p></div>{reviewButtons("vehicle", item.id)}</article>)}</div> : <Empty text={labels.empty} />}
          </Panel>
          <Panel title={labels.documents} wide>
            {data.queues.documents.length ? <div className="grid gap-3">{data.queues.documents.map((item) => <article key={item.id} className="grid gap-3 rounded-lg border p-3">
              <div><p className="font-semibold">{({ identity: labels.documents, driving_license: lang === "ar" ? "رخصة السياقة" : lang === "fr" ? "Permis de conduire" : "Driving licence", vehicle_registration: lang === "ar" ? "البطاقة الرمادية" : lang === "fr" ? "Carte grise" : "Vehicle registration", insurance: lang === "ar" ? "التأمين" : lang === "fr" ? "Assurance" : "Insurance" } as Record<string, string>)[item.doc_type] ?? item.doc_type} · {item.original_filename}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.driver_id} · {(item.file_size_bytes / 1024 / 1024).toFixed(2)} MB · {item.mime_type}</p></div>
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void openDocument(item.id)} disabled={busy === item.id}>{busy === item.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{labels.view}</Button>{documentUrls[item.id] && <a className="inline-flex items-center rounded-md border px-3 py-2 text-sm underline" href={documentUrls[item.id]} target="_blank" rel="noreferrer">Open (5 min)</a>}<Button size="sm" onClick={() => void reviewDocument(item.id, "approved")} disabled={busy === item.id}>{labels.approve}</Button><Button size="sm" variant="outline" onClick={() => void reviewDocument(item.id, "rejected")} disabled={busy === item.id}>{labels.reject}</Button></div>
            </article>)}</div> : <Empty text={labels.empty} />}
          </Panel>
          <Panel title={labels.rentals} wide>
            <p className="mb-3 text-sm text-muted-foreground">{labels.rentalTerms}</p>
            {data.queues.rentals.length ? <div className="grid gap-3">{data.queues.rentals.map((item) => <article key={item.id} className="grid gap-3 rounded-lg border p-3">
              <div><p className="font-semibold">{item.city} · {item.driver_id}</p><p className="mt-1 text-sm text-muted-foreground">{item.notes || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{item.terms_accepted_at ? new Date(item.terms_accepted_at).toLocaleString(lang) : ""}</p></div>
              {data.queues.approvedPartners.length ? <div className="flex flex-wrap gap-2"><select aria-label={labels.partners} className="min-w-48 rounded-lg border bg-card px-3 py-2 text-sm" value={rentalPartner} onChange={(e) => setRentalPartner(e.target.value)}><option value="">{labels.partners}</option>{data.queues.approvedPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.business_name} · {partner.city}</option>)}</select><Button size="sm" onClick={() => void matchRental(item.id)} disabled={busy === item.id || !rentalPartner}>{busy === item.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{labels.match}</Button></div> : <p className="text-sm text-muted-foreground">{labels.noPartners}</p>}
            </article>)}</div> : <Empty text={labels.empty} />}
          </Panel>
          <Panel title={labels.messages} wide>
            {data.queues.messages.length ? <div className="grid gap-3">{data.queues.messages.map((item) => <article key={item.id} className="rounded-lg border p-3"><p className="font-semibold">{item.name} · <a className="underline" href={`mailto:${item.email}`}>{item.email}</a></p><p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString(lang)}</p></article>)}</div> : <Empty text={labels.empty} />}
          </Panel>
          <Panel title={t.dash.pricing} wide>
            <p className="mb-4 text-sm text-muted-foreground">{labels.pricingNote}</p>
            <form onSubmit={createFare} className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm">{labels.vehicle}<select className="rounded-lg border bg-card px-3 py-2" value={form.vehicleClass} onChange={(e) => setForm({ ...form, vehicleClass: e.target.value })}><option value="economy">{t.vehicles.economy}</option><option value="comfort">{t.vehicles.comfort}</option><option value="van">{t.vehicles.van}</option></select></label>
              {([[ "baseFare", labels.base ], [ "perKm", labels.perKm ], [ "perMinute", labels.perMinute ], [ "minimumFare", labels.minimum ], [ "platformFee", labels.fee ], [ "fuelPrice", labels.fuel ], [ "litersPer100Km", labels.consumption ]] as const).map(([key, label]) => <label key={key} className="grid gap-1 text-sm">{label}<input className="rounded-lg border bg-card px-3 py-2" type="number" step="0.01" required={form.active || !["fuelPrice", "litersPer100Km"].includes(key)} min={form.active && ["fuelPrice", "litersPer100Km"].includes(key) ? 0.01 : 0} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
              <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />{labels.activate}</label>
              {fareMessage && <p role="status" className="text-sm text-success md:col-span-2">{fareMessage}</p>}
              <Button type="submit" disabled={busy === "fare"} className="md:col-span-2">{busy === "fare" ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="me-2 h-4 w-4" />}{labels.save}</Button>
            </form>
          </Panel>
        </>
      )}
      <div className="flex justify-end"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="me-2 h-4 w-4" />{labels.refresh}</Button></div>
    </DashShell>
  );
}

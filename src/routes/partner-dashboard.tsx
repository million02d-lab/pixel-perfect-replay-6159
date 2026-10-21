import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel } from "@/features/dashboard/DashShell";
import { Button } from "@/components/ui/button";
import { invokeOzannif } from "@/lib/supabase";

type RentalRequest = { id: string; driver_id: string; city: string; notes: string | null; status: string; created_at: string; terms_accepted_at: string | null; contact_sharing_accepted_at: string | null; partner_confirmed_at: string | null; commission_free_until: string | null; terms_version: string | null; driverContact: { id: string; full_name: string; phone: string | null } | null };
type PartnerData = { partner: { id: string; business_name: string; city: string; verification_status: string }; requests: RentalRequest[] };

export const Route = createFileRoute("/partner-dashboard")({
  head: () => ({ ...seo("Partner dashboard", "Review driver rental requests and confirm rental matches."), meta: [...seo("Partner dashboard", "Review driver rental requests and confirm rental matches.").meta, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { lang, t } = useI18n();
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const labels = {
    ar: { title: "لوحة الشريك", loading: "جارٍ تحميل الطلبات…", pending: "طلب الشراكة ديالك ما زال قيد المراجعة.", none: "ما عندكش طلبات كراء مسندة حالياً.", requests: "طلبات السائقين", confirm: "تأكيد الكراء وبدء 7 أيام بلا عمولة", terms: "أكد فقط بعد الاتفاق الفعلي مع السائق على الكراء والسيارة. هاد التأكيد كيبدا فترة 7 أيام بلا عمولة المنصة.", started: "تأكد الكراء. فترة بلا العمولة تنتهي في:", refresh: "تحديث", login: "تسجيل الدخول", apply: "طلب شراكة", match: "مطابقة", noPhone: "ما عطاش السائق رقم الهاتف فالحساب ديالو." },
    fr: { title: "Espace partenaire", loading: "Chargement des demandes…", pending: "Votre candidature partenaire est encore en cours de vérification.", none: "Aucune demande de location ne vous est attribuée.", requests: "Demandes des chauffeurs", confirm: "Confirmer la location et démarrer 7 jours sans commission", terms: "Confirmez uniquement après accord réel avec le chauffeur sur la location et le véhicule. Cette confirmation démarre les 7 jours sans commission plateforme.", started: "Location confirmée. La période sans commission se termine le :", refresh: "Actualiser", login: "Se connecter", apply: "Devenir partenaire", match: "Mise en relation", noPhone: "Aucun numéro de téléphone n’est renseigné sur le profil du chauffeur." },
    en: { title: "Partner dashboard", loading: "Loading requests…", pending: "Your partner application is still under review.", none: "No rental requests are assigned to you yet.", requests: "Driver rental requests", confirm: "Confirm rental and start 7 commission-free days", terms: "Confirm only after you and the driver have actually agreed on the rental and vehicle. This confirmation starts the 7-day platform-commission-free period.", started: "Rental confirmed. Commission-free period ends:", refresh: "Refresh", login: "Sign in", apply: "Apply as partner", match: "Matched", noPhone: "No phone number is available in the driver profile." },
  }[lang];
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await invokeOzannif<PartnerData>({ action: "partner-dashboard" })); }
    catch (e) { setError(e instanceof Error ? e.message : labels.loading); }
    finally { setLoading(false); }
  }, [lang]);
  useEffect(() => { void load(); }, [load]);
  const confirm = async (requestId: string) => {
    setBusy(requestId); setError("");
    try { await invokeOzannif({ action: "partner-confirm-rental", requestId, confirmed: true }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : labels.none); }
    finally { setBusy(""); }
  };
  return (
    <DashShell title={labels.title}>
      {error && <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {loading && !data ? <Panel title={labels.loading}><Loader2 className="h-5 w-5 animate-spin" /></Panel> : !data ? (
        <Panel title={labels.title}><p className="text-sm text-muted-foreground">{error || labels.pending}</p><div className="mt-3 flex gap-2"><Button asChild><Link to="/signin">{labels.login}</Link></Button><Button variant="outline" asChild><Link to="/partners">{labels.apply}</Link></Button></div></Panel>
      ) : (
        <>
          <Panel title={data.partner.business_name}>
            <p className="text-sm text-muted-foreground">{data.partner.city}</p>
            <p className="mt-2 text-sm">{data.partner.verification_status === "approved" ? (lang === "ar" ? "الشريك معتمد" : lang === "fr" ? "Partenaire agréé" : "Approved partner") : labels.pending}</p>
          </Panel>
          <Panel title={labels.requests} wide>
            {data.partner.verification_status !== "approved" ? (
              <p className="text-sm text-muted-foreground">{labels.pending}</p>
            ) : data.requests.length > 0 ? (
              <div className="grid gap-3">
                {data.requests.map((item) => (
                  <article key={item.id} className="grid gap-3 rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{item.city} · {item.driverContact?.full_name || labels.match}</p>
                      {item.driverContact?.phone ? <p className="mt-1 text-sm" dir="ltr"><a className="font-semibold text-primary underline" href={`tel:${item.driverContact.phone}`}>{item.driverContact.phone}</a></p> : <p className="mt-1 text-xs text-muted-foreground">{labels.noPhone}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">{item.notes || "—"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.terms_accepted_at ? new Date(item.terms_accepted_at).toLocaleString(lang) : ""}</p>
                    </div>
                    {item.status === "matched" ? (
                      <>
                        <p className="text-xs text-muted-foreground">{labels.terms}</p>
                        <Button onClick={() => void confirm(item.id)} disabled={busy === item.id}>
                          {busy === item.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                          {labels.confirm}
                        </Button>
                      </>
                    ) : (
                      <p role="status" className="rounded-lg bg-success/10 p-3 text-sm">
                        {labels.started} {item.commission_free_until ? new Date(item.commission_free_until).toLocaleString(lang) : "—"}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Empty text={labels.none} />
            )}
          </Panel>
        </>
      )}
      <div className="flex justify-end"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="me-2 h-4 w-4" />{labels.refresh}</Button></div>
    </DashShell>
  );
}

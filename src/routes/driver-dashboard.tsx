import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel, Stat } from "@/features/dashboard/DashShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DemoBadge } from "@/components/site/DemoBadge";

export const Route = createFileRoute("/driver-dashboard")({
  head: () => seo("Driver dashboard", "Availability, requests, earnings and documents for Ozannif drivers (demo)."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const [online, setOnline] = useState(false);
  const [req, setReq] = useState<"open" | "accepted" | "declined">("open");
  return (
    <DashShell title={t.dash.driverT}>
      <Panel title={t.dash.availability}>
        <label className="flex items-center gap-3">
          <Switch checked={online} onCheckedChange={setOnline} aria-label={t.dash.availability} />
          <span className="font-semibold">{online ? t.dash.online : t.dash.offline}</span>
        </label>
      </Panel>
      <Panel title={t.dash.incoming} wide>
        {online && req === "open" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary p-4">
            <div><DemoBadge /><p className="mt-1 font-semibold">Agdal → Marina Bouregreg</p><p dir="ltr" className="text-sm text-muted-foreground">6.2 km · ≈ 38 MAD</p></div>
            <div className="flex gap-2"><Button onClick={() => setReq("accepted")}>{t.dash.accept}</Button><Button variant="outline" onClick={() => setReq("declined")}>{t.dash.decline}</Button></div>
          </div>
        ) : online ? <p className="text-sm">{req === "accepted" ? `✓ ${t.dash.accept}` : t.dash.decline} — {t.demo}</p> : <Empty text={t.dash.offline} />}
      </Panel>
      <Panel title={t.dash.earnings}><Stat value="0 MAD" /> <DemoBadge className="mt-2" /></Panel>
      <Panel title={t.dash.commission}><Stat value="—" /><p className="mt-1 text-xs text-muted-foreground">{t.fare.note}</p></Panel>
      <Panel title={t.dash.documents}><span className="rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-primary">{t.dash.pending}</span></Panel>
      <Panel title={t.dash.upcoming}><Empty text={t.dash.empty} /></Panel>
      <Panel title={t.dash.ratings}><Empty text={t.dash.empty} /></Panel>
      <Panel title={t.dash.settings}><Empty text={t.dash.empty} /></Panel>
    </DashShell>
  );
}

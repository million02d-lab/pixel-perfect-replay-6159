import { createFileRoute, Link } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel, Stat } from "@/features/dashboard/DashShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/passenger")({
  head: () => seo("Passenger dashboard", "Your rides, history, receipts and loyalty on Ozannif (demo)."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  return (
    <DashShell title={t.dash.passengerT}>
      <Panel title={t.dash.upcoming} wide>
        <Empty text={t.dash.empty} />
        <Button asChild className="mt-3"><Link to="/book">{t.nav.book}</Link></Button>
      </Panel>
      <Panel title={t.dash.loyalty}><Stat value="0" label="pts" /></Panel>
      <Panel title={t.dash.history}><Empty text={t.dash.empty} /></Panel>
      <Panel title={t.dash.receipts}><Empty text={t.dash.empty} /></Panel>
      <Panel title={t.dash.ratings}><Empty text={t.dash.empty} /></Panel>
      <Panel title={t.dash.settings} wide><Button asChild variant="outline"><Link to="/signin">{t.nav.signin}</Link></Button></Panel>
    </DashShell>
  );
}

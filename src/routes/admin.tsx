import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { DashShell, Empty, Panel, Stat } from "@/features/dashboard/DashShell";

export const Route = createFileRoute("/admin")({
  head: () => ({ ...seo("Admin console", "Ozannif operations console shell (demo data only)."), meta: [...seo("Admin console", "Ozannif operations console shell (demo data only).").meta, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const d = t.dash;
  return (
    <DashShell title={d.adminT} note={d.adminNote}>
      {[d.trips, d.passengers, d.drivers, d.vehicles].map((k) => <Panel key={k} title={k}><Stat value="0" /></Panel>)}
      {[d.complaints, d.pricing, d.enquiries, d.audit].map((k) => <Panel key={k} title={k}><Empty text={d.empty} /></Panel>)}
    </DashShell>
  );
}

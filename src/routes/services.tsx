import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { VehicleCards, TrustStrip } from "@/features/home/sections";

export const Route = createFileRoute("/services")({
  head: () => seo("Services & pricing", "Economy, Comfort and Family van rides in Rabat and Salé with illustrative fares."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.nav.services} subtitle={t.sections.servicesS} />
      <VehicleCards />
      <TrustStrip />
    </>
  );
}

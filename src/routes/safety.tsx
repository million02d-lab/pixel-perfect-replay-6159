import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { SafetyGrid, Benefits } from "@/features/home/sections";

export const Route = createFileRoute("/safety")({
  head: () => seo("Safety", "Verified drivers, trip sharing and responsive support in Rabat and Salé."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.sections.safetyT} />
      <SafetyGrid />
      <Benefits />
    </>
  );
}

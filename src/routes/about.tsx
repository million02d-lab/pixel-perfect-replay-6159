import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { Destinations } from "@/features/home/sections";

export const Route = createFileRoute("/about")({
  head: () => seo("About", "Ozannif is a Moroccan mobility platform built in Rabat for Rabat and Salé."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.pages.aboutT} subtitle={t.pages.aboutP} />
      <Destinations />
    </>
  );
}

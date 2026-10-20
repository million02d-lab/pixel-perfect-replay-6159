import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { HowItWorks } from "@/features/home/sections";

export const Route = createFileRoute("/how-it-works")({
  head: () => seo("How it works", "How booking and driving with Ozannif works, step by step."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.nav.how} />
      <HowItWorks />
    </>
  );
}

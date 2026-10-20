import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { FaqContact } from "@/features/home/sections";

export const Route = createFileRoute("/faq")({
  head: () => seo("FAQ & contact", "Answers to common questions and a way to reach the Ozannif team."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.nav.faq} />
      <FaqContact />
    </>
  );
}

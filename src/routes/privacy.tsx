import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";


export const Route = createFileRoute("/privacy")({
  head: () => seo("Privacy policy", "How Ozannif will handle personal data (placeholder)."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.pages.privacyT} />
      <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">{t.pages.legalP}</div>
    </>
  );
}

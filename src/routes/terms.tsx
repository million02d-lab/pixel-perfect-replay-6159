import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";


export const Route = createFileRoute("/terms")({
  head: () => seo("Terms of use", "Ozannif terms of use (placeholder)."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.pages.termsT} />
      <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">{t.pages.legalP}</div>
    </>
  );
}

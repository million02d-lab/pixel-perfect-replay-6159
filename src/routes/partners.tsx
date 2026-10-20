import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { PartnerForm } from "@/features/forms/DemoForms";

export const Route = createFileRoute("/partners")({
  head: () => seo("Rental & transport partners", "Licensed rental businesses and transport operators can send a partnership enquiry."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <PageHeader title={t.sections.partnersT} subtitle={t.sections.partnersS} />
      <div className="mx-auto max-w-2xl px-4 py-12"><PartnerForm /></div>
    </>
  );
}

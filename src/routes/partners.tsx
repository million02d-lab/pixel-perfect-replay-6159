import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeader } from "@/components/site/Section";
import { PartnerForm } from "@/features/forms/DemoForms";

export const Route = createFileRoute("/partners")({
  head: () => seo("Rental & transport partners", "Licensed rental businesses and transport operators can send a partnership enquiry."),
  component: Page,
});

function Page() {
  const { t, lang } = useI18n();
  return (
    <>
      <PageHeader title={t.sections.partnersT} subtitle={t.sections.partnersS} />
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "عندك حساب شريك من قبل؟" : lang === "fr" ? "Vous avez déjà un compte partenaire ?" : "Already have a partner account?"}</p>
          <Button variant="outline" asChild><Link to="/partner-dashboard">{lang === "ar" ? "لوحة الشريك" : lang === "fr" ? "Espace partenaire" : "Partner dashboard"}</Link></Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{lang === "ar" ? "خاصك تسجل الدخول قبل إرسال طلب الشراكة." : lang === "fr" ? "Connectez-vous avant d'envoyer une candidature." : "Sign in before submitting a partner application."} <Link to="/signin" className="font-semibold text-primary underline">{t.nav.signin}</Link></p>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8"><PartnerForm /></div>
    </>
  );
}

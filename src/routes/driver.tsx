import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { AuthForm, RentalRequestForm } from "@/features/forms/DemoForms";
import { DemoNotice } from "@/components/site/DemoBadge";

export const Route = createFileRoute("/driver")({
  head: () => seo("Become a driver", "Apply to drive with Ozannif in Rabat and Salé: requirements and onboarding."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <div className="zellige bg-secondary"><div className="mx-auto grid max-w-2xl gap-6 px-4 py-16"><DemoNotice /><AuthForm mode="driver" /><RentalRequestForm /></div></div>
    </>
  );
}

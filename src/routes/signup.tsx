import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { AuthForm } from "@/features/forms/DemoForms";
import { DemoNotice } from "@/components/site/DemoBadge";

export const Route = createFileRoute("/signup")({
  head: () => seo("Create account", "Create an Ozannif passenger account."),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  void t;
  return (
    <>
      <div className="zellige bg-secondary"><div className="mx-auto grid max-w-lg gap-4 px-4 py-16"><DemoNotice /><AuthForm mode="signup" /></div></div>
    </>
  );
}

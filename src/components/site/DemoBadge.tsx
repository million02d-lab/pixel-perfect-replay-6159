import { FlaskConical } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-terracotta/40 bg-terracotta/10 px-2 py-0.5 text-xs font-semibold text-terracotta", className)}>
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {t.demo}
    </span>
  );
}

export function DemoNotice() {
  const { t } = useI18n();
  return (
    <div role="note" className="flex items-start gap-2 rounded-lg border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-foreground">
      <DemoBadge className="shrink-0" />
      <span>{t.demoNotice}</span>
    </div>
  );
}

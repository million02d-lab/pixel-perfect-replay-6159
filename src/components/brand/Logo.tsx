import { cn } from "@/lib/utils";

/** Editable SVG icon: location pin with an inner Moroccan arch and a road curve. */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={cn("h-9 w-auto", className)} aria-hidden="true">
      <path
        d="M24 2C12.4 2 3 11.2 3 22.6 3 37 24 54 24 54s21-17 21-31.4C45 11.2 35.6 2 24 2Z"
        fill="var(--gold)"
      />
      <path d="M15 33V22c0-6 4-10 9-13 5 3 9 7 9 13v11Z" fill="var(--emerald-deep)" />
      <path d="M24 14l2.6 2.6L24 19.2l-2.6-2.6Z" fill="var(--gold)" />
      <path d="M13 40c6-3 10-9 22-11" stroke="var(--ivory)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoIcon />
      <span
        dir="ltr"
        className={cn("text-2xl font-bold tracking-tight", tone === "light" ? "text-ivory" : "text-primary")}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Ozannif
      </span>
    </span>
  );
}

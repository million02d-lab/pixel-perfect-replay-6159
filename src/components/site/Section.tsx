import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ id, title, subtitle, children, className }: { id?: string; title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-4 py-16 md:py-20", className)}>
      <div className="mb-10 max-w-2xl">
        <span className="mb-3 block h-0.5 w-12 bg-gold" aria-hidden="true" />
        <h2 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="zellige absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-primary-foreground/80">{subtitle}</p>}
      </div>
    </div>
  );
}

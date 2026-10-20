import type { ReactNode } from "react";
import { DemoNotice } from "@/components/site/DemoBadge";

export function DashShell({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">{title}</h1>
      <div className="mt-4 grid gap-2"><DemoNotice />{note && <p className="text-sm text-muted-foreground">{note}</p>}</div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export function Panel({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`rounded-2xl border bg-card p-5 shadow-soft ${wide ? "md:col-span-2" : ""}`}>
      <h2 className="mb-3 font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: string; label?: string }) {
  return <p><span dir="ltr" className="text-3xl font-extrabold text-primary">{value}</span>{label && <span className="ms-2 text-sm text-muted-foreground">{label}</span>}</p>;
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{text}</p>;
}

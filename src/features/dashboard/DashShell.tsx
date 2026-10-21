import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { DemoNotice } from "@/components/site/DemoBadge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { signOut } from "@/lib/supabase";

export function DashShell({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const signOutLabel = lang === "ar" ? "تسجيل الخروج" : lang === "fr" ? "Se déconnecter" : "Sign out";
  const doSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); } catch { /* Clear the local session even if the remote sign-out call fails. */ }
    finally {
      setSigningOut(false);
      await navigate({ to: "/signin" });
    }
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <Button variant="outline" size="sm" onClick={() => void doSignOut()} disabled={signingOut}><LogOut className="me-2 h-4 w-4" />{signOutLabel}</Button>
      </div>
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

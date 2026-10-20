import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = "idle" | "loading" | "success" | "error";
const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base placeholder:text-muted-foreground aria-[invalid=true]:border-destructive";

function Field({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function StatusMsg({ status, ok, err }: { status: Status; ok: string; err?: string }) {
  if (status === "success") return <p role="status" className="flex items-start gap-2 rounded-lg bg-success/10 p-3 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" />{ok}</p>;
  if (status === "error" && err) return <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0 text-destructive" />{err}</p>;
  return null;
}

const fakeDelay = () => new Promise((r) => setTimeout(r, 700));

export function ContactForm() {
  const { t } = useI18n();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [v, setV] = useState({ name: "", email: "", message: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !EMAIL.test(v.email) || !v.message.trim()) return setStatus("error");
    setStatus("loading"); await fakeDelay(); setStatus("success"); setV({ name: "", email: "", message: "" });
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <Field id={`${id}n`} label={t.contact.name}><input id={`${id}n`} className={inputCls} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
      <Field id={`${id}e`} label={t.contact.email}><input id={`${id}e`} type="email" dir="ltr" className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      <Field id={`${id}m`} label={t.contact.message}><textarea id={`${id}m`} rows={4} className={inputCls} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} /></Field>
      <StatusMsg status={status} ok={t.contact.ok} err={t.contact.err} />
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <><Loader2 className="animate-spin" />{t.contact.sending}</> : t.contact.send}</Button>
    </form>
  );
}

export function AuthForm({ mode }: { mode: "signin" | "signup" | "driver" }) {
  const { t } = useI18n();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [v, setV] = useState({ name: "", email: "", phone: "", password: "" });
  const needsName = mode !== "signin";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (needsName && !v.name.trim()) er.name = t.auth.errName;
    if (!EMAIL.test(v.email)) er.email = t.auth.errEmail;
    if (v.password.length < 8) er.password = t.auth.errPass;
    setErrs(er);
    if (Object.keys(er).length) return setStatus("idle");
    setStatus("loading"); await fakeDelay(); setStatus("success");
  };
  const title = mode === "signin" ? t.auth.signinT : mode === "driver" ? t.auth.driverT : t.auth.signupT;
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border bg-card p-6 shadow-panel md:p-8">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      {needsName && <Field id={`${id}n`} label={t.auth.name} error={errs.name}><input id={`${id}n`} aria-invalid={!!errs.name} className={inputCls} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>}
      <Field id={`${id}e`} label={t.auth.email} error={errs.email}><input id={`${id}e`} type="email" dir="ltr" autoComplete="email" aria-invalid={!!errs.email} className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      {mode === "driver" && <Field id={`${id}p`} label={t.auth.phone}><input id={`${id}p`} type="tel" dir="ltr" className={inputCls} value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field>}
      <Field id={`${id}w`} label={t.auth.password} error={errs.password}><input id={`${id}w`} type="password" dir="ltr" aria-invalid={!!errs.password} className={inputCls} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></Field>
      {mode === "driver" && (
        <ul className="grid gap-1 rounded-lg bg-secondary p-3 text-sm">
          {t.checklist.map((c) => <li key={c} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />{c}</li>)}
        </ul>
      )}
      <StatusMsg status={status} ok={t.auth.notConnected} />
      <Button type="submit" size="lg" disabled={status === "loading"}>{status === "loading" ? <><Loader2 className="animate-spin" />{t.auth.loading}</> : t.auth.submit}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin"
          ? <>{t.auth.noAccount} <Link to="/signup" className="font-semibold text-primary underline">{t.nav.signup}</Link></>
          : <>{t.auth.haveAccount} <Link to="/signin" className="font-semibold text-primary underline">{t.nav.signin}</Link></>}
      </p>
    </form>
  );
}

export function PartnerForm() {
  const { t } = useI18n();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [v, setV] = useState({ company: "", email: "", city: "Rabat", fleet: "", licence: false });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.company.trim() || !EMAIL.test(v.email) || !v.licence) return setStatus("error");
    setStatus("loading"); await fakeDelay(); setStatus("success");
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <Field id={`${id}c`} label={t.partner.company}><input id={`${id}c`} className={inputCls} value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} /></Field>
      <Field id={`${id}e`} label={t.contact.email}><input id={`${id}e`} type="email" dir="ltr" className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}t`} label={t.partner.city}>
          <select id={`${id}t`} className={inputCls} value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}><option>Rabat</option><option>Salé</option><option>Témara</option></select>
        </Field>
        <Field id={`${id}f`} label={t.partner.fleet}><input id={`${id}f`} type="number" min={1} className={inputCls} value={v.fleet} onChange={(e) => setV({ ...v, fleet: e.target.value })} /></Field>
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={v.licence} onChange={(e) => setV({ ...v, licence: e.target.checked })} />{t.partner.licence}</label>
      <StatusMsg status={status} ok={t.contact.ok} err={t.contact.err} />
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <Loader2 className="animate-spin" /> : t.partner.submit}</Button>
    </form>
  );
}

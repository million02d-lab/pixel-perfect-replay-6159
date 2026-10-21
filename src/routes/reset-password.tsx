import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { updatePasswordFromRecovery } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Ozannif" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const labels = {
    ar: { title: "تعيين كلمة سر جديدة", confirm: "تأكيد كلمة السر", mismatch: "كلمتا السر ما متطابقتينش.", short: "كلمة السر خاصها تكون 8 أحرف على الأقل.", saved: "تبدلات كلمة السر بنجاح. تقدر تدخل دابا.", invalid: "الرابط غير صالح أو سالات صلاحيته. طلب رابطاً جديداً.", submit: "تحديث كلمة السر", signin: "العودة لتسجيل الدخول" },
    fr: { title: "Définir un nouveau mot de passe", confirm: "Confirmer le mot de passe", mismatch: "Les mots de passe ne correspondent pas.", short: "Le mot de passe doit contenir au moins 8 caractères.", saved: "Mot de passe mis à jour. Vous pouvez vous connecter.", invalid: "Lien invalide ou expiré. Demandez un nouveau lien.", submit: "Mettre à jour", signin: "Retour à la connexion" },
    en: { title: "Set a new password", confirm: "Confirm password", mismatch: "Passwords do not match.", short: "Password must be at least 8 characters.", saved: "Password updated. You can now sign in.", invalid: "This reset link is invalid or expired. Request a new link.", submit: "Update password", signin: "Back to sign in" },
  }[lang];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setStatus("error"); setMessage(labels.short); return; }
    if (password !== confirm) { setStatus("error"); setMessage(labels.mismatch); return; }
    setStatus("loading"); setMessage("");
    try {
      await updatePasswordFromRecovery(password);
      setStatus("success"); setMessage(labels.saved); setPassword(""); setConfirm("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : labels.invalid);
    }
  };
  return (
    <div className="mx-auto grid max-w-lg gap-6 px-4 py-16">
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-panel md:p-8">
        <div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold text-primary">{labels.title}</h1></div>
        <label className="grid gap-1 text-sm font-medium">{t.auth.password}<input type="password" autoComplete="new-password" minLength={8} required className="rounded-lg border bg-background px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">{labels.confirm}<input type="password" autoComplete="new-password" minLength={8} required className="rounded-lg border bg-background px-3 py-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        {message && <p role={status === "error" ? "alert" : "status"} className={status === "error" ? "rounded-lg bg-destructive/10 p-3 text-sm text-destructive" : "rounded-lg bg-success/10 p-3 text-sm"}>{message}</p>}
        <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{labels.submit}</Button>
        {status === "success" && <Button type="button" variant="outline" onClick={() => void navigate({ to: "/signin" })}>{labels.signin}</Button>}
        {status === "error" && <Link to="/signin" className="text-center text-sm font-semibold text-primary underline">{labels.signin}</Link>}
      </form>
    </div>
  );
}

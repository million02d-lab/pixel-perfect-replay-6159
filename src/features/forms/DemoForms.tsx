import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { invokeOzannif, signIn, signUp, uploadDriverDocument, type DriverDocumentType } from "@/lib/supabase";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = "idle" | "loading" | "success" | "error";
const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base placeholder:text-muted-foreground aria-[invalid=true]:border-destructive";

function Field({ label, error, children, id }: { label: string; error?: string | undefined; children: ReactNode; id: string }) {
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
  const [requestError, setRequestError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !EMAIL.test(v.email) || !v.message.trim()) return setStatus("error");
    setRequestError("");
    setStatus("loading");
    try {
      await invokeOzannif({ action: "contact", name: v.name.trim(), email: v.email.trim(), message: v.message.trim() }, { anonymous: true });
      setStatus("success");
      setV({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus("error");
      setRequestError(error instanceof Error ? error.message : t.contact.err);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <Field id={`${id}n`} label={t.contact.name}><input id={`${id}n`} className={inputCls} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
      <Field id={`${id}e`} label={t.contact.email}><input id={`${id}e`} type="email" dir="ltr" className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      <Field id={`${id}m`} label={t.contact.message}><textarea id={`${id}m`} rows={4} className={inputCls} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} /></Field>
      <StatusMsg status={status} ok={t.contact.ok} err={requestError || t.contact.err} />
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <><Loader2 className="animate-spin" />{t.contact.sending}</> : t.contact.send}</Button>
    </form>
  );
}

export function AuthForm({ mode }: { mode: "signin" | "signup" | "driver" }) {
  const { t, lang } = useI18n();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errs, setErrs] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
  const [v, setV] = useState({ name: "", email: "", phone: "", password: "" });
  const [successMsg, setSuccessMsg] = useState("");
  const [requestError, setRequestError] = useState("");
  const needsName = mode !== "signin";
  const messages = {
    ar: { confirmed: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده قبل تسجيل الدخول.", signedIn: "تم تسجيل الدخول بنجاح.", created: "تم إنشاء الحساب وإرسال طلب الانضمام للمراجعة. لا يمكن القيادة قبل التحقق من الوثائق.", failed: "تعذر إكمال العملية. حاول مرة أخرى." },
    fr: { confirmed: "Compte créé. Vérifiez votre e-mail pour confirmer votre adresse avant de vous connecter.", signedIn: "Connexion réussie.", created: "Compte créé et candidature chauffeur envoyée pour vérification. Vous ne pouvez pas conduire avant validation des documents.", failed: "Impossible de terminer cette action. Réessayez." },
    en: { confirmed: "Account created. Check your email to confirm your address before signing in.", signedIn: "You are signed in successfully.", created: "Account created and driver application submitted for review. Driving stays disabled until documents are verified.", failed: "We could not complete this action. Please try again." },
  }[lang];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setSuccessMsg("");
    const er: Partial<Record<"name" | "email" | "password", string>> = {};
    if (needsName && !v.name.trim()) er.name = t.auth.errName;
    if (!EMAIL.test(v.email)) er.email = t.auth.errEmail;
    if (v.password.length < 8) er.password = t.auth.errPass;
    setErrs(er);
    if (Object.keys(er).length) { setStatus("idle"); return; }
    setStatus("loading");
    try {
      if (mode === "signin") {
        const session = await signIn(v.email.trim(), v.password);
        const metadataType = session.user?.user_metadata?.["account_type"];
        await invokeOzannif({ action: "ensure-profile", language: lang, accountType: metadataType === "driver" ? "driver" : "passenger" });
        setSuccessMsg(messages.signedIn);
      } else {
        const result = await signUp(v.email.trim(), v.password, v.name.trim(), mode === "driver" ? "driver" : "passenger");
        if (result.session) {
          await invokeOzannif({ action: "ensure-profile", fullName: v.name.trim(), phone: mode === "driver" ? v.phone.trim() || null : null, language: lang, accountType: mode === "driver" ? "driver" : "passenger" });
          setSuccessMsg(mode === "driver" ? messages.created : messages.signedIn);
        } else {
          setSuccessMsg(messages.confirmed);
        }
      }
      setStatus("success");
      setV({ name: "", email: "", phone: "", password: "" });
    } catch (error) {
      setStatus("error");
      setRequestError(error instanceof Error ? error.message : messages.failed);
    }
  };
  const title = mode === "signin" ? t.auth.signinT : mode === "driver" ? t.auth.driverT : t.auth.signupT;
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border bg-card p-6 shadow-panel md:p-8">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      {needsName && <Field id={`${id}n`} label={t.auth.name} error={errs.name}><input id={`${id}n`} autoComplete="name" aria-invalid={!!errs.name} className={inputCls} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>}
      <Field id={`${id}e`} label={t.auth.email} error={errs.email}><input id={`${id}e`} type="email" dir="ltr" autoComplete="email" aria-invalid={!!errs.email} className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      {mode === "driver" && <Field id={`${id}p`} label={t.auth.phone}><input id={`${id}p`} type="tel" autoComplete="tel" dir="ltr" className={inputCls} value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field>}
      <Field id={`${id}w`} label={t.auth.password} error={errs.password}><input id={`${id}w`} type="password" dir="ltr" autoComplete={mode === "signin" ? "current-password" : "new-password"} aria-invalid={!!errs.password} className={inputCls} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></Field>
      {mode === "driver" && (
        <ul className="grid gap-1 rounded-lg bg-secondary p-3 text-sm">
          {t.checklist.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />{item}</li>)}
        </ul>
      )}
      <StatusMsg status={status} ok={successMsg || t.auth.notConnected} err={requestError || t.auth.errEmail} />
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
  const { t, lang } = useI18n();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [v, setV] = useState({ company: "", email: "", city: "Rabat", fleet: "1", licence: false });
  const [requestError, setRequestError] = useState("");
  const success = {
    ar: "تم حفظ طلب الشراكة. سيبقى قيد المراجعة حتى التحقق من الوثائق والتراخيص.",
    fr: "Demande enregistrée. Elle restera en attente jusqu'à la vérification des documents et autorisations.",
    en: "Partner application saved. It remains pending until documents and authorizations are reviewed.",
  }[lang];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    if (v.company.trim().length < 2 || !EMAIL.test(v.email) || !v.licence || !Number.isInteger(Number(v.fleet)) || Number(v.fleet) < 1) {
      setRequestError(t.contact.err);
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const city = v.city === "Salé" ? "Sale" : v.city === "Témara" ? "Temara" : v.city;
      await invokeOzannif({ action: "partner-application", businessName: v.company.trim(), email: v.email.trim(), city, fleetSize: Number(v.fleet), licensesConfirmed: v.licence });
      setStatus("success");
      setV({ company: "", email: "", city: "Rabat", fleet: "1", licence: false });
    } catch (error) {
      setStatus("error");
      setRequestError(error instanceof Error ? error.message : t.contact.err);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <Field id={`${id}c`} label={t.partner.company}><input id={`${id}c`} autoComplete="organization" className={inputCls} value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} /></Field>
      <Field id={`${id}e`} label={t.contact.email}><input id={`${id}e`} type="email" dir="ltr" autoComplete="email" className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}t`} label={t.partner.city}>
          <select id={`${id}t`} className={inputCls} value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}><option>Rabat</option><option>Salé</option><option>Témara</option></select>
        </Field>
        <Field id={`${id}f`} label={t.partner.fleet}><input id={`${id}f`} type="number" min={1} max={10000} step={1} className={inputCls} value={v.fleet} onChange={(e) => setV({ ...v, fleet: e.target.value })} /></Field>
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={v.licence} onChange={(e) => setV({ ...v, licence: e.target.checked })} />{t.partner.licence}</label>
      <StatusMsg status={status} ok={success} err={requestError || t.contact.err} />
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <Loader2 className="animate-spin" /> : t.partner.submit}</Button>
    </form>
  );
}

 
export function RentalRequestForm() {
  const { t, lang } = useI18n();
  const id = useId();
  const [city, setCity] = useState("Rabat");
  const [notes, setNotes] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const messages = {
    ar: { title: "باغي تخدم بلا سيارتك؟", sub: "قدّم طلب باش نربطوك بشريك كراء معتمد. الطلب ما كيعنيش أن السيارة تحجزات.", terms: "كنوافق أن الطلب يبقى خاضعاً للتحقق وموافقة الشريك. من بعد مطابقة الطلب مع شريك معتمد، كتبدأ فترة 7 أيام بلا عمولة المنصة. كراء السيارة خاصو يتأكد بشكل منفصل مع الشريك.", submit: "طلب مطابقة مع شريك", ok: "تسجل طلب الكراء وهو قيد المراجعة.", failed: "تعذر إرسال الطلب." },
    fr: { title: "Vous n'avez pas de voiture ?", sub: "Demandez une mise en relation avec un partenaire de location agréé. La demande ne réserve pas un véhicule.", terms: "J'accepte la vérification et la confirmation séparée du partenaire. Après mise en relation avec un partenaire agréé, une période de 7 jours sans commission plateforme commence. La location doit être confirmée séparément avec le partenaire.", submit: "Demander une mise en relation", ok: "Demande de location enregistrée, en attente de vérification.", failed: "Impossible d'envoyer la demande." },
    en: { title: "No car of your own?", sub: "Request a match with an approved rental partner. This request does not reserve a vehicle.", terms: "I accept verification and separate confirmation by the partner. After matching with an approved partner, a 7-day platform-commission-free period begins. The vehicle rental must be confirmed separately with the partner.", submit: "Request rental match", ok: "Rental request saved and awaiting review.", failed: "The request could not be submitted." },
  }[lang];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!accepted) { setError(messages.terms); setStatus("error"); return; }
    setStatus("loading");
    try {
      await invokeOzannif({ action: "rental-request", city: city === "Salé" ? "Sale" : city === "Témara" ? "Temara" : city, notes: notes.trim() || null, termsAccepted: accepted });
      setSuccess(messages.ok); setStatus("success"); setNotes(""); setAccepted(false);
    } catch (e) { setError(e instanceof Error ? e.message : messages.failed); setStatus("error"); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <div><h2 className="text-xl font-bold text-primary">{messages.title}</h2><p className="mt-1 text-sm text-muted-foreground">{messages.sub}</p></div>
      <Field id={`${id}city`} label={t.partner.city}><select id={`${id}city`} className={inputCls} value={city} onChange={(e) => setCity(e.target.value)}><option>Rabat</option><option>Salé</option><option>Témara</option></select></Field>
      <Field id={`${id}notes`} label={t.contact.message}><textarea id={`${id}notes`} rows={3} maxLength={1000} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={lang === "ar" ? "ملاحظات اختيارية حول نوع السيارة أو مدة الكراء" : lang === "fr" ? "Type de véhicule ou durée souhaitée (facultatif)" : "Preferred vehicle or rental duration (optional)"} /></Field>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>{messages.terms}</span></label>
      {status === "success" && <p role="status" className="rounded-lg bg-success/10 p-3 text-sm">{success}</p>}
      {status === "error" && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <Loader2 className="animate-spin" /> : messages.submit}</Button>
    </form>
  );
}

 
export function VehicleApplicationForm() {
  const { t, lang } = useI18n();
  const id = useId();
  const [v, setV] = useState({ make: "", model: "", color: "", plateNumber: "", vehicleClass: "economy", seats: "4" });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const messages = {
    ar: { title: "أضف سيارتك", sub: "خاص السيارة والوثائق يتراجعو ويتوافق عليهم قبل استقبال الرحلات.", make: "الماركة", model: "الموديل", color: "اللون", plate: "رقم اللوحة", seats: "عدد المقاعد", submit: "إرسال السيارة للمراجعة", ok: "تسجلات السيارة وهي دابا قيد المراجعة.", failed: "تعذر إرسال بيانات السيارة." },
    fr: { title: "Ajouter votre véhicule", sub: "Le véhicule et ses documents doivent être vérifiés avant de recevoir des courses.", make: "Marque", model: "Modèle", color: "Couleur", plate: "Immatriculation", seats: "Nombre de places", submit: "Soumettre le véhicule", ok: "Véhicule enregistré en attente de vérification.", failed: "Impossible d'envoyer les informations du véhicule." },
    en: { title: "Add your vehicle", sub: "The vehicle and documents must be reviewed before you can receive trips.", make: "Make", model: "Model", color: "Color", plate: "Plate number", seats: "Seats", submit: "Submit vehicle for review", ok: "Vehicle submitted and pending verification.", failed: "Could not submit vehicle details." },
  }[lang];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!v.make.trim() || !v.model.trim() || !v.plateNumber.trim() || !Number.isInteger(Number(v.seats)) || Number(v.seats) < 1 || Number(v.seats) > 15) {
      setError(messages.failed); setStatus("error"); return;
    }
    setStatus("loading");
    try {
      await invokeOzannif({ action: "vehicle-application", make: v.make.trim(), model: v.model.trim(), color: v.color.trim() || null, plateNumber: v.plateNumber.trim(), vehicleClass: v.vehicleClass, seats: Number(v.seats) });
      setSuccess(messages.ok); setStatus("success"); setV({ make: "", model: "", color: "", plateNumber: "", vehicleClass: "economy", seats: "4" });
    } catch (e) { setError(e instanceof Error ? e.message : messages.failed); setStatus("error"); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <div><h2 className="text-xl font-bold text-primary">{messages.title}</h2><p className="mt-1 text-sm text-muted-foreground">{messages.sub}</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}make`} label={messages.make}><input id={`${id}make`} className={inputCls} value={v.make} onChange={(e) => setV({ ...v, make: e.target.value })} /></Field>
        <Field id={`${id}model`} label={messages.model}><input id={`${id}model`} className={inputCls} value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} /></Field>
        <Field id={`${id}color`} label={messages.color}><input id={`${id}color`} className={inputCls} value={v.color} onChange={(e) => setV({ ...v, color: e.target.value })} /></Field>
        <Field id={`${id}plate`} label={messages.plate}><input id={`${id}plate`} dir="ltr" autoCapitalize="characters" className={inputCls} value={v.plateNumber} onChange={(e) => setV({ ...v, plateNumber: e.target.value })} /></Field>
        <Field id={`${id}class`} label={t.booking.vehicle}><select id={`${id}class`} className={inputCls} value={v.vehicleClass} onChange={(e) => setV({ ...v, vehicleClass: e.target.value })}><option value="economy">{t.vehicles.economy}</option><option value="comfort">{t.vehicles.comfort}</option><option value="van">{t.vehicles.van}</option></select></Field>
        <Field id={`${id}seats`} label={messages.seats}><input id={`${id}seats`} type="number" min={1} max={15} step={1} className={inputCls} value={v.seats} onChange={(e) => setV({ ...v, seats: e.target.value })} /></Field>
      </div>
      {status === "success" && <p role="status" className="rounded-lg bg-success/10 p-3 text-sm">{success}</p>}
      {status === "error" && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <Loader2 className="animate-spin" /> : messages.submit}</Button>
    </form>
  );
}

 
export function DriverDocumentForm() {
  const { lang } = useI18n();
  const id = useId();
  const [docType, setDocType] = useState<DriverDocumentType>("identity");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const labels = {
    ar: { title: "وثائق التحقق", sub: "رفع ملفات خاصة لا يراها إلا صاحب الحساب والإدارة. PDF أو JPG أو PNG أو WebP، بحد أقصى 10 ميغابايت للملف.", type: "نوع الوثيقة", identity: "البطاقة الوطنية", license: "رخصة السياقة", registration: "البطاقة الرمادية", insurance: "التأمين", file: "اختيار ملف", send: "رفع الوثيقة بأمان", ok: "ترفع الملف وهو الآن قيد المراجعة.", fail: "تعذر رفع الوثيقة." },
    fr: { title: "Documents de vérification", sub: "Fichiers privés visibles uniquement par vous et l'administration. PDF, JPG, PNG ou WebP, 10 Mo maximum.", type: "Type de document", identity: "Pièce d'identité", license: "Permis de conduire", registration: "Carte grise", insurance: "Assurance", file: "Choisir un fichier", send: "Téléverser en sécurité", ok: "Document téléversé et en attente de vérification.", fail: "Impossible de téléverser le document." },
    en: { title: "Verification documents", sub: "Private files visible only to you and administrators. PDF, JPG, PNG or WebP, maximum 10 MB.", type: "Document type", identity: "Identity document", license: "Driving licence", registration: "Vehicle registration", insurance: "Insurance", file: "Choose file", send: "Upload securely", ok: "Document uploaded and pending review.", fail: "Could not upload the document." },
  }[lang];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!file) { setError(labels.file); setStatus("error"); return; }
    setStatus("loading");
    try {
      await uploadDriverDocument(file, docType);
      setSuccess(labels.ok); setStatus("success"); setFile(null);
      const input = document.getElementById(`${id}file`) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e) { setError(e instanceof Error ? e.message : labels.fail); setStatus("error"); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <div><h2 className="text-xl font-bold text-primary">{labels.title}</h2><p className="mt-1 text-sm text-muted-foreground">{labels.sub}</p></div>
      <Field id={`${id}type`} label={labels.type}><select id={`${id}type`} className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value as DriverDocumentType)}><option value="identity">{labels.identity}</option><option value="driving_license">{labels.license}</option><option value="vehicle_registration">{labels.registration}</option><option value="insurance">{labels.insurance}</option></select></Field>
      <Field id={`${id}file`} label={labels.file}><input id={`${id}file`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className={inputCls} onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)} /></Field>
      {status === "success" && <p role="status" className="rounded-lg bg-success/10 p-3 text-sm">{success}</p>}
      {status === "error" && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={status === "loading"}>{status === "loading" ? <Loader2 className="animate-spin" /> : labels.send}</Button>
    </form>
  );
}

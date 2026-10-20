import { Link } from "@tanstack/react-router";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { LANGS, type Lang } from "@/i18n/dictionaries";

export function LangSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="relative inline-flex items-center gap-1 text-sm">
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t.nav.language}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="cursor-pointer rounded-md border border-input bg-card px-2 py-1.5 text-sm"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: t.nav.home },
    { to: "/services", label: t.nav.services },
    { to: "/how-it-works", label: t.nav.how },
    { to: "/safety", label: t.nav.safety },
    { to: "/about", label: t.nav.about },
    { to: "/faq", label: t.nav.faq },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="Ozannif" className="shrink-0"><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true }}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary data-[status=active]:text-primary data-[status=active]:font-semibold">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LangSwitcher />
          <Button asChild variant="ghost"><Link to="/signin">{t.nav.signin}</Link></Button>
          <Button asChild variant="gold"><Link to="/signup">{t.nav.signup}</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.nav.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <div className="border-t bg-background px-4 pb-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col py-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 font-medium hover:bg-secondary">{l.label}</Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <LangSwitcher />
            <Button asChild variant="outline"><Link to="/signin" onClick={() => setOpen(false)}>{t.nav.signin}</Link></Button>
            <Button asChild variant="gold"><Link to="/signup" onClick={() => setOpen(false)}>{t.nav.signup}</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}

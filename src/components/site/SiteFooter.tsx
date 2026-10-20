import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/i18n/I18nProvider";
import { LANGS } from "@/i18n/dictionaries";

export function SiteFooter() {
  const { t, setLang } = useI18n();
  return (
    <footer className="relative mt-24 bg-primary text-primary-foreground">
      <div className="zellige absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-3 text-primary-foreground/80">{t.brand.tagline}</p>
          <p className="mt-1 text-sm text-primary-foreground/60">Rabat · Salé</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link to="/services" className="hover:text-gold">{t.nav.services}</Link>
          <Link to="/driver" className="hover:text-gold">{t.nav.drivers}</Link>
          <Link to="/partners" className="hover:text-gold">{t.nav.partners}</Link>
          <Link to="/faq" className="hover:text-gold">{t.footer.contact}</Link>
          <Link to="/privacy" className="hover:text-gold">{t.footer.privacy}</Link>
          <Link to="/terms" className="hover:text-gold">{t.footer.terms}</Link>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-gold">{t.nav.language}</span>
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)} className="text-start hover:text-gold">{l.label}</button>
          ))}
        </div>
      </div>
      <div className="relative border-t border-primary-foreground/15 px-4 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Ozannif. {t.footer.rights} {t.footer.note}
      </div>
    </footer>
  );
}

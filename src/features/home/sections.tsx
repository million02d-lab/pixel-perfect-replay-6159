import { Link } from "@tanstack/react-router";
import {
  BadgeCheck, Car, CarFront, CheckCircle2, Clock, Gift, Headphones, History, Lock, MapPin, Receipt,
  Share2, ShieldCheck, Star, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site/Section";
import { DemoBadge } from "@/components/site/DemoBadge";
import { ContactForm } from "@/features/forms/DemoForms";
import { useI18n } from "@/i18n/I18nProvider";
import { DEMO_RATES } from "@/lib/fare";
import marina from "@/assets/marina.jpg";
import kasbah from "@/assets/kasbah.jpg";
import hero from "@/assets/hero-hassan.jpg";
import driver from "@/assets/driver.jpg";

export function TrustStrip() {
  const { t } = useI18n();
  const items = [
    [Wallet, t.trust.price], [BadgeCheck, t.trust.verified], [ShieldCheck, t.trust.safety], [Headphones, t.trust.support],
  ] as const;
  return (
    <div className="bg-primary text-primary-foreground">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
        {items.map(([Icon, label]) => (
          <li key={label} className="flex items-center gap-3"><Icon className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" /><span className="font-medium">{label}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function VehicleCards() {
  const { t } = useI18n();
  const list = [
    { k: "economy", Icon: Car, name: t.vehicles.economy, d: t.vehicles.economyD, seats: 4 },
    { k: "comfort", Icon: CarFront, name: t.vehicles.comfort, d: t.vehicles.comfortD, seats: 4 },
    { k: "van", Icon: Users, name: t.vehicles.van, d: t.vehicles.vanD, seats: 7 },
  ] as const;
  return (
    <Section title={t.sections.servicesT} subtitle={t.sections.servicesS}>
      <div className="grid gap-5 md:grid-cols-3">
        {list.map(({ k, Icon, name, d, seats }) => (
          <article key={k} className="group rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-gold">
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary"><Icon aria-hidden="true" /></span>
              <DemoBadge />
            </div>
            <h3 className="mt-5 text-xl font-bold text-primary">{name}</h3>
            <p className="mt-1 text-muted-foreground">{d}</p>
            <div className="mt-5 flex items-end justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">{seats} {t.vehicles.seats}</span>
              <span className="text-sm">{t.vehicles.from} <strong className="text-2xl text-primary" dir="ltr">{DEMO_RATES[k].base + DEMO_RATES[k].fee + 9} MAD</strong></span>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

export function Destinations() {
  const { t, lang } = useI18n();
  const dests = [
    { img: hero, name: { ar: "صومعة حسان", fr: "Tour Hassan", en: "Hassan Tower" }, city: "Rabat" },
    { img: marina, name: { ar: "مارينا أبي رقراق", fr: "Marina Bouregreg", en: "Bouregreg Marina" }, city: "Rabat · Salé" },
    { img: kasbah, name: { ar: "قصبة الأوداية", fr: "Kasbah des Oudayas", en: "Kasbah of the Udayas" }, city: "Rabat" },
  ];
  const chips = [
    { ar: "أكدال", fr: "Agdal", en: "Agdal" }, { ar: "الرباط المدينة", fr: "Rabat Ville", en: "Rabat Ville" },
    { ar: "سلا المدينة", fr: "Salé Médina", en: "Salé Medina" }, { ar: "حي الرياض", fr: "Hay Riad", en: "Hay Riad" },
    { ar: "مطار الرباط سلا", fr: "Aéroport Rabat-Salé", en: "Rabat-Salé Airport" },
  ];
  return (
    <Section title={t.sections.destT} subtitle={t.sections.destS}>
      <div className="grid gap-5 md:grid-cols-3">
        {dests.map((d) => (
          <Link key={d.name.en} to="/book" search={{ destination: d.name[lang] }} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl">
            <img src={d.img} alt={d.name[lang]} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="hero-overlay absolute inset-0" />
            <div className="absolute bottom-4 start-4 text-ivory">
              <p className="flex items-center gap-1 text-xs opacity-80"><MapPin className="h-3 w-3" />{d.city}</p>
              <h3 className="text-xl font-bold">{d.name[lang]}</h3>
            </div>
          </Link>
        ))}
      </div>
      <ul className="mt-6 flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.en}><Link to="/book" search={{ destination: c[lang] }} className="inline-flex items-center gap-1 rounded-full border bg-card px-4 py-2 text-sm hover:border-gold"><MapPin className="h-3.5 w-3.5 text-terracotta" />{c[lang]}</Link></li>
        ))}
      </ul>
    </Section>
  );
}

export function Benefits() {
  const { t } = useI18n();
  const icons = [Receipt, CarFront, ShieldCheck, History, Star, Gift];
  return (
    <Section title={t.sections.benefitsT}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.benefits.map(([h, p], i) => {
          const Icon = icons[i] ?? ShieldCheck;
          return (
            <div key={h} className="flex gap-4 rounded-xl border bg-card p-5">
              <Icon className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
              <div><h3 className="font-semibold text-primary">{h}</h3><p className="text-sm text-muted-foreground">{p}</p></div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function DriverSection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid overflow-hidden rounded-3xl bg-primary text-primary-foreground md:grid-cols-2">
        <img src={driver} alt="" loading="lazy" width={1024} height={768} className="h-full min-h-72 w-full object-cover" />
        <div className="relative p-8 md:p-12">
          <div className="zellige absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold">{t.sections.driversT}</h2>
            <p className="mt-3 text-primary-foreground/80">{t.sections.driversS}</p>
            <ul className="mt-6 grid gap-2">
              {t.driverPoints.map((p) => <li key={p} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-gold" />{p}</li>)}
            </ul>
            <Button asChild variant="gold" size="lg" className="mt-8"><Link to="/driver">{t.becomeDriver}</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PartnerSection() {
  const { t } = useI18n();
  return (
    <Section title={t.sections.partnersT} subtitle={t.sections.partnersS}>
      <Button asChild size="lg"><Link to="/partners">{t.partnerCta}</Link></Button>
    </Section>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  const Col = ({ title, steps }: { title: string; steps: string[][] }) => (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="mb-5 text-lg font-bold text-terracotta">{title}</h3>
      <ol className="grid gap-5">
        {steps.map(([h, p], i) => (
          <li key={h} className="flex gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-gold">{i + 1}</span>
            <div><p className="font-semibold text-primary">{h}</p><p className="text-sm text-muted-foreground">{p}</p></div>
          </li>
        ))}
      </ol>
    </div>
  );
  return (
    <Section title={t.sections.howT}>
      <div className="grid gap-5 md:grid-cols-2"><Col title={t.how.passenger} steps={t.how.p} /><Col title={t.how.driver} steps={t.how.d} /></div>
    </Section>
  );
}

export function SafetyGrid() {
  const { t } = useI18n();
  const icons = [BadgeCheck, Share2, Clock, Lock];
  return (
    <Section title={t.sections.safetyT}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.safety.map(([h, p], i) => {
          const Icon = icons[i] ?? ShieldCheck;
          return (
            <div key={h} className="rounded-xl border bg-card p-5">
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-primary">{h}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function FaqContact() {
  const { t } = useI18n();
  return (
    <Section title={t.sections.faqT}>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="grid gap-3">
          {t.faq.map(([q, a]) => (
            <details key={q} className="group rounded-xl border bg-card p-4 open:border-gold">
              <summary className="cursor-pointer list-none font-semibold text-primary">{q}</summary>
              <p className="mt-2 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <div>
          <h3 className="mb-4 text-xl font-bold text-primary">{t.sections.contactT}</h3>
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}

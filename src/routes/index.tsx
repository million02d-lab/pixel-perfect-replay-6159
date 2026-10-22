import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero-hassan.jpg";
import { BookingPanel } from "@/features/booking/BookingPanel";
import { DemoNotice } from "@/components/site/DemoBadge";
import {
  Benefits, Destinations, DriverSection, FaqContact, HowItWorks, PartnerSection, SafetyGrid, TrustStrip, VehicleCards,
} from "@/features/home/sections";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ozannif — تنقّل بثقة في الرباط وسلا" },
      { name: "description", content: "Book rides across Rabat and Salé with verified drivers and transparent fares. Plus proche, plus loin." },
      { property: "og:title", content: "Ozannif — Premium mobility in Rabat & Salé" },
      { property: "og:description", content: "Verified drivers, transparent fares and real support across Rabat and Salé." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  return (
    <>
      <section className="relative isolate overflow-hidden bg-primary">
        <img src={hero} alt="Hassan Tower, Rabat, at sunset" width={1920} height={1088} fetchPriority="high"
          className="absolute inset-0 -z-10 h-full w-full scale-[1.02] object-cover object-[70%_center] saturate-[0.88]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/35 via-primary/55 to-primary/95" />
        <div className="absolute -end-24 top-24 -z-10 h-72 w-72 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -start-24 bottom-16 -z-10 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" aria-hidden="true" />
        <div className="mx-auto flex min-h-[660px] max-w-7xl flex-col justify-end gap-8 px-4 pb-8 pt-28 text-ivory md:min-h-[760px] md:pb-12">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-primary/45 px-4 py-2 text-sm font-semibold text-gold shadow-lg backdrop-blur-md"><MapPin className="h-4 w-4" aria-hidden="true" />{t.hero.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-balance md:text-6xl lg:text-7xl">{t.hero.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ivory/90 md:text-xl md:leading-8">{t.hero.sub}</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ivory/90">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-gold" aria-hidden="true" />{t.trust.verified}</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />{t.trust.safety}</span>
              <span className="inline-flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-gold" aria-hidden="true" />{t.trust.price}</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/20 bg-background/95 p-1.5 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-2">
            <BookingPanel />
          </div>
        </div>
      </section>
      <TrustStrip />
      <div className="mx-auto max-w-7xl px-4 pt-8"><DemoNotice /></div>
      <VehicleCards />
      <Destinations />
      <Benefits />
      <DriverSection />
      <PartnerSection />
      <HowItWorks />
      <SafetyGrid />
      <FaqContact />
    </>
  );
}

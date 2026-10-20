import { createFileRoute } from "@tanstack/react-router";
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
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Hassan Tower, Rabat, at sunset" width={1920} height={1088} fetchPriority="high"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_center]" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto flex min-h-[640px] max-w-7xl flex-col justify-end gap-8 px-4 pb-10 pt-24 text-ivory md:min-h-[720px]">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-3 text-sm font-semibold text-gold"><span className="h-px w-10 bg-gold" />{t.hero.eyebrow}</p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{t.hero.title}</h1>
            <p className="mt-4 text-lg text-ivory/85 md:text-xl">{t.hero.sub}</p>
          </div>
          <BookingPanel />
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

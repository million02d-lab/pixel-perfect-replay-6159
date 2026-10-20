import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BookingPanel } from "@/features/booking/BookingPanel";
import { MapPanel } from "@/features/booking/MapPanel";
import { DemoBadge, DemoNotice } from "@/components/site/DemoBadge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { demoDistance, estimateFare, type VehicleClass } from "@/lib/fare";

type Search = { pickup?: string | undefined; destination?: string | undefined; vehicle?: VehicleClass | undefined };

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    pickup: typeof s["pickup"] === "string" ? s["pickup"] : undefined,
    destination: typeof s["destination"] === "string" ? s["destination"] : undefined,
    vehicle: s["vehicle"] === "comfort" || s["vehicle"] === "van" || s["vehicle"] === "economy" ? s["vehicle"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a ride — Ozannif" },
      { name: "description", content: "Preview your route, vehicle and fare estimate in Rabat and Salé." },
      { property: "og:title", content: "Book a ride — Ozannif" },
      { property: "og:description", content: "Route preview, vehicle choice and transparent fare breakdown." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { t } = useI18n();
  const s = Route.useSearch();
  const [requested, setRequested] = useState(false);
  const ready = s.pickup && s.destination;
  const vehicle = s.vehicle ?? "economy";
  const route = ready ? demoDistance(s.pickup!, s.destination!) : null;
  const fare = route ? estimateFare(vehicle, route.km, route.min) : null;
  const row = (k: string, v: string) => <div className="flex justify-between py-1.5"><dt className="text-muted-foreground">{k}</dt><dd dir="ltr" className="font-medium">{v}</dd></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-primary">{t.nav.book}</h1>
      <BookingPanel key={`${s.pickup}-${s.destination}-${vehicle}`} initial={s} />
      <div className="mt-6"><DemoNotice /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MapPanel pickup={s.pickup} destination={s.destination} />
        <section className="rounded-2xl border bg-card p-6 shadow-soft" aria-live="polite">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-primary">{t.fare.title}</h2><DemoBadge /></div>
          {fare && route ? (
            <>
              <dl className="mt-4 divide-y text-sm">
                {row(t.booking.vehicle, t.vehicles[vehicle])}
                {row(t.fare.distance, `${route.km} km`)}
                {row(t.fare.duration, `${route.min} min`)}
                {row(t.fare.base, `${fare.base} MAD`)}
                {row(t.fare.perKm, `${fare.perKm} MAD`)}
                {row(t.fare.perMin, `${fare.perMin} MAD`)}
                {row(t.fare.fee, `${fare.fee} MAD`)}
              </dl>
              <div className="mt-4 flex items-end justify-between border-t-2 border-gold pt-4">
                <span className="font-semibold">{t.fare.total}</span>
                <span dir="ltr" className="text-3xl font-extrabold text-primary">≈ {fare.total} MAD</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t.fare.note}</p>
              {requested ? (
                <p role="status" className="mt-4 flex gap-2 rounded-lg bg-success/10 p-3 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" />{t.fare.requested}</p>
              ) : (
                <Button size="lg" className="mt-4 w-full" onClick={() => setRequested(true)}>{t.fare.confirm}</Button>
              )}
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">{t.booking.title}</p>
          )}
        </section>
      </div>
    </div>
  );
}

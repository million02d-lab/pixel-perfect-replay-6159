import { useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, Car, MapPin, Navigation, Search } from "lucide-react";
import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { validateRoute, type VehicleClass } from "@/lib/fare";

export function BookingPanel({ initial }: { initial?: { pickup?: string; destination?: string; vehicle?: VehicleClass } }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const id = useId();
  const [pickup, setPickup] = useState(initial?.pickup ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [vehicle, setVehicle] = useState<VehicleClass>(initial?.vehicle ?? "economy");
  const [errors, setErrors] = useState<ReturnType<typeof validateRoute> | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateRoute(pickup, destination);
    setErrors(v);
    if (v.pickup || v.destination) return;
    navigate({ to: "/book", search: { pickup: pickup.trim(), destination: destination.trim(), vehicle } });
  };

  const field = "w-full rounded-lg border border-input bg-card py-3 ps-10 pe-3 text-base text-foreground placeholder:text-muted-foreground";

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border bg-card/95 p-4 text-card-foreground shadow-panel backdrop-blur md:p-5">
      <h2 className="mb-3 text-lg font-bold text-primary">{t.booking.title}</h2>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_200px_auto] md:items-start">
        <div>
          <label htmlFor={`${id}-p`} className="mb-1 block text-sm font-medium">{t.booking.pickup}</label>
          <div className="relative">
            <Navigation className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <input id={`${id}-p`} value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder={t.booking.pickupPh}
              aria-invalid={!!errors?.pickup} aria-describedby={errors?.pickup ? `${id}-pe` : undefined} className={field} />
          </div>
          {errors?.pickup && <p id={`${id}-pe`} className="mt-1 text-sm text-destructive">{t.booking[errors.pickup]}</p>}
        </div>
        <Button type="button" variant="outline" size="icon" aria-label={t.booking.swap} className="mx-auto md:mt-7"
          onClick={() => { setPickup(destination); setDestination(pickup); }}>
          <ArrowUpDown className="md:rotate-90" />
        </Button>
        <div>
          <label htmlFor={`${id}-d`} className="mb-1 block text-sm font-medium">{t.booking.destination}</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-terracotta" aria-hidden="true" />
            <input id={`${id}-d`} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={t.booking.destPh}
              aria-invalid={!!errors?.destination} aria-describedby={errors?.destination ? `${id}-de` : undefined} className={field} />
          </div>
          {errors?.destination && <p id={`${id}-de`} className="mt-1 text-sm text-destructive">{t.booking[errors.destination]}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-v`} className="mb-1 block text-sm font-medium">{t.booking.vehicle}</label>
          <div className="relative">
            <Car className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <select id={`${id}-v`} value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleClass)} className={field}>
              <option value="economy">{t.vehicles.economy}</option>
              <option value="comfort">{t.vehicles.comfort}</option>
              <option value="van">{t.vehicles.van}</option>
            </select>
          </div>
        </div>
        <Button type="submit" variant="gold" size="lg" className="md:mt-6">
          <Search /> {t.booking.submit}
        </Button>
      </div>
    </form>
  );
}

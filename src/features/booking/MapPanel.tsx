import { useI18n } from "@/i18n/I18nProvider";
import { DemoBadge } from "@/components/site/DemoBadge";

export interface MapPoint { label: string; latitude: number; longitude: number }
export interface MapProviderProps {
  pickup?: string | undefined;
  destination?: string | undefined;
  pickupPoint?: MapPoint | undefined;
  destinationPoint?: MapPoint | undefined;
}

export function MapPanel(props: MapProviderProps) {
  const { t, lang } = useI18n();
  const { pickupPoint, destinationPoint } = props;
  const hasRouteEndpoints = Boolean(pickupPoint && destinationPoint);
  const directionsUrl = hasRouteEndpoints && pickupPoint && destinationPoint
    ? `https://www.google.com/maps/dir/?api=1&origin=${pickupPoint.latitude},${pickupPoint.longitude}&destination=${destinationPoint.latitude},${destinationPoint.longitude}&travelmode=driving`
    : null;
  // Google Maps directions embed displays a road route between the resolved points.
  // It is a visual preview only; the server-side routing provider remains authoritative for fare distance/time.
  const mapSrc = directionsUrl
    ? `https://maps.google.com/maps?output=embed&saddr=${pickupPoint!.latitude},${pickupPoint!.longitude}&daddr=${destinationPoint!.latitude},${destinationPoint!.longitude}`
    : null;
  const openLabel = lang === "ar" ? "فتح المسار في خرائط Google" : lang === "fr" ? "Ouvrir l’itinéraire dans Google Maps" : "Open route in Google Maps";
  const routeLabel = lang === "ar" ? "معاينة المسار بالسيارة" : lang === "fr" ? "Aperçu de l’itinéraire en voiture" : "Driving route preview";
  return (
    <figure className="relative min-h-64 overflow-hidden rounded-2xl border bg-secondary" aria-label={t.map.label}>
      {mapSrc && pickupPoint && destinationPoint ? (
        <iframe
          title={`Google Maps driving directions — ${pickupPoint.label} to ${destinationPoint.label}`}
          src={mapSrc}
          className="h-full min-h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <svg viewBox="0 0 400 260" className="h-full min-h-64 w-full" role="img" aria-label={t.map.label}>
          <rect width="400" height="260" fill="var(--secondary)" />
          <path d="M0 150 C80 120 140 190 220 140 S340 90 400 120 L400 175 C330 150 260 200 210 185 S80 170 0 205Z" fill="var(--chart-4)" opacity=".35" />
          {[40, 90, 140, 190, 240].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y + 15} stroke="var(--border)" strokeWidth="6" />)}
          {[60, 140, 220, 300, 360].map((x) => <line key={x} y1="0" y2="260" x1={x} x2={x - 20} stroke="var(--border)" strokeWidth="6" />)}
          <path d="M80 210 C120 160 180 180 210 120 S300 70 320 50" stroke="var(--primary)" strokeWidth="5" fill="none" strokeDasharray="10 6" strokeLinecap="round" />
          <circle cx="80" cy="210" r="9" fill="var(--primary)" stroke="var(--ivory)" strokeWidth="3" />
          <circle cx="320" cy="50" r="9" fill="var(--terracotta)" stroke="var(--ivory)" strokeWidth="3" />
        </svg>
      )}
      <figcaption className="absolute start-3 top-3 rounded-md bg-card/95 px-2 py-1 text-xs">
        {hasRouteEndpoints ? routeLabel : <><DemoBadge /> {t.map.label}</>}
      </figcaption>
      {props.pickup && (
        <div className="absolute bottom-3 start-3 end-3 rounded-md bg-card/95 px-3 py-2 text-sm shadow">
          <span className="font-semibold text-primary">{pickupPoint?.label ?? props.pickup}</span> → <span className="font-semibold text-terracotta">{destinationPoint?.label ?? props.destination}</span>
          {directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-1 block font-semibold text-primary underline">{openLabel}</a>}
        </div>
      )}
    </figure>
  );
}

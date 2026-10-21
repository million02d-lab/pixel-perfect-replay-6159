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
  const { t } = useI18n();
  const { pickupPoint, destinationPoint } = props;
  const live = Boolean(pickupPoint && destinationPoint);
  const mapSrc = live && pickupPoint && destinationPoint
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(pickupPoint.longitude, destinationPoint.longitude) - 0.015}%2C${Math.min(pickupPoint.latitude, destinationPoint.latitude) - 0.015}%2C${Math.max(pickupPoint.longitude, destinationPoint.longitude) + 0.015}%2C${Math.max(pickupPoint.latitude, destinationPoint.latitude) + 0.015}&layer=mapnik&marker=${pickupPoint.latitude}%2C${pickupPoint.longitude}`
    : null;
  return (
    <figure className="relative min-h-64 overflow-hidden rounded-2xl border bg-secondary" aria-label={t.map.label}>
      {mapSrc ? (
        <iframe
          title={`OpenStreetMap — ${pickupPoint?.label} to ${destinationPoint?.label}`}
          src={mapSrc}
          className="h-full min-h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
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
        {live ? "© OpenStreetMap contributors" : <><DemoBadge /> {t.map.label}</>}
      </figcaption>
      {props.pickup && (
        <div className="absolute bottom-3 start-3 end-3 rounded-md bg-card/95 px-3 py-2 text-sm shadow">
          <span className="font-semibold text-primary">{pickupPoint?.label ?? props.pickup}</span> → <span className="font-semibold text-terracotta">{destinationPoint?.label ?? props.destination}</span>
        </div>
      )}
    </figure>
  );
}

import { useI18n } from "@/i18n/I18nProvider";
import { DemoBadge } from "@/components/site/DemoBadge";

/**
 * Map provider abstraction. Replace DemoMap with a Mapbox / Google Maps
 * implementation once a provider key is configured (see README).
 */
export interface MapProviderProps { pickup?: string | undefined; destination?: string | undefined }

export function MapPanel(props: MapProviderProps) {
  const { t } = useI18n();
  return (
    <figure className="relative overflow-hidden rounded-2xl border bg-secondary" aria-label={t.map.label}>
      <svg viewBox="0 0 400 260" className="h-full min-h-64 w-full" role="img" aria-label={t.map.label}>
        <rect width="400" height="260" fill="var(--secondary)" />
        <path d="M0 150 C80 120 140 190 220 140 S340 90 400 120 L400 175 C330 150 260 200 210 185 S80 170 0 205Z" fill="var(--chart-4)" opacity=".35" />
        {[40, 90, 140, 190, 240].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y + 15} stroke="var(--border)" strokeWidth="6" />)}
        {[60, 140, 220, 300, 360].map((x) => <line key={x} y1="0" y2="260" x1={x} x2={x - 20} stroke="var(--border)" strokeWidth="6" />)}
        <path d="M80 210 C120 160 180 180 210 120 S300 70 320 50" stroke="var(--primary)" strokeWidth="5" fill="none" strokeDasharray="10 6" strokeLinecap="round" />
        <circle cx="80" cy="210" r="9" fill="var(--primary)" stroke="var(--ivory)" strokeWidth="3" />
        <circle cx="320" cy="50" r="9" fill="var(--terracotta)" stroke="var(--ivory)" strokeWidth="3" />
      </svg>
      <figcaption className="absolute start-3 top-3 flex items-center gap-2 rounded-md bg-card/90 px-2 py-1 text-xs">
        <DemoBadge /> {t.map.label}
      </figcaption>
      {props.pickup && (
        <div className="absolute bottom-3 start-3 end-3 rounded-md bg-card/90 px-3 py-2 text-sm">
          <span className="font-semibold text-primary">{props.pickup}</span> → <span className="font-semibold text-terracotta">{props.destination}</span>
        </div>
      )}
    </figure>
  );
}

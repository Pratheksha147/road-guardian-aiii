import { MicroZone, RiskScore } from '@/types/safezone';
import { RiskBadge } from './RiskBadge';
import { MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoneCardProps {
  zone: MicroZone;
  riskScore?: RiskScore;
  distance?: number;
  onClick?: () => void;
  selected?: boolean;
}

const featureLabels: Record<string, string> = {
  sharp_curve: '🔄 Curve',
  blind_intersection: '👁️ Blind',
  poor_lighting: '🌙 Dark',
  steep_slope: '⛰️ Slope',
  narrow_road: '↔️ Narrow',
  high_traffic: '🚗 Traffic',
  school_zone: '🏫 School',
  pedestrian_crossing: '🚶 Pedestrian',
  construction: '🚧 Construction',
};

export const ZoneCard = ({ zone, riskScore, distance, onClick, selected }: ZoneCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        'card-elevated cursor-pointer p-4 transition-all duration-200 hover:border-primary/50',
        selected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{zone.name}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {zone.description}
          </p>
        </div>
        
        {riskScore && (
          <RiskBadge level={riskScore.level} score={riskScore.score} showScore />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {zone.features.slice(0, 4).map((feature) => (
          <span 
            key={feature}
            className="rounded-md bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {featureLabels[feature] || feature}
          </span>
        ))}
        {zone.features.length > 4 && (
          <span className="rounded-md bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">
            +{zone.features.length - 4}
          </span>
        )}
      </div>

      {distance !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away</span>
        </div>
      )}
    </div>
  );
};

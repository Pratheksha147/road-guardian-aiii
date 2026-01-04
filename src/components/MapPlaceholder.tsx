import { useState } from 'react';
import { MicroZone, DriverLocation, RiskScore } from '@/types/safezone';
import { microZones, calculateDistance } from '@/data/microZones';
import { calculateRiskScore, getSimulatedWeather, getSimulatedTraffic } from '@/lib/riskEngine';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';

interface MapPlaceholderProps {
  driverLocation: DriverLocation | null;
  selectedZone: MicroZone | null;
  onZoneSelect: (zone: MicroZone) => void;
}

// This is a simplified visual map placeholder
// In production, this would be replaced with Google Maps integration
export const MapPlaceholder = ({ driverLocation, selectedZone, onZoneSelect }: MapPlaceholderProps) => {
  const weather = getSimulatedWeather();
  const traffic = getSimulatedTraffic();
  const hour = new Date().getHours();

  // Calculate positions relative to a viewport
  const getZonePosition = (zone: MicroZone) => {
    if (!driverLocation) {
      // Default positions when no driver location
      const latOffset = (zone.lat - 37.77) * 1000;
      const lngOffset = (zone.lng + 122.44) * 1000;
      return {
        left: `${50 + lngOffset * 5}%`,
        top: `${50 - latOffset * 5}%`,
      };
    }
    
    const latOffset = (zone.lat - driverLocation.lat) * 1000;
    const lngOffset = (zone.lng - driverLocation.lng) * 1000;
    return {
      left: `${50 + lngOffset * 15}%`,
      top: `${50 - latOffset * 15}%`,
    };
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-critical';
      case 'high': return 'bg-danger';
      case 'moderate': return 'bg-warning';
      case 'low': return 'bg-secondary';
      default: return 'bg-safe';
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/50 to-background">
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Map label */}
      <div className="absolute left-4 top-4 z-10 glass-panel rounded-lg px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          📍 San Francisco Bay Area
        </span>
      </div>

      {/* Legend */}
      <div className="absolute right-4 top-4 z-10 glass-panel rounded-lg p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Risk Zones</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-safe" />
            <span className="text-xs text-muted-foreground">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-danger" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-critical animate-pulse" />
            <span className="text-xs text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>

      {/* Micro-zones */}
      {microZones.map((zone) => {
        const position = getZonePosition(zone);
        const riskScore = calculateRiskScore(zone, weather, traffic, hour);
        const isSelected = selectedZone?.id === zone.id;
        const distance = driverLocation 
          ? calculateDistance(driverLocation.lat, driverLocation.lng, zone.lat, zone.lng)
          : 0;

        return (
          <div
            key={zone.id}
            className="absolute z-20 cursor-pointer"
            style={position}
            onClick={() => onZoneSelect(zone)}
          >
            {/* Ripple effect for high-risk zones */}
            {(riskScore.level === 'high' || riskScore.level === 'critical') && (
              <div 
                className={cn(
                  'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
                  getRiskColor(riskScore.level),
                  'h-12 w-12 opacity-30 animate-ripple'
                )}
              />
            )}
            
            {/* Zone marker */}
            <div 
              className={cn(
                'relative flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200',
                getRiskColor(riskScore.level),
                isSelected && 'ring-4 ring-primary scale-125'
              )}
            >
              <AlertTriangle className="h-5 w-5 text-white" />
              
              {/* Score label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="rounded bg-card/90 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                  {riskScore.score}
                </span>
              </div>
            </div>

            {/* Zone name tooltip on hover/select */}
            {isSelected && (
              <div className="absolute left-1/2 top-full mt-8 -translate-x-1/2 glass-panel rounded-lg px-3 py-2 whitespace-nowrap animate-fade-in">
                <p className="text-sm font-medium text-foreground">{zone.name}</p>
                {driverLocation && (
                  <p className="text-xs text-muted-foreground">
                    {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Driver position */}
      {driverLocation && (
        <div 
          className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            {/* Accuracy circle */}
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20" />
            
            {/* Driver marker */}
            <div 
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
              style={{ transform: `rotate(${driverLocation.heading}deg)` }}
            >
              <Navigation className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* Coordinates display */}
      {driverLocation && (
        <div className="absolute bottom-4 left-4 z-10 glass-panel rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground">
          <p>LAT: {driverLocation.lat.toFixed(4)}</p>
          <p>LNG: {driverLocation.lng.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
};

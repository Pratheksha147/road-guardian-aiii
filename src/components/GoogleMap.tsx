/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from 'react';
import { MicroZone, DriverLocation } from '@/types/safezone';
import { microZones, calculateDistance } from '@/data/microZones';
import { calculateRiskScore, getSimulatedWeather, getSimulatedTraffic } from '@/lib/riskEngine';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Loader2 } from 'lucide-react';

interface GoogleMapProps {
  driverLocation: DriverLocation | null;
  selectedZone: MicroZone | null;
  onZoneSelect: (zone: MicroZone) => void;
}

const getRiskColor = (level: string): string => {
  switch (level) {
    case 'critical': return '#dc2626'; // red-600
    case 'high': return '#ea580c'; // orange-600
    case 'moderate': return '#ca8a04'; // yellow-600
    case 'low': return '#16a34a'; // green-600
    default: return '#22c55e'; // green-500
  }
};

export const GoogleMap = ({ driverLocation, selectedZone, onZoneSelect }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  
  const { isLoaded, isLoading, error } = useGoogleMaps();
  const [mapId] = useState('safezone-map');

  const weather = getSimulatedWeather();
  const traffic = getSimulatedTraffic();
  const hour = new Date().getHours();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = driverLocation 
      ? { lat: driverLocation.lat, lng: driverLocation.lng }
      : { lat: 37.7749, lng: -122.4194 }; // San Francisco default

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapId: mapId,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#746855' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry.fill',
          stylers: [{ color: '#1a365d' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38302e' }]
        }
      ]
    });

    // Create zone markers and circles
    microZones.forEach((zone) => {
      const riskScore = calculateRiskScore(zone, weather, traffic, hour);
      const color = getRiskColor(riskScore.level);

      // Create risk zone circle
      const circle = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: zone.lat, lng: zone.lng },
        radius: zone.radius,
        fillColor: color,
        fillOpacity: 0.25,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
      });

      circle.addListener('click', () => onZoneSelect(zone));
      circlesRef.current.push(circle);

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'zone-marker';
      markerElement.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <span style="color: white; font-weight: bold; font-size: 12px;">${riskScore.score}</span>
        </div>
        <div style="
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 4px;
          padding: 4px 8px;
          background: rgba(0,0,0,0.8);
          color: white;
          font-size: 10px;
          border-radius: 4px;
          white-space: nowrap;
        ">${zone.name}</div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: zone.lat, lng: zone.lng },
        content: markerElement,
        title: zone.name,
      });

      marker.addListener('click', () => onZoneSelect(zone));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.map = null);
      circlesRef.current.forEach(c => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    };
  }, [isLoaded, weather, traffic, hour, onZoneSelect]);

  // Update driver position
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !driverLocation) return;

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.map = null;
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    // Create accuracy circle
    accuracyCircleRef.current = new google.maps.Circle({
      map: mapInstanceRef.current,
      center: { lat: driverLocation.lat, lng: driverLocation.lng },
      radius: 50,
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.5,
      strokeWeight: 1,
    });

    // Create driver marker
    const driverElement = document.createElement('div');
    driverElement.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #3b82f6;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        transform: rotate(${driverLocation.heading}deg);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </div>
    `;

    driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapInstanceRef.current,
      position: { lat: driverLocation.lat, lng: driverLocation.lng },
      content: driverElement,
      title: 'Your Location',
    });

    // Center map on driver
    mapInstanceRef.current.panTo({ lat: driverLocation.lat, lng: driverLocation.lng });
  }, [isLoaded, driverLocation]);

  // Highlight selected zone
  useEffect(() => {
    if (!selectedZone || !mapInstanceRef.current) return;

    mapInstanceRef.current.panTo({ lat: selectedZone.lat, lng: selectedZone.lng });
    mapInstanceRef.current.setZoom(15);
  }, [selectedZone]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary/50">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load map</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Legend overlay */}
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

      {/* Coordinates display */}
      {driverLocation && (
        <div className="absolute bottom-4 left-4 z-10 glass-panel rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground">
          <p>LAT: {driverLocation.lat.toFixed(4)}</p>
          <p>LNG: {driverLocation.lng.toFixed(4)}</p>
          <p>SPD: {driverLocation.speed?.toFixed(0) || 0} km/h</p>
        </div>
      )}

      {/* Selected zone info */}
      {selectedZone && driverLocation && (
        <div className="absolute bottom-4 right-4 z-10 glass-panel rounded-lg px-3 py-2">
          <p className="text-sm font-medium text-foreground">{selectedZone.name}</p>
          <p className="text-xs text-muted-foreground">
            {(() => {
              const dist = calculateDistance(driverLocation.lat, driverLocation.lng, selectedZone.lat, selectedZone.lng);
              return dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`;
            })()}
          </p>
        </div>
      )}
    </div>
  );
};

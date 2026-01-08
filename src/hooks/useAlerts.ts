import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, DriverLocation, WeatherCondition, TrafficDensity } from '@/types/safezone';
import { microZones, calculateDistance } from '@/data/microZones';
import { calculateRiskScore, getSimulatedWeather, getSimulatedTraffic } from '@/lib/riskEngine';

const ALERT_DISTANCE_KM = 0.5; // Alert when within 500m
const ALERT_COOLDOWN_MS = 120000; // 2 minutes between alerts for same zone
const CONDITION_UPDATE_INTERVAL_MS = 20000; // Update weather/traffic every 20 seconds

export const useAlerts = (location: DriverLocation | null) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [alertHistory, setAlertHistory] = useState<Map<string, number>>(new Map());
  
  // Stable conditions - updated every 20 seconds
  const stableConditionsRef = useRef<{ weather: WeatherCondition; traffic: TrafficDensity }>({
    weather: getSimulatedWeather(),
    traffic: getSimulatedTraffic(),
  });
  
  // Update conditions every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      stableConditionsRef.current = {
        weather: getSimulatedWeather(),
        traffic: getSimulatedTraffic(),
      };
    }, CONDITION_UPDATE_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, []);

  const checkForAlerts = useCallback(() => {
    if (!location) return;

    const now = Date.now();
    const { weather, traffic } = stableConditionsRef.current;
    const hour = new Date().getHours();

    microZones.forEach(zone => {
      const distance = calculateDistance(location.lat, location.lng, zone.lat, zone.lng);
      
      // Check if within alert range
      if (distance <= ALERT_DISTANCE_KM) {
        const lastAlertTime = alertHistory.get(zone.id) || 0;
        
        // Check cooldown
        if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
          const riskScore = calculateRiskScore(zone, weather, traffic, hour);
          
          // Only alert for moderate risk or higher
          if (riskScore.score >= 40) {
            const newAlert: Alert = {
              id: `alert-${zone.id}-${now}`,
              zoneId: zone.id,
              zoneName: zone.name,
              riskScore,
              distance: distance * 1000, // Convert to meters
              estimatedArrival: Math.round((distance * 1000) / (location.speed || 10)),
              timestamp: now,
              acknowledged: false,
            };

            setAlerts(prev => [newAlert, ...prev].slice(0, 50));
            setActiveAlert(newAlert);
            setAlertHistory(prev => new Map(prev).set(zone.id, now));
          }
        }
      }
    });
  }, [location, alertHistory]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a)
    );
    if (activeAlert?.id === alertId) {
      setActiveAlert(null);
    }
  }, [activeAlert]);

  const dismissActiveAlert = useCallback(() => {
    if (activeAlert) {
      acknowledgeAlert(activeAlert.id);
    }
  }, [activeAlert, acknowledgeAlert]);

  useEffect(() => {
    const interval = setInterval(checkForAlerts, 3000);
    return () => clearInterval(interval);
  }, [checkForAlerts]);

  return {
    alerts,
    activeAlert,
    acknowledgeAlert,
    dismissActiveAlert,
  };
};

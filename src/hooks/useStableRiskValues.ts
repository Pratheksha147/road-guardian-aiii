import { useState, useEffect, useRef, useCallback } from 'react';
import { MicroZone, RiskScore, WeatherCondition, TrafficDensity, DriverLocation } from '@/types/safezone';
import { microZones, calculateDistance } from '@/data/microZones';
import { calculateRiskScore, getSimulatedWeather, getSimulatedTraffic } from '@/lib/riskEngine';

const UPDATE_INTERVAL_MS = 20000; // 20 seconds between updates
const SMOOTHING_DURATION_MS = 2000; // 2 seconds for smooth transition

interface StableRiskData {
  zone: MicroZone;
  risk: RiskScore;
  distance: number;
}

interface StableConditions {
  weather: WeatherCondition;
  traffic: TrafficDensity;
}

export const useStableRiskValues = (location: DriverLocation | null) => {
  const [stableNearestZone, setStableNearestZone] = useState<StableRiskData | null>(null);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [stableConditions, setStableConditions] = useState<StableConditions>({
    weather: getSimulatedWeather(),
    traffic: getSimulatedTraffic(),
  });
  
  const lastUpdateRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const targetScoreRef = useRef<number>(0);

  // Smooth transition animation
  const animateToScore = useCallback((targetScore: number) => {
    const startScore = displayScore;
    const startTime = Date.now();
    
    targetScoreRef.current = targetScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SMOOTHING_DURATION_MS, 1);
      
      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (targetScore - startScore) * easeOut);
      
      setDisplayScore(currentScore);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [displayScore]);

  // Calculate new risk values - only called every 20 seconds
  const calculateNewValues = useCallback(() => {
    if (!location) return;

    const weather = getSimulatedWeather();
    const traffic = getSimulatedTraffic();
    
    setStableConditions({ weather, traffic });

    let nearest: StableRiskData | null = null;
    let minDistance = Infinity;

    microZones.forEach(zone => {
      const distance = calculateDistance(location.lat, location.lng, zone.lat, zone.lng);
      if (distance < minDistance) {
        minDistance = distance;
        const hour = new Date().getHours();
        const risk = calculateRiskScore(zone, weather, traffic, hour);
        nearest = { zone, risk, distance };
      }
    });

    if (nearest) {
      setStableNearestZone(nearest);
      animateToScore((nearest as StableRiskData).risk.score);
    }
  }, [location, animateToScore]);

  // Initial calculation and 20-second interval updates
  useEffect(() => {
    const now = Date.now();
    
    // Initial calculation on mount or location change (only if 20s has passed)
    if (now - lastUpdateRef.current >= UPDATE_INTERVAL_MS || lastUpdateRef.current === 0) {
      calculateNewValues();
      lastUpdateRef.current = now;
    }

    // Set up 20-second interval
    const interval = setInterval(() => {
      calculateNewValues();
      lastUpdateRef.current = Date.now();
    }, UPDATE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [calculateNewValues]);

  // Calculate zone list with stable conditions (also every 20 seconds)
  const [stableZoneList, setStableZoneList] = useState<Array<{
    zone: MicroZone;
    riskScore: RiskScore;
    distance: number | undefined;
  }>>([]);

  useEffect(() => {
    const calculateZoneList = () => {
      const hour = new Date().getHours();
      const list = microZones.map(zone => {
        const riskScore = calculateRiskScore(zone, stableConditions.weather, stableConditions.traffic, hour);
        const distance = location 
          ? calculateDistance(location.lat, location.lng, zone.lat, zone.lng)
          : undefined;
        return { zone, riskScore, distance };
      });
      setStableZoneList(list);
    };

    calculateZoneList();
    
    const interval = setInterval(calculateZoneList, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [location, stableConditions]);

  return {
    stableNearestZone,
    displayScore,
    stableConditions,
    stableZoneList,
  };
};

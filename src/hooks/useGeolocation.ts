import { useState, useEffect, useCallback } from 'react';
import { DriverLocation } from '@/types/safezone';

interface GeolocationState {
  location: DriverLocation | null;
  error: string | null;
  isTracking: boolean;
}

export const useGeolocation = (enableTracking: boolean = false) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isTracking: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const updateLocation = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading || 0,
        speed: position.coords.speed || 0,
        timestamp: position.timestamp,
      },
      error: null,
      isTracking: true,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get location';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }
    setState(prev => ({ ...prev, error: errorMessage, isTracking: false }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, options);

    // Start watching position
    const id = navigator.geolocation.watchPosition(updateLocation, handleError, options);
    setWatchId(id);
  }, [updateLocation, handleError]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState(prev => ({ ...prev, isTracking: false }));
    }
  }, [watchId]);

  useEffect(() => {
    if (enableTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
};

// Simulated location for demo purposes
export const useSimulatedLocation = (enabled: boolean = true) => {
  const [location, setLocation] = useState<DriverLocation>({
    lat: 37.7749,
    lng: -122.4194,
    heading: 45,
    speed: 35,
    timestamp: Date.now(),
  });

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.002,
        lng: prev.lng + (Math.random() - 0.5) * 0.002,
        heading: (prev.heading + Math.random() * 10 - 5 + 360) % 360,
        speed: Math.max(0, Math.min(65, prev.speed + (Math.random() - 0.5) * 10)),
        timestamp: Date.now(),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  return { location, isTracking: enabled, error: null };
};

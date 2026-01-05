/// <reference types="@types/google.maps" />
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGoogleMaps = useCallback(async () => {
    // Already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    try {
      // Fetch API key from edge function
      const { data, error: fetchError } = await supabase.functions.invoke('get-maps-key');
      
      if (fetchError || !data?.apiKey) {
        throw new Error(fetchError?.message || 'Failed to load Maps API key');
      }

      // Create callback for when script loads
      window.initGoogleMaps = () => {
        setIsLoaded(true);
        setIsLoading(false);
      };

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initGoogleMaps&libraries=marker`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  return { isLoaded, isLoading, error };
};

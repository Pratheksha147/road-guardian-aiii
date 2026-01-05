import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, WeatherCondition, TrafficDensity } from '@/types/safezone';

export interface AIReasoning {
  explanation: string;
  primaryRisk: string;
  recommendations: string[];
  safeSpeed: string;
  alertLevel: 'CAUTION' | 'WARNING' | 'DANGER';
}

interface UseAIReasoningReturn {
  reasoning: AIReasoning | null;
  isLoading: boolean;
  error: string | null;
  generateReasoning: (alert: Alert, speed: number, weather: WeatherCondition, traffic: TrafficDensity) => Promise<AIReasoning | null>;
}

export const useAIReasoning = (): UseAIReasoningReturn => {
  const [reasoning, setReasoning] = useState<AIReasoning | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReasoning = useCallback(async (
    alert: Alert,
    speed: number,
    weather: WeatherCondition,
    traffic: TrafficDensity
  ): Promise<AIReasoning | null> => {
    setIsLoading(true);
    setError(null);

    const hour = new Date().getHours();
    const timeOfDay = hour >= 6 && hour < 12 ? 'morning' :
                      hour >= 12 && hour < 18 ? 'afternoon' :
                      hour >= 18 && hour < 22 ? 'evening' : 'night';

    const riskInput = {
      zoneName: alert.zoneName,
      riskScore: alert.riskScore.score,
      riskLevel: alert.riskScore.level,
      factors: alert.riskScore.factors,
      zoneFeatures: Array.isArray(alert.riskScore.explanation) 
        ? alert.riskScore.explanation 
        : [alert.riskScore.explanation],
      weather: `${weather.condition}, road: ${weather.roadCondition}, visibility: ${weather.visibility}%`,
      traffic: `${traffic.level} traffic, avg speed: ${traffic.averageSpeed} km/h`,
      timeOfDay,
      distance: alert.distance,
      speed,
    };

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-risk-reasoning', {
        body: { riskInput }
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message);
      }

      if (data.fallback) {
        console.warn('Using fallback reasoning:', data.error);
      }

      if (data.reasoning) {
        setReasoning(data.reasoning);
        return data.reasoning;
      }

      // Generate fallback if no reasoning returned
      const explanation = alert.riskScore.explanation;
      const fallback: AIReasoning = {
        explanation: `Approaching ${alert.zoneName} zone with ${alert.riskScore.level} risk level.`,
        primaryRisk: typeof explanation === 'string' ? explanation : 'Road conditions',
        recommendations: [
          'Reduce speed before entering zone',
          'Stay alert and focused',
          'Maintain safe following distance'
        ],
        safeSpeed: alert.riskScore.score > 70 ? '30 km/h' : '40 km/h',
        alertLevel: alert.riskScore.level === 'critical' ? 'DANGER' : 
                   alert.riskScore.level === 'high' ? 'WARNING' : 'CAUTION'
      };
      
      setReasoning(fallback);
      return fallback;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate reasoning';
      console.error('AI reasoning error:', errorMessage);
      setError(errorMessage);
      
      // Return fallback on error
      const fallback: AIReasoning = {
        explanation: `Caution: ${alert.zoneName} ahead with elevated risk.`,
        primaryRisk: 'Variable conditions',
        recommendations: ['Reduce speed', 'Stay alert'],
        safeSpeed: '40 km/h',
        alertLevel: 'CAUTION'
      };
      setReasoning(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reasoning,
    isLoading,
    error,
    generateReasoning,
  };
};

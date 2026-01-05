import { useState, useEffect, useRef } from 'react';
import { MicroZone, RiskScore } from '@/types/safezone';
import { useSimulatedLocation } from '@/hooks/useGeolocation';
import { useAlerts } from '@/hooks/useAlerts';
import { useVoiceAlerts } from '@/hooks/useVoiceAlerts';
import { useAIReasoning } from '@/hooks/useAIReasoning';
import { microZones, calculateDistance } from '@/data/microZones';
import { calculateRiskScore, getSimulatedWeather, getSimulatedTraffic } from '@/lib/riskEngine';
import { MapPlaceholder } from './MapPlaceholder';
import { AIAlertCard } from './AIAlertCard';
import { ZoneCard } from './ZoneCard';
import { SpeedDisplay } from './SpeedDisplay';
import { StatusIndicator } from './StatusIndicator';
import { RiskMeter } from './RiskMeter';
import { VoiceIndicator } from './VoiceIndicator';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, List, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DriverView = () => {
  const [isTracking, setIsTracking] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedZone, setSelectedZone] = useState<MicroZone | null>(null);
  const [showZoneList, setShowZoneList] = useState(false);
  
  const { location, isTracking: gpsActive } = useSimulatedLocation(isTracking);
  const { alerts, activeAlert, dismissActiveAlert } = useAlerts(location);
  const { isSupported, isSpeaking, speakAlert, stop } = useVoiceAlerts(voiceEnabled);
  const { reasoning, isLoading: isLoadingAI, generateReasoning } = useAIReasoning();
  
  // Track last spoken alert and last AI-analyzed alert
  const lastSpokenAlertRef = useRef<string | null>(null);
  const lastAnalyzedAlertRef = useRef<string | null>(null);

  // Calculate nearest zone risk
  const [nearestZoneRisk, setNearestZoneRisk] = useState<{ zone: MicroZone; risk: RiskScore; distance: number } | null>(null);

  // Get current conditions
  const weather = getSimulatedWeather();
  const traffic = getSimulatedTraffic();

  // Generate AI reasoning when a new alert appears
  useEffect(() => {
    if (activeAlert && activeAlert.id !== lastAnalyzedAlertRef.current) {
      lastAnalyzedAlertRef.current = activeAlert.id;
      generateReasoning(activeAlert, location?.speed || 0, weather, traffic);
    }
  }, [activeAlert, location?.speed, weather, traffic, generateReasoning]);

  // Speak alert when AI reasoning is ready
  useEffect(() => {
    if (activeAlert && reasoning && voiceEnabled && activeAlert.id !== lastSpokenAlertRef.current) {
      // Use AI-enhanced explanation for voice
      const explanation = reasoning.explanation;
      const action = `Recommended speed: ${reasoning.safeSpeed}. ${reasoning.recommendations[0] || ''}`;
      
      speakAlert(
        activeAlert.zoneName,
        activeAlert.riskScore.level,
        activeAlert.riskScore.score,
        explanation,
        action
      );
      lastSpokenAlertRef.current = activeAlert.id;
    }
  }, [activeAlert, reasoning, voiceEnabled, speakAlert]);

  // Stop speaking when voice is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      stop();
    }
  }, [voiceEnabled, stop]);

  useEffect(() => {
    if (!location) return;

    let nearest: { zone: MicroZone; risk: RiskScore; distance: number } | null = null;
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

    setNearestZoneRisk(nearest);
  }, [location, weather, traffic]);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Map area */}
      <div className="relative flex-1">
        <MapPlaceholder 
          driverLocation={location}
          selectedZone={selectedZone}
          onZoneSelect={setSelectedZone}
        />

        {/* Overlay controls - Top Left */}
        <div className="absolute left-4 top-4 z-30 flex flex-col gap-3">
          <StatusIndicator isTracking={gpsActive} />
          
          <div className="flex gap-2">
            <Button
              variant="glass"
              size="icon"
              onClick={() => setIsTracking(!isTracking)}
              className="h-10 w-10"
            >
              {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant={voiceEnabled ? "glass" : "ghost"}
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn("h-10 w-10", !voiceEnabled && "opacity-50")}
              title={isSupported ? "Toggle voice alerts" : "Voice alerts not supported"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="glass"
              size="icon"
              onClick={() => setShowZoneList(!showZoneList)}
              className="h-10 w-10 lg:hidden"
            >
              {showZoneList ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Voice Status Indicator */}
          {voiceEnabled && isSupported && (
            <VoiceIndicator isSpeaking={isSpeaking} />
          )}
          
          {/* AI Status */}
          {activeAlert && (
            <div className="flex items-center gap-2 glass-panel rounded-lg px-3 py-2">
              <Sparkles className={cn("h-4 w-4", isLoadingAI ? "animate-pulse text-primary" : "text-safe")} />
              <span className="text-xs text-muted-foreground">
                {isLoadingAI ? 'AI Analyzing...' : 'AI Enhanced'}
              </span>
            </div>
          )}
        </div>

        {/* Speed display - Bottom Right */}
        {location && (
          <div className="absolute bottom-4 right-4 z-30">
            <SpeedDisplay speed={location.speed} />
          </div>
        )}

        {/* Nearest zone risk - Top Right */}
        {nearestZoneRisk && (
          <div className="absolute right-4 top-20 z-30 glass-panel rounded-xl p-4 lg:top-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Nearest Zone Risk</p>
            <RiskMeter 
              score={nearestZoneRisk.risk.score} 
              level={nearestZoneRisk.risk.level}
              size="sm"
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {nearestZoneRisk.zone.name}
            </p>
          </div>
        )}

        {/* Active Alert Overlay with AI Enhancement */}
        {activeAlert && (
          <div className="absolute bottom-20 left-4 right-4 z-40 lg:bottom-4 lg:left-auto lg:right-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-[500px]">
            <AIAlertCard 
              alert={activeAlert}
              aiReasoning={reasoning}
              isLoadingAI={isLoadingAI}
              onDismiss={dismissActiveAlert}
              isActive
            />
          </div>
        )}
      </div>

      {/* Sidebar - Zone List */}
      <div className={cn(
        'absolute inset-y-0 right-0 z-30 w-80 transform transition-transform duration-300 lg:relative lg:transform-none',
        'glass-panel border-l border-border',
        showZoneList ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="font-semibold text-foreground">Nearby Zones</h2>
              <p className="text-xs text-muted-foreground">{microZones.length} risk zones detected</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowZoneList(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {microZones.map(zone => {
                const hour = new Date().getHours();
                const riskScore = calculateRiskScore(zone, weather, traffic, hour);
                const distance = location 
                  ? calculateDistance(location.lat, location.lng, zone.lat, zone.lng)
                  : undefined;

                return (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    riskScore={riskScore}
                    distance={distance}
                    selected={selectedZone?.id === zone.id}
                    onClick={() => setSelectedZone(zone)}
                  />
                );
              })}
            </div>
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="border-t border-border p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Alerts</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {alerts.slice(0, 5).map(alert => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <span className="text-xs text-foreground truncate">{alert.zoneName}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      alert.riskScore.level === 'critical' && 'bg-critical text-critical-foreground',
                      alert.riskScore.level === 'high' && 'bg-danger text-danger-foreground',
                      alert.riskScore.level === 'moderate' && 'bg-warning text-warning-foreground',
                    )}>
                      {alert.riskScore.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

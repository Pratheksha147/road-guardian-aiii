export interface MicroZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  features: RoadFeature[];
  baseRiskScore: number;
  description: string;
}

export type RoadFeature = 
  | 'sharp_curve'
  | 'blind_intersection'
  | 'poor_lighting'
  | 'steep_slope'
  | 'narrow_road'
  | 'high_traffic'
  | 'school_zone'
  | 'pedestrian_crossing'
  | 'construction';

export type RiskLevel = 'safe' | 'low' | 'moderate' | 'high' | 'critical';

export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  explanation: string;
  suggestedAction: string;
}

export interface RiskFactor {
  name: string;
  impact: number; // 0-100
  description: string;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  zoneId: string;
  zoneName: string;
  riskScore: RiskScore;
  distance: number;
  estimatedArrival: number; // seconds
  timestamp: number;
  acknowledged: boolean;
}

export interface WeatherCondition {
  condition: 'clear' | 'rain' | 'fog' | 'snow' | 'storm';
  visibility: number; // 0-100
  roadCondition: 'dry' | 'wet' | 'icy' | 'flooded';
}

export interface TrafficDensity {
  level: 'low' | 'moderate' | 'high' | 'congested';
  averageSpeed: number;
}

export interface ZoneAnalytics {
  zoneId: string;
  zoneName: string;
  alertCount: number;
  averageRiskScore: number;
  peakHours: number[];
  incidentCount: number;
  lastUpdated: number;
}

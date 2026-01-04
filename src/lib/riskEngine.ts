import { MicroZone, RiskScore, RiskLevel, RiskFactor, WeatherCondition, TrafficDensity, RoadFeature } from '@/types/safezone';

const featureRiskModifiers: Record<RoadFeature, { name: string; baseImpact: number }> = {
  sharp_curve: { name: 'Sharp Curve', baseImpact: 20 },
  blind_intersection: { name: 'Blind Intersection', baseImpact: 25 },
  poor_lighting: { name: 'Poor Lighting', baseImpact: 15 },
  steep_slope: { name: 'Steep Slope', baseImpact: 18 },
  narrow_road: { name: 'Narrow Road', baseImpact: 12 },
  high_traffic: { name: 'High Traffic Area', baseImpact: 15 },
  school_zone: { name: 'School Zone', baseImpact: 22 },
  pedestrian_crossing: { name: 'Pedestrian Crossing', baseImpact: 18 },
  construction: { name: 'Construction Zone', baseImpact: 20 },
};

export const calculateRiskScore = (
  zone: MicroZone,
  weather: WeatherCondition,
  traffic: TrafficDensity,
  timeOfDay: number // 0-23 hours
): RiskScore => {
  const factors: RiskFactor[] = [];
  let totalScore = zone.baseRiskScore;

  // Time of day factor
  const isNight = timeOfDay < 6 || timeOfDay > 20;
  const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 16 && timeOfDay <= 19);
  
  if (isNight) {
    const nightImpact = zone.features.includes('poor_lighting') ? 25 : 15;
    totalScore += nightImpact;
    factors.push({
      name: 'Night Conditions',
      impact: nightImpact,
      description: 'Reduced visibility during nighttime hours',
    });
  }

  if (isRushHour) {
    const rushImpact = 12;
    totalScore += rushImpact;
    factors.push({
      name: 'Rush Hour Traffic',
      impact: rushImpact,
      description: 'Increased vehicle density during peak hours',
    });
  }

  // Weather factors
  if (weather.condition !== 'clear') {
    const weatherImpacts: Record<string, number> = {
      rain: 20,
      fog: 30,
      snow: 35,
      storm: 40,
    };
    const weatherImpact = weatherImpacts[weather.condition] || 10;
    totalScore += weatherImpact;
    factors.push({
      name: `${weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)} Weather`,
      impact: weatherImpact,
      description: `${weather.condition} conditions affecting road safety`,
    });
  }

  if (weather.roadCondition !== 'dry') {
    const roadConditionImpacts: Record<string, number> = {
      wet: 15,
      icy: 40,
      flooded: 50,
    };
    const roadImpact = roadConditionImpacts[weather.roadCondition] || 10;
    totalScore += roadImpact;
    factors.push({
      name: `${weather.roadCondition.charAt(0).toUpperCase() + weather.roadCondition.slice(1)} Road Surface`,
      impact: roadImpact,
      description: `Road surface is ${weather.roadCondition}, reducing traction`,
    });
  }

  // Traffic density factor
  if (traffic.level === 'high' || traffic.level === 'congested') {
    const trafficImpact = traffic.level === 'congested' ? 20 : 10;
    totalScore += trafficImpact;
    factors.push({
      name: 'Traffic Congestion',
      impact: trafficImpact,
      description: `${traffic.level} traffic density in this area`,
    });
  }

  // Road features
  zone.features.forEach(feature => {
    const modifier = featureRiskModifiers[feature];
    factors.push({
      name: modifier.name,
      impact: modifier.baseImpact,
      description: `This zone contains a ${modifier.name.toLowerCase()}`,
    });
  });

  // Cap score at 100
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine risk level
  const level = getRiskLevel(totalScore);

  // Generate explanation and suggested action
  const explanation = generateExplanation(zone, factors, level);
  const suggestedAction = getSuggestedAction(level, factors);

  return {
    score: Math.round(totalScore),
    level,
    factors: factors.sort((a, b) => b.impact - a.impact).slice(0, 5),
    explanation,
    suggestedAction,
  };
};

const getRiskLevel = (score: number): RiskLevel => {
  if (score < 20) return 'safe';
  if (score < 40) return 'low';
  if (score < 60) return 'moderate';
  if (score < 80) return 'high';
  return 'critical';
};

const generateExplanation = (zone: MicroZone, factors: RiskFactor[], level: RiskLevel): string => {
  const topFactors = factors.slice(0, 3).map(f => f.name.toLowerCase());
  
  if (level === 'critical') {
    return `CRITICAL: ${zone.name} is extremely dangerous right now due to ${topFactors.join(', ')}. Consider alternative routes.`;
  }
  if (level === 'high') {
    return `HIGH RISK: Approaching ${zone.name}. Risk elevated due to ${topFactors.join(' and ')}.`;
  }
  if (level === 'moderate') {
    return `CAUTION: ${zone.name} has moderate risk from ${topFactors.join(', ')}.`;
  }
  if (level === 'low') {
    return `${zone.name} has minor risk factors: ${topFactors.join(', ')}.`;
  }
  return `${zone.name} is currently safe for normal driving.`;
};

const getSuggestedAction = (level: RiskLevel, factors: RiskFactor[]): string => {
  const hasVisibilityIssue = factors.some(f => 
    f.name.includes('Night') || f.name.includes('Fog') || f.name.includes('Poor Lighting')
  );
  const hasSlipperyCondition = factors.some(f => 
    f.name.includes('Wet') || f.name.includes('Icy') || f.name.includes('Rain')
  );
  const hasCurve = factors.some(f => f.name.includes('Curve'));

  if (level === 'critical') {
    return 'Strongly recommend taking an alternative route. If you must proceed, reduce speed to 15 mph and use hazard lights.';
  }
  if (level === 'high') {
    if (hasSlipperyCondition) return 'Reduce speed to 25 mph. Increase following distance. Brake gently.';
    if (hasVisibilityIssue) return 'Turn on headlights. Reduce speed to 25 mph. Stay alert for pedestrians.';
    if (hasCurve) return 'Reduce speed to 20 mph before entering curve. Stay in your lane.';
    return 'Reduce speed significantly. Stay alert and be prepared to stop.';
  }
  if (level === 'moderate') {
    return 'Reduce speed to 30 mph. Stay alert and be prepared for hazards.';
  }
  if (level === 'low') {
    return 'Maintain safe speed. Be aware of surroundings.';
  }
  return 'Proceed normally. Maintain awareness of road conditions.';
};

export const getSimulatedWeather = (): WeatherCondition => {
  const conditions: WeatherCondition['condition'][] = ['clear', 'rain', 'fog', 'clear', 'clear'];
  const roadConditions: WeatherCondition['roadCondition'][] = ['dry', 'wet', 'dry', 'dry'];
  
  return {
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    visibility: Math.floor(Math.random() * 40) + 60,
    roadCondition: roadConditions[Math.floor(Math.random() * roadConditions.length)],
  };
};

export const getSimulatedTraffic = (): TrafficDensity => {
  const hour = new Date().getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  
  if (isRushHour) {
    return { level: 'high', averageSpeed: 25 };
  }
  
  const levels: TrafficDensity['level'][] = ['low', 'moderate', 'moderate'];
  return {
    level: levels[Math.floor(Math.random() * levels.length)],
    averageSpeed: Math.floor(Math.random() * 20) + 30,
  };
};

import { MicroZone } from '@/types/safezone';

// Simulated micro-zones around San Francisco for demo
export const microZones: MicroZone[] = [
  {
    id: 'zone-001',
    name: 'Lombard Street Curve',
    lat: 37.8021,
    lng: -122.4187,
    radius: 150,
    features: ['sharp_curve', 'steep_slope', 'high_traffic'],
    baseRiskScore: 65,
    description: 'Famous winding street with 8 hairpin turns and 27% grade',
  },
  {
    id: 'zone-002',
    name: 'Golden Gate Bridge North',
    lat: 37.8324,
    lng: -122.4795,
    radius: 300,
    features: ['high_traffic', 'narrow_road'],
    baseRiskScore: 45,
    description: 'High-traffic bridge approach with limited visibility during fog',
  },
  {
    id: 'zone-003',
    name: 'Twin Peaks Boulevard',
    lat: 37.7544,
    lng: -122.4477,
    radius: 200,
    features: ['sharp_curve', 'steep_slope', 'poor_lighting'],
    baseRiskScore: 70,
    description: 'Winding mountain road with sharp curves and limited lighting at night',
  },
  {
    id: 'zone-004',
    name: 'Market & Van Ness Junction',
    lat: 37.7749,
    lng: -122.4194,
    radius: 100,
    features: ['blind_intersection', 'high_traffic', 'pedestrian_crossing'],
    baseRiskScore: 55,
    description: 'Major intersection with heavy pedestrian and vehicle traffic',
  },
  {
    id: 'zone-005',
    name: 'Embarcadero Curve',
    lat: 37.7955,
    lng: -122.3937,
    radius: 180,
    features: ['sharp_curve', 'pedestrian_crossing', 'high_traffic'],
    baseRiskScore: 50,
    description: 'Curved waterfront road with tourist foot traffic',
  },
  {
    id: 'zone-006',
    name: '19th Avenue School Zone',
    lat: 37.7299,
    lng: -122.4745,
    radius: 250,
    features: ['school_zone', 'pedestrian_crossing', 'high_traffic'],
    baseRiskScore: 60,
    description: 'Multiple schools along corridor with heavy pedestrian activity',
  },
  {
    id: 'zone-007',
    name: 'Geary Boulevard Construction',
    lat: 37.7832,
    lng: -122.4556,
    radius: 200,
    features: ['construction', 'narrow_road', 'high_traffic'],
    baseRiskScore: 55,
    description: 'Active construction zone with lane restrictions',
  },
  {
    id: 'zone-008',
    name: 'Divisadero Hill',
    lat: 37.7870,
    lng: -122.4382,
    radius: 150,
    features: ['steep_slope', 'blind_intersection', 'poor_lighting'],
    baseRiskScore: 58,
    description: 'Steep hill with limited visibility at cross streets',
  },
];

export const getZoneById = (id: string): MicroZone | undefined => {
  return microZones.find(zone => zone.id === id);
};

export const getZonesNearLocation = (lat: number, lng: number, radiusKm: number = 5): MicroZone[] => {
  return microZones.filter(zone => {
    const distance = calculateDistance(lat, lng, zone.lat, zone.lng);
    return distance <= radiusKm;
  });
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

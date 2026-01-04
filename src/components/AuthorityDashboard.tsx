import { useState, useMemo } from 'react';
import { MicroZone, ZoneAnalytics } from '@/types/safezone';
import { microZones } from '@/data/microZones';
import { calculateRiskScore, getSimulatedWeather, getSimulatedTraffic } from '@/lib/riskEngine';
import { RiskBadge } from './RiskBadge';
import { RiskMeter } from './RiskMeter';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Shield,
  Sun,
  Moon,
  Cloud,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Simulated analytics data
const generateAnalytics = (): ZoneAnalytics[] => {
  return microZones.map(zone => ({
    zoneId: zone.id,
    zoneName: zone.name,
    alertCount: Math.floor(Math.random() * 500) + 100,
    averageRiskScore: zone.baseRiskScore + Math.floor(Math.random() * 20),
    peakHours: [7, 8, 17, 18],
    incidentCount: Math.floor(Math.random() * 20),
    lastUpdated: Date.now(),
  }));
};

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  alerts: Math.floor(Math.random() * 50) + (i >= 7 && i <= 9 || i >= 16 && i <= 19 ? 40 : 10),
  avgRisk: Math.floor(Math.random() * 30) + (i >= 7 && i <= 9 || i >= 16 && i <= 19 ? 50 : 30),
}));

const weeklyTrend = [
  { day: 'Mon', incidents: 12, alerts: 234 },
  { day: 'Tue', incidents: 8, alerts: 189 },
  { day: 'Wed', incidents: 15, alerts: 267 },
  { day: 'Thu', incidents: 10, alerts: 223 },
  { day: 'Fri', incidents: 18, alerts: 312 },
  { day: 'Sat', incidents: 6, alerts: 156 },
  { day: 'Sun', incidents: 4, alerts: 134 },
];

export const AuthorityDashboard = () => {
  const analytics = useMemo(() => generateAnalytics(), []);
  const weather = getSimulatedWeather();
  const traffic = getSimulatedTraffic();
  const hour = new Date().getHours();

  // Calculate overall stats
  const totalAlerts = analytics.reduce((sum, z) => sum + z.alertCount, 0);
  const avgRisk = Math.round(analytics.reduce((sum, z) => sum + z.averageRiskScore, 0) / analytics.length);
  const totalIncidents = analytics.reduce((sum, z) => sum + z.incidentCount, 0);

  // Risk distribution for pie chart
  const riskDistribution = [
    { name: 'Critical', value: microZones.filter(z => z.baseRiskScore >= 70).length, color: 'hsl(var(--critical))' },
    { name: 'High', value: microZones.filter(z => z.baseRiskScore >= 55 && z.baseRiskScore < 70).length, color: 'hsl(var(--danger))' },
    { name: 'Moderate', value: microZones.filter(z => z.baseRiskScore >= 40 && z.baseRiskScore < 55).length, color: 'hsl(var(--warning))' },
    { name: 'Low', value: microZones.filter(z => z.baseRiskScore < 40).length, color: 'hsl(var(--safe))' },
  ];

  const sortedZones = [...analytics].sort((a, b) => b.averageRiskScore - a.averageRiskScore);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Authority Dashboard</h1>
        <p className="text-muted-foreground">Real-time road risk monitoring and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts Today</p>
              <p className="text-2xl font-bold text-foreground">{totalAlerts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              <p className="text-2xl font-bold text-foreground">{avgRisk}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
              <Zap className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incidents This Week</p>
              <p className="text-2xl font-bold text-foreground">{totalIncidents}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safe/10">
              <MapPin className="h-6 w-6 text-safe" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Zones</p>
              <p className="text-2xl font-bold text-foreground">{microZones.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Alert Distribution */}
        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-foreground">Hourly Alert Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                  interval={2}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="alerts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="card-elevated p-6">
          <h3 className="mb-4 font-semibold text-foreground">Zone Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-foreground">Weekly Incident Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="hsl(var(--danger))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--danger))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="alerts" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--warning))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Conditions */}
        <div className="card-elevated p-6">
          <h3 className="mb-4 font-semibold text-foreground">Current Conditions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                {hour >= 6 && hour < 20 ? (
                  <Sun className="h-5 w-5 text-warning" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm text-foreground">Time of Day</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {hour >= 6 && hour < 20 ? 'Daytime' : 'Nighttime'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-foreground">Weather</span>
              </div>
              <span className="text-sm font-medium capitalize text-muted-foreground">
                {weather.condition}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-safe" />
                <span className="text-sm text-foreground">Road Surface</span>
              </div>
              <span className="text-sm font-medium capitalize text-muted-foreground">
                {weather.roadCondition}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground">Traffic Level</span>
              </div>
              <span className="text-sm font-medium capitalize text-muted-foreground">
                {traffic.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Zones Table */}
      <div className="mt-6 card-elevated p-6">
        <h3 className="mb-4 font-semibold text-foreground">High Priority Zones</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Zone</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Risk Score</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Alerts</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Incidents</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedZones.slice(0, 5).map((zone) => {
                const microZone = microZones.find(z => z.id === zone.zoneId);
                const riskLevel = zone.averageRiskScore >= 70 ? 'critical' : 
                                  zone.averageRiskScore >= 55 ? 'high' : 
                                  zone.averageRiskScore >= 40 ? 'moderate' : 'low';
                
                return (
                  <tr key={zone.zoneId} className="border-b border-border/50">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-foreground">{zone.zoneName}</p>
                        <p className="text-xs text-muted-foreground">
                          {microZone?.features.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <RiskBadge level={riskLevel as any} score={zone.averageRiskScore} showScore />
                    </td>
                    <td className="py-4 text-foreground">{zone.alertCount}</td>
                    <td className="py-4 text-foreground">{zone.incidentCount}</td>
                    <td className="py-4">
                      <span className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        zone.incidentCount > 10 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                      )}>
                        {zone.incidentCount > 10 ? 'Needs Attention' : 'Monitoring'}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {zone.averageRiskScore >= 70 ? 'Add lighting & signage' :
                       zone.averageRiskScore >= 55 ? 'Review speed limits' :
                       'Continue monitoring'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

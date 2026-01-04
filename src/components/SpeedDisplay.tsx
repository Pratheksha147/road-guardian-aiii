import { cn } from '@/lib/utils';

interface SpeedDisplayProps {
  speed: number;
  unit?: 'mph' | 'kmh';
}

export const SpeedDisplay = ({ speed, unit = 'mph' }: SpeedDisplayProps) => {
  const displaySpeed = unit === 'kmh' ? Math.round(speed * 1.60934) : Math.round(speed);
  
  const speedColor = speed > 55 ? 'text-danger' : speed > 40 ? 'text-warning' : 'text-foreground';
  
  return (
    <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-4">
      <span className={cn('font-mono text-5xl font-bold tracking-tight', speedColor)}>
        {displaySpeed}
      </span>
      <span className="text-sm uppercase tracking-wider text-muted-foreground">
        {unit}
      </span>
    </div>
  );
};

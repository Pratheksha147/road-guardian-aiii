import { RiskLevel } from '@/types/safezone';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  animated?: boolean;
}

const levelConfig: Record<RiskLevel, { variant: 'safe' | 'secondary' | 'warning' | 'danger' | 'critical'; label: string }> = {
  safe: { variant: 'safe', label: 'Safe' },
  low: { variant: 'secondary', label: 'Low Risk' },
  moderate: { variant: 'warning', label: 'Moderate' },
  high: { variant: 'danger', label: 'High Risk' },
  critical: { variant: 'critical', label: 'Critical' },
};

export const RiskBadge = ({ 
  level, 
  score, 
  size = 'md', 
  showScore = false,
  animated = false 
}: RiskBadgeProps) => {
  const config = levelConfig[level];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        sizeClasses[size],
        animated && level !== 'safe' && level !== 'low' && 'animate-pulse-slower',
        'font-semibold tracking-wide'
      )}
    >
      {showScore && score !== undefined ? `${score}` : config.label}
    </Badge>
  );
};

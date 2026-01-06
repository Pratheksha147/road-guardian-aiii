import { RiskLevel } from '@/types/safezone';
import { cn } from '@/lib/utils';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskMeter = ({ score, level, size = 'md' }: RiskMeterProps) => {
  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-44 w-44',
  };

  const fontSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  const getColor = () => {
    if (score < 20) return 'hsl(var(--safe))';
    if (score < 40) return 'hsl(var(--muted-foreground))';
    if (score < 60) return 'hsl(var(--warning))';
    if (score < 80) return 'hsl(var(--danger))';
    return 'hsl(var(--critical))';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('relative', sizeClasses[size])}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={cn(
            'font-mono font-bold transition-all duration-1000', 
            fontSizes[size]
          )} 
          style={{ color: getColor() }}
        >
          {score}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {level}
        </span>
      </div>
    </div>
  );
};

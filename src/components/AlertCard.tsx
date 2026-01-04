import { Alert } from '@/types/safezone';
import { RiskBadge } from './RiskBadge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Navigation, X, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: Alert;
  onDismiss: () => void;
  isActive?: boolean;
}

const levelColors = {
  safe: 'border-safe/30 bg-safe/10',
  low: 'border-secondary bg-secondary/10',
  moderate: 'border-warning/30 bg-warning/10',
  high: 'border-danger/30 bg-danger/10',
  critical: 'border-critical/50 bg-critical/10',
};

export const AlertCard = ({ alert, onDismiss, isActive = false }: AlertCardProps) => {
  const { riskScore, zoneName, distance, estimatedArrival } = alert;
  
  return (
    <div 
      className={cn(
        'rounded-xl border-2 p-4 transition-all duration-300',
        levelColors[riskScore.level],
        isActive && 'animate-slide-up',
        riskScore.level === 'critical' && 'animate-alert'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            riskScore.level === 'critical' ? 'bg-critical' : 
            riskScore.level === 'high' ? 'bg-danger' : 
            riskScore.level === 'moderate' ? 'bg-warning' : 'bg-secondary'
          )}>
            <AlertTriangle className={cn(
              'h-6 w-6',
              riskScore.level === 'critical' || riskScore.level === 'high' 
                ? 'text-danger-foreground' 
                : riskScore.level === 'moderate' 
                  ? 'text-warning-foreground' 
                  : 'text-secondary-foreground'
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{zoneName}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {Math.round(distance)}m ahead
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {estimatedArrival}s
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <RiskBadge level={riskScore.level} score={riskScore.score} showScore size="lg" />
          <Button variant="ghost" size="icon" onClick={onDismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          {riskScore.explanation}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {riskScore.factors.slice(0, 3).map((factor, i) => (
            <span 
              key={i}
              className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground"
            >
              {factor.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
          <Navigation className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">
            {riskScore.suggestedAction}
          </p>
        </div>
      </div>
    </div>
  );
};

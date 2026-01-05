import { Alert } from '@/types/safezone';
import { AIReasoning } from '@/hooks/useAIReasoning';
import { RiskBadge } from './RiskBadge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Navigation, X, Clock, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAlertCardProps {
  alert: Alert;
  aiReasoning: AIReasoning | null;
  isLoadingAI: boolean;
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

const alertLevelColors = {
  CAUTION: 'bg-warning text-warning-foreground',
  WARNING: 'bg-danger text-danger-foreground',
  DANGER: 'bg-critical text-critical-foreground',
};

export const AIAlertCard = ({ 
  alert, 
  aiReasoning, 
  isLoadingAI, 
  onDismiss, 
  isActive = false 
}: AIAlertCardProps) => {
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{zoneName}</h3>
              {aiReasoning && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                  alertLevelColors[aiReasoning.alertLevel]
                )}>
                  {aiReasoning.alertLevel}
                </span>
              )}
            </div>
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
        {/* AI-Enhanced Explanation */}
        {isLoadingAI ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing zone conditions...</span>
          </div>
        ) : aiReasoning ? (
          <>
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-medium text-foreground">
                {aiReasoning.explanation}
              </p>
            </div>
            
            {/* Primary Risk */}
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Primary Risk: </span>
              <span className="text-sm font-semibold text-foreground">{aiReasoning.primaryRisk}</span>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Recommendations:</p>
              <ul className="space-y-1">
                {aiReasoning.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Safe Speed Recommendation */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
              <Navigation className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">
                Recommended speed: {aiReasoning.safeSpeed}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              {riskScore.explanation}
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
              <Navigation className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">
                {riskScore.suggestedAction}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

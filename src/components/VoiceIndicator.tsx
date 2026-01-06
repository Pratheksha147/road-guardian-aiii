import { cn } from '@/lib/utils';
import { Mic, Volume2 } from 'lucide-react';

interface VoiceIndicatorProps {
  isSpeaking: boolean;
  showPulse?: boolean;
}

export const VoiceIndicator = ({ isSpeaking, showPulse }: VoiceIndicatorProps) => {
  return (
    <div className={cn(
      'glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300',
      isSpeaking && 'ring-2 ring-primary/50',
      showPulse && 'ring-4 ring-warning/70 bg-warning/20'
    )}>
      {/* Pulse ring animation when voice alert triggers */}
      {showPulse && (
        <span className="absolute inset-0 rounded-full animate-ping bg-warning/30" />
      )}
      
      <div className="relative">
        {showPulse ? (
          <Volume2 className="h-4 w-4 text-warning animate-bounce" />
        ) : (
          <Mic className={cn(
            'h-4 w-4 transition-colors',
            isSpeaking ? 'text-primary' : 'text-muted-foreground'
          )} />
        )}
        {isSpeaking && !showPulse && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </div>
      <span className={cn(
        'text-xs font-medium',
        showPulse ? 'text-warning font-bold' : isSpeaking ? 'text-primary' : 'text-muted-foreground'
      )}>
        {showPulse ? 'Alert!' : isSpeaking ? 'Speaking...' : 'Voice Ready'}
      </span>
      
      {/* Sound wave animation when speaking */}
      {(isSpeaking || showPulse) && (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full",
                showPulse ? "bg-warning animate-bounce" : "bg-primary animate-pulse"
              )}
              style={{
                height: `${8 + i * 3}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: showPulse ? '0.3s' : '0.5s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

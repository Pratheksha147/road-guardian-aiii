import { cn } from '@/lib/utils';
import { Mic, MicOff } from 'lucide-react';

interface VoiceIndicatorProps {
  isSpeaking: boolean;
}

export const VoiceIndicator = ({ isSpeaking }: VoiceIndicatorProps) => {
  return (
    <div className={cn(
      'glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300',
      isSpeaking && 'ring-2 ring-primary/50'
    )}>
      <div className="relative">
        <Mic className={cn(
          'h-4 w-4 transition-colors',
          isSpeaking ? 'text-primary' : 'text-muted-foreground'
        )} />
        {isSpeaking && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </div>
      <span className={cn(
        'text-xs font-medium',
        isSpeaking ? 'text-primary' : 'text-muted-foreground'
      )}>
        {isSpeaking ? 'Speaking...' : 'Voice Ready'}
      </span>
      
      {/* Sound wave animation when speaking */}
      {isSpeaking && (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-0.5 bg-primary rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 8}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.5s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

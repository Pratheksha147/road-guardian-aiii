import { cn } from '@/lib/utils';
import { Wifi, WifiOff, MapPin, MapPinOff } from 'lucide-react';

interface StatusIndicatorProps {
  isTracking: boolean;
  isConnected?: boolean;
}

export const StatusIndicator = ({ isTracking, isConnected = true }: StatusIndicatorProps) => {
  return (
    <div className="glass-panel flex items-center gap-4 rounded-full px-4 py-2">
      <div className="flex items-center gap-2">
        {isTracking ? (
          <>
            <div className="relative">
              <MapPin className="h-4 w-4 text-safe" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-safe animate-ping" />
            </div>
            <span className="text-sm text-safe">GPS Active</span>
          </>
        ) : (
          <>
            <MapPinOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">GPS Off</span>
          </>
        )}
      </div>
      
      <div className="h-4 w-px bg-border" />
      
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-safe" />
            <span className="text-sm text-safe">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-danger" />
            <span className="text-sm text-danger">Offline</span>
          </>
        )}
      </div>
    </div>
  );
};

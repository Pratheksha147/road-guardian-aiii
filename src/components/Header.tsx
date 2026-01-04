import { Shield, Map, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeView: 'driver' | 'dashboard';
  onViewChange: (view: 'driver' | 'dashboard') => void;
}

export const Header = ({ activeView, onViewChange }: HeaderProps) => {
  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">SafeZone</h1>
            <p className="text-xs text-muted-foreground">Road Risk Prevention</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button
            variant={activeView === 'driver' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('driver')}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            Driver View
          </Button>
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('dashboard')}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Authority Dashboard
          </Button>
        </nav>
      </div>
    </header>
  );
};

import { useState } from 'react';
import { Header } from '@/components/Header';
import { DriverView } from '@/components/DriverView';
import { AuthorityDashboard } from '@/components/AuthorityDashboard';

const Index = () => {
  const [activeView, setActiveView] = useState<'driver' | 'dashboard'>('driver');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1">
        {activeView === 'driver' ? (
          <DriverView />
        ) : (
          <AuthorityDashboard />
        )}
      </main>
    </div>
  );
};

export default Index;

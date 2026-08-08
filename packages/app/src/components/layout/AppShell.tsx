import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { ensureDatabaseSeeded } from '../../db/seed';
import { Loader2 } from 'lucide-react';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const isPracticePage = location.pathname.startsWith('/practice');

  useEffect(() => {
    ensureDatabaseSeeded().then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="app-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-cyan)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 500 }}>Initializing HanZi XingZuo...</div>
          <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>Loading Top 1000 Chinese Characters</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <main className={`main-content ${isPracticePage ? 'no-scroll' : ''}`}>
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
};

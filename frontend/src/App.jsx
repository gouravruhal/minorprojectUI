import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './core/theme/ThemeContext';
import { Navbar } from './components/navigation/Navbar';
import { AppRouterView } from './components/navigation/AppRouterView';
import { TAB_ROUTES, ROUTE_TO_TAB, getInitialTab } from './core/navigation/appNavigationRoutes';
import './App.css';

function MainApp() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    const targetPath = TAB_ROUTES[activeTab] || '/';
    const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    
    if (currentPath !== targetPath) {
      window.history.replaceState({ tab: activeTab }, '', targetPath);
    }
    try {
      localStorage.setItem('voiceshield_active_tab', activeTab);
    } catch {}

    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const matchedTab = ROUTE_TO_TAB[path];
      if (matchedTab && matchedTab !== activeTab) {
        setActiveTab(matchedTab);
        try {
          localStorage.setItem('voiceshield_active_tab', matchedTab);
        } catch {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleSelectTab = (tab) => {
    if (tab === activeTab) return;
    setIsNavigating(true);

    setActiveTab(tab);
    setNavKey((k) => k + 1);

    const targetPath = TAB_ROUTES[tab] || '/';
    window.history.pushState({ tab }, '', targetPath);

    try {
      localStorage.setItem('voiceshield_active_tab', tab);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' });

    setTimeout(() => {
      setIsNavigating(false);
    }, 440);
  };

  return (
    <div className="app-shell" id="voiceshield-app-shell">
      {isNavigating && (
        <div className="top-laser-progress-bar" key={navKey}>
          <div className="laser-fill" />
          <div className="laser-glow-spark" />
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      <main className="app-content-area">
        <AppRouterView
          activeTab={activeTab}
          onNavigateTab={handleSelectTab}
        />
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../core/theme/ThemeContext';
import './Navbar.css';

export function Navbar({ activeTab, onSelectTab, _isStreaming }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar-fixed-wrapper">
      <nav className="site-navbar cylindrical-dock" id="site-primary-navbar">
        <div className="navbar-left">
          <div className="navbar-brand" onClick={() => onSelectTab('overview')}>
            <span className="brand-name">VoiceShield AI</span>
          </div>
        </div>

        <div className="navbar-center-tabs">
          <button
            id="nav-tab-overview"
            className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectTab('overview')}
          >
            <span>Team Overview</span>
          </button>
          <span className="nav-divider">|</span>
          <button
            id="nav-tab-voice"
            className={`nav-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => onSelectTab('voice')}
          >
            <span>Recording Analysis</span>
          </button>
          <span className="nav-divider">|</span>
          <button
            id="nav-tab-mic"
            className={`nav-tab-btn ${activeTab === 'mic-analysis' ? 'active' : ''}`}
            onClick={() => onSelectTab('mic-analysis')}
          >
            <span>Microphone Analysis</span>
          </button>
          <span className="nav-divider">|</span>
          <button
            id="nav-tab-telephony"
            className={`nav-tab-btn ${activeTab === 'telephony' ? 'active' : ''}`}
            onClick={() => onSelectTab('telephony')}
          >
            <span>Hardware Call Capture</span>
          </button>
          <span className="nav-divider">|</span>
          <button
            id="nav-tab-history"
            className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => onSelectTab('history')}
          >
            <span>History & Logs</span>
          </button>
        </div>

        <div className="navbar-right">
          <button
            id="theme-toggle-btn"
            className="theme-toggle-btn cylindrical-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

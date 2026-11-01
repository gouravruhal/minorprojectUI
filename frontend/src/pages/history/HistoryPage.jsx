import React, { useState, useEffect } from 'react';
import { History, LayoutList, Grid, Search, RefreshCw, Trash2 } from 'lucide-react';
import { getRecentAnalyses, clearDatabase } from '../../core/api/voiceAnalysisApi';
import { HistoryListView } from './features/HistoryListView';
import { HistoryTileView } from './features/HistoryTileView';
import { HistoryDetailModal } from './features/HistoryDetailModal';
import './HistoryPage.css';

export function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const dbRecent = await getRecentAnalyses(50);
      setRecords(Array.isArray(dbRecent) ? dbRecent : []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Wipe all records from the SQLite database for a fresh test cycle?')) return;
    setIsLoading(true);
    try {
      await clearDatabase();
      try { localStorage.removeItem('voiceshield_context_recordings'); } catch {}
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = records.filter((rec) => {
    const fn = (rec.filename || rec.title || '').toLowerCase();
    const clr = (rec.callerName || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || fn.includes(q) || clr.includes(q);

    const tier = (rec.threatTier || rec.label || 'LOW').toUpperCase();
    const matchesTier =
      filterTier === 'ALL' ||
      (filterTier === 'CRITICAL' && tier.includes('CRITICAL')) ||
      (filterTier === 'ELEVATED' && tier.includes('ELEVATED')) ||
      (filterTier === 'LOW' && (tier.includes('LOW') || tier.includes('GUARDED')));

    return matchesSearch && matchesTier;
  });

  return (
    <div className="history-view animate-fade-in" id="history-logs-page">
      <header className="history-page-header card clay-card">
        <div className="history-header-left">
          <div className="header-badge-row">
            <span className="badge badge-accent flex-center gap-1">
              <History size={12} />
              <span>FORENSIC AUDIT TRAIL</span>
            </span>
            <span className="badge badge-neutral">SQLite Database Persistence</span>
            <span className="badge badge-safe">{records.length} Analyzed Records</span>
          </div>
          <h2 className="history-title">Forensic History & Audit Logs</h2>
          <p className="history-subtitle">
            Directly connected to the backend SQLite database (`voice_analyses` table). View past file forensic reports and live microphone evaluations.
          </p>
        </div>

        <div className="history-header-actions">
          <div className="view-toggle-bubble clay-inset">
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'tile' ? 'active' : ''}`}
              onClick={() => setViewMode('tile')}
              title="Tile Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
          <button
            type="button"
            className="btn-clay-secondary"
            onClick={loadHistory}
            title="Refresh database records"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-clay-danger"
            onClick={handleClearDatabase}
            title="Clear all database records"
          >
            <Trash2 size={14} />
            <span>Clear DB</span>
          </button>
        </div>
      </header>

      <div className="history-filters-bar card clay-card">
        <div className="search-input-box clay-inset">
          <Search size={15} className="text-dim" />
          <input
            type="text"
            className="history-search-field"
            placeholder="Search by filename or caller identity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tier-filter-pills">
          {['ALL', 'CRITICAL', 'ELEVATED', 'LOW'].map((t) => (
            <button
              key={t}
              type="button"
              className={`filter-pill ${filterTier === t ? 'active' : ''}`}
              onClick={() => setFilterTier(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="history-content-area">
        {viewMode === 'list' ? (
          <HistoryListView
            records={filtered}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
          />
        ) : (
          <HistoryTileView
            records={filtered}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
          />
        )}
      </div>

      <HistoryDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

export default HistoryPage;

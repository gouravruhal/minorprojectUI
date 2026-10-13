import React from 'react';
import { ForensicAnalysisLogs } from './ForensicAnalysisLogs';
import { AcousticAnomaliesList } from './AcousticAnomaliesList';

export function InspectionTelemetrySplit({
  logs,
  logFilter,
  onFilterChange,
  copiedLogs,
  onCopyLogs,
  logsContainerRef,
  isDisplaySynthetic,
  isStreaming,
  liveJitter,
  liveShimmer,
  liveLiveness,
  spectralCentroid
}) {
  return (
    <div className="console-split-grid">
      <ForensicAnalysisLogs
        logs={logs}
        logFilter={logFilter}
        onFilterChange={onFilterChange}
        copiedLogs={copiedLogs}
        onCopyLogs={onCopyLogs}
        logsContainerRef={logsContainerRef}
      />
      <AcousticAnomaliesList
        isDisplaySynthetic={isDisplaySynthetic}
        isStreaming={isStreaming}
        liveJitter={liveJitter}
        liveShimmer={liveShimmer}
        liveLiveness={liveLiveness}
        spectralCentroid={spectralCentroid}
      />
    </div>
  );
}

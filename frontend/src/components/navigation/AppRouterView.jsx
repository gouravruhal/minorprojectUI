import React from 'react';
import { OverviewPage } from '../../pages/overview/OverviewPage';
import { VoiceAnalysisPage } from '../../pages/voice_analysis/VoiceAnalysisPage';
import { MicrophoneAnalysisPage } from '../../pages/microphone_analysis/MicrophoneAnalysisPage';
import { TelephonyLinkPage } from '../../pages/telephony_link/TelephonyLinkPage';
import { HistoryPage } from '../../pages/history/HistoryPage';
import { DeveloperSdkPage } from '../../pages/developer_sdk/DeveloperSdkPage';

export function AppRouterView({ activeTab, onNavigateTab }) {
  return (
    <div key={activeTab} className="page-transition-wrapper">
      {activeTab === 'overview' && (
        <OverviewPage
          onLaunchConsole={() => onNavigateTab('voice')}
          onLaunchPipeline={() => onNavigateTab('mic-analysis')}
        />
      )}

      {activeTab === 'voice' && <VoiceAnalysisPage />}

      {activeTab === 'mic-analysis' && <MicrophoneAnalysisPage />}

      {activeTab === 'telephony' && <TelephonyLinkPage />}

      {activeTab === 'history' && <HistoryPage />}

      {activeTab === 'developer-sdk' && <DeveloperSdkPage />}
    </div>
  );
}

export default AppRouterView;

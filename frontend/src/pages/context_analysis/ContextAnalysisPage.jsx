import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { ContextAnalysisHeader } from './features/ContextAnalysisHeader';
import { RecordingContextSelector } from './features/RecordingContextSelector';
import { LiveTranscriptStreamer } from './features/LiveTranscriptStreamer';
import { LinguisticThreatTelemetry } from './features/LinguisticThreatTelemetry';
import { MultiModalFusionBreakdown } from './features/MultiModalFusionBreakdown';
import { InterventionControlBar } from './features/InterventionControlBar';
import { ForensicLLMReasoningCard } from './features/ForensicLLMReasoningCard';
import {
  getSavedRecordings,
  getSelectedRecordingId,
  setSelectedRecordingId,
  calculateUnifiedBayesianRisk
} from '../../core/state/contextAnalysisStore';
import { getRecentAnalyses, generateContextForRecording } from '../../core/api/voiceAnalysisApi';
import './ContextAnalysisPage.css';

export function ContextAnalysisPage({
  isStreaming = false,
  isFrozen = false,
  onTriggerFreeze,
  onTriggerMfa
}) {
  const [recordings, setRecordings] = useState(getSavedRecordings);
  const [selectedId, setSelectedId] = useState(getSelectedRecordingId);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Sync with backend recent analyses on mount
  useEffect(() => {
    let isMounted = true;
    getRecentAnalyses(10).then((recent) => {
      if (!isMounted || !Array.isArray(recent) || recent.length === 0) return;
      setRecordings((prev) => {
        const idSet = new Set(prev.map((r) => r.filename));
        const newOnes = [];
        for (const item of recent) {
          if (!idSet.has(item.filename)) {
            const risk = Number(item.synthetic_probability ?? 25);
            newOnes.push({
              id: item.analysis_id || `rec-${item.id}`,
              contextId: `CTX-${(item.analysis_id || item.filename).substring(0, 10).toUpperCase()}`,
              filename: item.filename,
              title: item.filename,
              callerName: risk >= 50 ? 'Caller (Spoof Suspect)' : 'Caller (Verified Phonation)',
              network: 'VoIP Gateway Ingress',
              duration: `${item.duration_seconds || 4.0}s`,
              acousticRiskScore: risk,
              threatTier: item.label || (risk >= 70 ? 'CRITICAL' : risk >= 50 ? 'ELEVATED' : 'LOW'),
              isSynthetic: Boolean(item.is_synthetic || risk >= 50),
              voiceSwapDetected: false,
              transcript: risk >= 50
                ? 'Hello, calling from IT Security. We detected an unauthorized login. Read out your one-time token immediately.'
                : 'Hello, my name is Gourav, and this is human voice. I am confirming regular account verification.',
              keywords: risk >= 50 ? ['IT Security', 'Read out token', 'Immediately'] : ['Regular verification'],
              linguisticScore: risk >= 50 ? 88 : 8,
              urgencyIndex: risk >= 50 ? 92 : 6,
              intentCategory: risk >= 50 ? 'Credential Harvesting & Vishing' : 'Benign Verification',
              actionRecommendation: risk >= 50 ? 'TRIGGER_MFA_CHALLENGE' : 'CONTINUE_MONITORING',
              llmModel: 'ForensicLLMReasoner-v2-NLU',
              llmReasoningSummary: `**Forensic Risk Summary [${item.label || (risk >= 50 ? 'CRITICAL' : 'LOW')}]:** Unified risk assessed at ${risk}%.\n\n• **Linguistic Intent:** ${risk >= 50 ? 'Credential Harvesting' : 'Benign Verification'}.\n• **Action Protocol:** ${risk >= 50 ? 'TRIGGER_MFA_CHALLENGE' : 'CONTINUE_MONITORING'}.`,
              source: 'Backend Database Ingress'
            });
          }
        }
        return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
      });
    });
    return () => { isMounted = false; };
  }, []);

  const currentRec = recordings.find((r) => r.id === selectedId) || recordings[0] || {};

  const handleSelectRecording = useCallback((id) => {
    setSelectedId(id);
    setSelectedRecordingId(id);
  }, []);

  const handleRegenerateContext = useCallback(async () => {
    if (!currentRec) return;
    setIsRegenerating(true);
    try {
      const generated = await generateContextForRecording(currentRec);
      if (generated) {
        setRecordings((prev) =>
          prev.map((r) =>
            r.id === currentRec.id
              ? {
                  ...r,
                  transcript: generated.transcript || r.transcript,
                  keywords: generated.keywords || r.keywords,
                  linguisticScore: generated.linguistic_score ?? r.linguisticScore,
                  urgencyIndex: generated.urgency_index ?? r.urgencyIndex,
                  intentCategory: generated.intent_category || r.intentCategory,
                  contextId: generated.context_id || r.contextId,
                  llmReasoningSummary: generated.llm_reasoning_summary || r.llmReasoningSummary,
                  actionRecommendation: generated.recommended_action || r.actionRecommendation,
                  llmModel: generated.llm_model || r.llmModel
                }
              : r
          )
        );
      }
    } finally {
      setTimeout(() => setIsRegenerating(false), 300);
    }
  }, [currentRec]);

  const unifiedRisk = calculateUnifiedBayesianRisk(
    currentRec.acousticRiskScore || 10,
    currentRec.linguisticScore || 10,
    currentRec.urgencyIndex || 10,
    currentRec.voiceSwapDetected || false
  );

  const isCritical = unifiedRisk >= 70 || currentRec.voiceSwapDetected;

  return (
    <div className="context-analysis-view animate-fade-in" id="context-analysis-page">
      <ContextAnalysisHeader
        isCritical={isCritical}
        recordingCount={recordings.length}
      />

      <RecordingContextSelector
        recordings={recordings}
        selectedId={selectedId}
        onSelectRecording={handleSelectRecording}
        onRegenerateContext={handleRegenerateContext}
        isRegenerating={isRegenerating}
      />

      <div className="context-main-grid">
        <LiveTranscriptStreamer
          recording={currentRec}
          isStreaming={isStreaming}
          isRegenerating={isRegenerating}
        />

        <section className="nlp-telemetry-panel card clay-card">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <Zap size={18} className="text-accent" />
              <h3 className="panel-heading">Linguistic Threat Telemetry</h3>
            </div>
            <span className="badge badge-neutral">RoBERTa-Fraud-v4 / Local NLP</span>
          </div>

          <LinguisticThreatTelemetry
            linguisticScore={currentRec.linguisticScore || 8}
            urgencyIndex={currentRec.urgencyIndex || 6}
            intentCategory={currentRec.intentCategory || 'Benign Conversation'}
            isCritical={isCritical}
          />

          <MultiModalFusionBreakdown
            acousticRisk={currentRec.acousticRiskScore || 8.2}
            linguisticScore={currentRec.linguisticScore || 8}
            urgencyIndex={currentRec.urgencyIndex || 6}
            voiceSwapDetected={currentRec.voiceSwapDetected || false}
            unifiedRiskScore={unifiedRisk}
            isCritical={isCritical}
          />

          <InterventionControlBar
            isFrozen={isFrozen}
            onTriggerFreeze={onTriggerFreeze}
            onTriggerMfa={onTriggerMfa}
          />
        </section>
      </div>

      <ForensicLLMReasoningCard
        contextId={currentRec.contextId || currentRec.id}
        llmModel={currentRec.llmModel}
        llmReasoningSummary={currentRec.llmReasoningSummary}
        actionRecommendation={currentRec.actionRecommendation}
        isCritical={isCritical}
      />
    </div>
  );
}

export default ContextAnalysisPage;

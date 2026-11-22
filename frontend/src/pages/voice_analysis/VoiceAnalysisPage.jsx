import React, { useRef, useEffect } from 'react';
import { useFileUploadAnalysis } from './features/useFileUploadAnalysis';
import { AudioForensicIngress } from './features/AudioForensicIngress';
import { AggregatedVerdictBanner } from './features/AggregatedVerdictBanner';
import { MultiBlockTimeline } from './features/MultiBlockTimeline';
import { ForensicPipelineTracker } from './features/ForensicPipelineTracker';
import { ForensicComparisonGraph } from './features/ForensicComparisonGraph';
import { ForensicLLMTimelineLogs } from './features/ForensicLLMTimelineLogs';
import { SpeechTranscriptPanel } from '../../components/voice/SpeechTranscriptPanel';
import './features/ForensicAnalysisView.css';
import './VoiceAnalysisPage.css';

export function VoiceAnalysisPage() {
  const {
    uploadedFile,
    customFileResult,
    uploadProgress,
    isUploading,
    analysisStage,
    chunkState,
    fileError,
    handleFileUpload,
    handleClearFile
  } = useFileUploadAnalysis();

  const resultsRef = useRef(null);

  useEffect(() => {
    if (isUploading || customFileResult) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isUploading, customFileResult]);

  return (
    <div className="voice-analysis-console forensics-container">
      {/* 1. Header Hero */}
      <div className="forensics-hero-strip animate-fade-in">
        <div>
          <h2 className="forensics-hero-title">
            <span>Recording Analysis: Acoustic Deepfake Inspector</span>
          </h2>
          <p className="forensics-hero-desc">
            Multi-segment sliding window acoustics, biometrics drift tracking, and hybrid peak-mean synthetic speech detection.
          </p>
        </div>
      </div>

      {/* 2. File Upload Ingress */}
      <AudioForensicIngress
        uploadedFile={uploadedFile}
        onFileSelect={(file) => handleFileUpload(file)}
        onAnalyze={() => handleFileUpload(uploadedFile)}
        onClear={handleClearFile}
        isAnalyzing={isUploading}
        fileError={fileError}
      />

      {/* 4. Multi-Process Execution Tracker & Results with Smooth Scroll Anchor */}
      <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollMarginTop: '20px' }}>
        {isUploading && (
          <ForensicPipelineTracker
            stage={analysisStage}
            progress={uploadProgress}
            chunkState={chunkState}
          />
        )}

        {customFileResult && !isUploading && (
          <>
            <AggregatedVerdictBanner result={customFileResult} />

            <SpeechTranscriptPanel speechAnalysis={customFileResult.speech_text_analysis} />

            <MultiBlockTimeline
              segments={customFileResult.segments || []}
              peakSegment={customFileResult.peak_segment}
            />

            <ForensicComparisonGraph
              intervals={customFileResult.timeline_5s_intervals || []}
              comparisonMetrics={customFileResult.comparison_metrics || {}}
            />

            <ForensicLLMTimelineLogs
              llmExplanation={customFileResult.llm_risk_explanation}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceAnalysisPage;

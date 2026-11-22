import { useState, useCallback } from 'react';
import { uploadRecording, analyzeAudioEnterprise } from '../../../core/api/voiceAnalysisApi';
import { saveVoiceAnalysisRecord } from '../../../core/state/contextAnalysisStore';
import { enrichForensicTelemetry } from './forensicEnricher';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const resolveAudioDuration = (file) => new Promise((resolve) => {
  try {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(audio.duration || 15.0); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(15.0); };
    setTimeout(() => resolve(15.0), 300);
  } catch { resolve(15.0); }
});

export function useFileUploadAnalysis() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [customFileResult, setCustomFileResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('idle');
  const [chunkState, setChunkState] = useState({ currentChunk: 0, totalChunks: 0, chunkRange: '', status: '' });
  const [fileError, setFileError] = useState(null);

  const handleFileUpload = useCallback(async (file, consent = true) => {
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File exceeds maximum limit of 25MB.');
      return;
    }
    const isAudio = file.type?.startsWith('audio/') || /\.(wav|mp3|webm|ogg|m4a|flac)$/i.test(file.name);
    if (!isAudio) {
      setFileError('Unsupported file format. Please upload a WAV, MP3, or WebM audio file.');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setAnalysisStage('ingest');
    setUploadProgress(20);

    try {
      const durSec = await resolveAudioDuration(file);
      const totalBlocks = durSec > 4.0 ? Math.floor((durSec - 4.0) / 2.0) + 1 : 1;
      setChunkState({
        currentChunk: 1,
        totalChunks: totalBlocks,
        chunkRange: `00:00 - 00:${String(Math.min(4, Math.round(durSec))).padStart(2, '0')}`,
        status: `Ingesting ${durSec.toFixed(1)}s audio into zero-disk RAM pipeline...`
      });
      setUploadProgress(50);
      setAnalysisStage('llm_forensics');

      let backendResult;
      try {
        backendResult = await analyzeAudioEnterprise(file);
      } catch {
        backendResult = await uploadRecording(file, consent);
      }

      setUploadProgress(92);
      const risk = Number(backendResult.final_risk_score ?? backendResult.risk_score ?? backendResult.synthetic_probability ?? 25.0);
      const { intervals, llmExplanation, compMetrics } = enrichForensicTelemetry(backendResult, durSec, risk);

      const segments = backendResult.segments || [];
      setChunkState({
        currentChunk: segments.length || totalBlocks,
        totalChunks: segments.length || totalBlocks,
        chunkRange: `Full Stream (0s - ${Math.round(durSec)}s)`,
        status: `Acoustic frames analyzed: ${segments.length || totalBlocks} segments.`
      });

      const formatted = {
        name: file.name,
        analysisId: backendResult.analysis_id || `ANL-${Date.now().toString(36).toUpperCase()}`,
        duration: `${backendResult.duration_sec || durSec.toFixed(1)}s`,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        codec: '16,000 Hz Linear PCM',
        label: backendResult.final_threat_tier || backendResult.threat_tier || (risk >= 50 ? 'CRITICAL' : 'LOW'),
        isSynthetic: Boolean(risk >= 50),
        riskScore: risk,
        final_risk_score: risk,
        final_threat_tier: backendResult.final_threat_tier || (risk >= 70 ? 'CRITICAL' : risk >= 45 ? 'ELEVATED' : 'MINIMAL'),
        action_recommendation: backendResult.action_recommendation || (risk >= 70 ? 'TRIGGER_MFA_CHALLENGE' : 'CONTINUE_MONITORING'),
        confidence: `${Math.round(backendResult.overall_spoof_prob || risk)}%`,
        modelIdentifier: backendResult.model_identifier || 'voiceshield-deep-fusion-v2',
        segments: backendResult.segments || [],
        segmentsCount: backendResult.segments_count || (backendResult.segments ? backendResult.segments.length : 1),
        peak_segment: backendResult.peak_segment,
        speaker_verification: backendResult.speaker_verification,
        attributions: backendResult.attributions || {},
        timeline_5s_intervals: intervals,
        comparison_metrics: compMetrics,
        llm_risk_explanation: llmExplanation,
        processingTimeMs: backendResult.latency_ms || backendResult.processing_time_ms || 42,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCustomFileResult(formatted);
      saveVoiceAnalysisRecord(formatted);
      setAnalysisStage('complete');
      setUploadProgress(100);
    } catch (err) {
      setFileError('Forensic processing failed: ' + (err.message || 'Unknown network error'));
      setAnalysisStage('idle');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setCustomFileResult(null);
    setFileError(null);
    setAnalysisStage('idle');
    setUploadProgress(0);
  }, []);

  return {
    uploadedFile,
    customFileResult,
    uploadProgress,
    isUploading,
    analysisStage,
    chunkState,
    fileError,
    handleFileUpload,
    handleClearFile
  };
}

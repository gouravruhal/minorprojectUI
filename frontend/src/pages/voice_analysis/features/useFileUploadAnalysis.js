import { useState, useCallback } from 'react';
import { uploadRecording } from '../../../core/api/voiceAnalysisApi';
import { generateSampleFileResult, processUploadedAudioFile } from './voiceAnalysisHelpers';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function useFileUploadAnalysis() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [customFileResult, setCustomFileResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState(null);

  const handleFileUpload = useCallback(async (file, consent = true) => {
    if (!file) return;
    setFileError(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File exceeds maximum limit of 25MB. Please choose a smaller recording.');
      return;
    }

    // Validate type
    const isAudio = file.type?.startsWith('audio/') || /\.(wav|mp3|webm|ogg|m4a|flac)$/i.test(file.name);
    if (!isAudio) {
      setFileError('Unsupported file format. Please upload a WAV, MP3, or WebM audio file.');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      const backendResult = await uploadRecording(file, consent);
      setUploadProgress(100);

      const formattedResult = {
        name: file.name,
        duration: `${backendResult.metrics?.duration_seconds || '0.0'}s`,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        codec: `${backendResult.sample_rate || 16000}Hz PCM`,
        label: backendResult.label || 'Inconclusive',
        isSynthetic: Boolean(backendResult.is_synthetic),
        riskScore: backendResult.synthetic_probability || 50,
        confidence: backendResult.confidence ? `${Math.round(backendResult.confidence * 100)}%` : '50%',
        modelIdentifier: backendResult.model_identifier || 'voiceshield-acoustic-dsp-v1',
        disclaimer: backendResult.disclaimer,
        metrics: backendResult.metrics,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCustomFileResult(formattedResult);
    } catch {
      // Local fallback parsing if backend service is offline
      setUploadProgress(100);
      const fallbackResult = processUploadedAudioFile(file);
      fallbackResult.offlineNotice = 'Backend analysis offline; evaluated with local browser client heuristics.';
      setCustomFileResult(fallbackResult);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleLoadSampleFile = useCallback((type) => {
    setFileError(null);
    const { file, result } = generateSampleFileResult(type);
    setUploadedFile(file);
    setCustomFileResult(result);
  }, []);

  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setCustomFileResult(null);
    setUploadProgress(0);
    setFileError(null);
  }, []);

  return {
    uploadedFile,
    setUploadedFile,
    customFileResult,
    setCustomFileResult,
    uploadProgress,
    isUploading,
    fileError,
    handleFileUpload,
    handleLoadSampleFile,
    handleClearFile
  };
}

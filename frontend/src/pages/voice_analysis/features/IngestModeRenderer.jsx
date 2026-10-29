import React from 'react';
import { MicrophoneIngressPanel } from './MicrophoneIngressPanel';
import { CustomFileUploader } from './CustomFileUploader';
import { ConnectedSubscriberProfile } from './ConnectedSubscriberProfile';
import { ConnectionEstablishmentScreen } from './ConnectionEstablishmentScreen';
import { CarrierConnectionHero } from './CarrierConnectionHero';
import { formatCallTimer } from './voiceAnalysisHelpers';

export function IngestModeRenderer({
  state,
  activeCall,
  isStreaming,
  streamMode,
  onStartStream,
  onStopStream
}) {
  if (state.ingestMode === 'mic') {
    return (
      <MicrophoneIngressPanel
        isStreaming={isStreaming}
        streamMode={streamMode}
        onStartStream={onStartStream}
        onStopStream={onStopStream}
        liveResult={state.backendStream.liveResult}
        micVolume={state.recorder.audioVolume}
        elapsedSeconds={state.recorder.callSeconds}
        formatCallTimer={formatCallTimer}
      />
    );
  }

  if (state.ingestMode === 'upload') {
    return (
      <CustomFileUploader
        fileInputRef={state.fileInputRef}
        uploadedFile={state.fileAnalysis.uploadedFile}
        customFileResult={state.fileAnalysis.customFileResult}
        uploadProgress={state.fileAnalysis.uploadProgress}
        isUploading={state.fileAnalysis.isUploading}
        fileError={state.fileAnalysis.fileError}
        onFileChange={(e) => {
          const file = e.target.files?.[0];
          if (file) state.fileAnalysis.handleFileUpload(file, true);
        }}
        onLoadSampleFile={state.fileAnalysis.handleLoadSampleFile}
        isStreaming={isStreaming}
        onStartStream={() => onStartStream('file')}
        onStopStream={onStopStream}
        onClearFile={state.fileAnalysis.handleClearFile}
      />
    );
  }

  if (state.wirelessStatus === 'processing') {
    return (
      <ConnectionEstablishmentScreen
        enteredNumber={state.enteredNumber}
        enteredName={state.enteredName}
        network={activeCall?.network || 'VoLTE'}
        handshakeStep={state.handshakeStep}
        onCancel={() => state.setWirelessStatus('idle')}
      />
    );
  }

  if (state.wirelessStatus === 'connected') {
    const sourceLabel = state.telecomSource === 'twilio_provider'
      ? 'Twilio Media Stream'
      : state.telecomSource === 'audio_interface'
      ? 'External Audio Bridge'
      : 'Cellular Bridge (Speakerphone)';

    return (
      <ConnectedSubscriberProfile
        enteredNumber={state.enteredNumber}
        audioSourceLabel={sourceLabel}
        deviceCallDuration={state.recorder.callSeconds}
        formatCallTimer={formatCallTimer}
        audioVolume={state.recorder.audioVolume}
        isStreaming={isStreaming}
        onStartInspectionStream={() => onStartStream('simulation')}
        onStopInspection={onStopStream}
        onStopAndSaveCall={state.handleStopAndSaveCall}
        onDisconnectDevice={state.handleDisconnectDevice}
      />
    );
  }

  const connState = state.wirelessStatus === 'connected'
    ? 'connected'
    : state.wirelessStatus === 'processing'
    ? 'connecting'
    : !state.userConsent
    ? 'awaiting_consent'
    : 'disconnected';

  return (
    <CarrierConnectionHero
      connectionState={connState}
      selectedSource={state.telecomSource}
      onSelectSource={state.setTelecomSource}
      userConsent={state.userConsent}
      onToggleConsent={state.setUserConsent}
      selectedCountryCode={state.selectedCountryCode}
      onCountryCodeChange={state.handleCountryCodeChange}
      phoneNumberDigits={state.phoneNumberDigits}
      onPhoneNumberDigitsChange={state.handlePhoneNumberDigitsChange}
      audioDevices={state.recorder.audioDevices}
      selectedAudioDeviceId={state.recorder.selectedDeviceId}
      onSelectAudioDevice={state.recorder.setSelectedDeviceId}
      audioVolume={state.recorder.audioVolume}
      savedRecording={state.recorder.savedRecording}
      onStartLiveCall={state.handleStartLiveCall}
      onAnalyzeRecording={state.handleAnalyzeSavedRecording}
      onResetCall={state.recorder.clearRecording}
      errorMessage={state.telecomError}
      troubleshooting={state.telecomTrouble}
    />
  );
}

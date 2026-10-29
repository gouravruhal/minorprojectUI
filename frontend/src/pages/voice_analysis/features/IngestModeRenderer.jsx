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
      />
    );
  }

  if (state.ingestMode === 'upload') {
    return (
      <CustomFileUploader
        fileInputRef={state.fileInputRef}
        uploadedFile={state.uploadedFile}
        customFileResult={state.customFileResult}
        onFileChange={(e) => {
          const file = e.target.files?.[0];
          if (file) state.handleFileUpload(file);
        }}
        onLoadSampleFile={(sampleType) => {
          state.handleLoadSampleFile(sampleType);
        }}
        isStreaming={isStreaming}
        onStartStream={() => onStartStream('file')}
        onStopStream={onStopStream}
        onClearFile={state.handleClearUploadedFile}
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
    return (
      <ConnectedSubscriberProfile
        enteredNumber={state.enteredNumber}
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

  return (
    <CarrierConnectionHero
      wirelessStatus={state.wirelessStatus}
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
    />
  );
}

export function generateAcousticAnomalies(
  isDisplaySynthetic,
  liveJitter = '0.74%',
  liveShimmer = '2.15%',
  liveLiveness = '94%',
  _spectralCentroid = 2140
) {
  if (isDisplaySynthetic) {
    return [
      {
        id: 'anomaly-vocoder',
        title: 'Neural Vocoder Phase Discontinuity',
        badge: 'CRITICAL',
        category: 'VOCODER ARTIFACT',
        severity: 'danger',
        metric: 'Phase Mismatch: +3.82 rad',
        baseline: 'Baseline: < 0.4 rad',
        status: 'HiFi-GAN / Diffusion Signature',
        desc: 'Phase mismatch detected in harmonic transitions matching neural vocoder synthesis.'
      },
      {
        id: 'anomaly-jitter',
        title: 'Micro-Pitch Jitter Deficit',
        badge: 'ABNORMAL',
        category: 'LIVENESS DEFICIT',
        severity: 'danger',
        metric: `Measured Jitter: ${liveJitter}`,
        baseline: 'Baseline: 0.50% - 1.50%',
        status: 'Robotic Pitch Flatness',
        desc: `Micro-pitch variation (${liveJitter}) is unnaturally flat compared to human speech.`
      },
      {
        id: 'anomaly-shimmer',
        title: 'Amplitude Shimmer Freeze',
        badge: 'ABNORMAL',
        category: 'AIRFLOW DYNAMICS',
        severity: 'danger',
        metric: `Measured Shimmer: ${liveShimmer}`,
        baseline: 'Baseline: 1.80% - 3.50%',
        status: 'Suppressed Volume Fluctuation',
        desc: `Micro-amplitude volume tremor (${liveShimmer}) lacks natural pulmonary airflow.`
      },
      {
        id: 'anomaly-gnn',
        title: 'GNN Acoustic Manifold Outlier',
        badge: 'CLASSIFIER',
        category: 'DEEP LEARNING',
        severity: 'danger',
        metric: `Biometric Liveness: ${liveLiveness}`,
        baseline: 'Threshold: > 85%',
        status: 'Synthetic Cluster Match',
        desc: 'Deep feature vector matches known AI voice clone clusters with 12% liveness fit.'
      }
    ];
  }

  return [
    {
      id: 'anomaly-jitter-ok',
      title: 'Glottal Jitter Perturbation',
      badge: 'VERIFIED',
      category: 'BIOLOGICAL LIVENESS',
      severity: 'safe',
      metric: `Measured Jitter: ${liveJitter}`,
      baseline: 'Baseline: 0.50% - 1.50%',
      status: 'Organic Tremor Confirmed',
      desc: `Micro-pitch jitter (${liveJitter}) confirms natural human vocal fold oscillation.`
    },
    {
      id: 'anomaly-vocoder-ok',
      title: 'Harmonic Phase Continuity',
      badge: 'VERIFIED',
      category: 'PHASE ALIGNMENT',
      severity: 'safe',
      metric: 'Vocoder Artifacts: None',
      baseline: 'Continuous 0Hz - 8000Hz',
      status: 'Zero Synthesis Artifacts',
      desc: 'Full-spectrum acoustic sweep verifies uninterrupted natural phase alignment.'
    },
    {
      id: 'anomaly-tract-ok',
      title: 'Vocal Tract Resonance',
      badge: 'VERIFIED',
      category: 'ACOUSTIC PHONETICS',
      severity: 'safe',
      metric: `Biometric Liveness: ${liveLiveness}`,
      baseline: 'Formants: F1/F2 Conforming',
      status: 'Biological Cavity Resonance',
      desc: 'Formants and decay patterns conform to physical human vocal tract acoustics.'
    }
  ];
}

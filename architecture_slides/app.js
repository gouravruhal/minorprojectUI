/**
 * VoiceShield AI - Architecture & Dataflow Showcase Application Controller
 * Manages slide navigation, filter switching, animated auto-flow stepper, and scenario evaluations.
 */
import { PIPELINE_STAGES, PREDICTION_SCENARIOS } from './pipeline_data.js';
import { FlowRenderer } from './flow_renderer.js';
import { getNodeSpec } from './node_specs.js';

let currentSlide = 0;
let activeFilter = 'all';
let activeScenario = 'human';
let isAutoPlaying = false;
let autoPlayInterval = null;
let flowRenderer = null;

const TOTAL_SLIDES = 6;

document.addEventListener('DOMContentLoaded', () => {
  flowRenderer = new FlowRenderer('pipeline-canvas-container', handleNodeClick);
  initControls();
  renderAll();
});

function initControls() {
  document.getElementById('prev-slide-btn')?.addEventListener('click', () => changeSlide(-1));
  document.getElementById('next-slide-btn')?.addEventListener('click', () => changeSlide(1));

  document.querySelectorAll('.slide-dot').forEach((dot, idx) => {
    dot.addEventListener('click', () => goToSlide(idx));
  });

  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeFilter = e.currentTarget.getAttribute('data-filter');
      renderPipeline();
    });
  });

  document.querySelectorAll('.scenario-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeScenario = e.currentTarget.getAttribute('data-scenario');
      renderScenarioCard();
      renderPipeline();
    });
  });

  document.getElementById('play-toggle-btn')?.addEventListener('click', toggleAutoPlay);
  document.getElementById('reset-flow-btn')?.addEventListener('click', resetFlow);
  window.selectPipelineNode = handleNodeClick;
}

function changeSlide(delta) {
  goToSlide((currentSlide + delta + TOTAL_SLIDES) % TOTAL_SLIDES);
}

function goToSlide(idx) {
  currentSlide = idx;
  document.querySelectorAll('.slide-section').forEach((sec, i) => {
    sec.classList.toggle('active', i === currentSlide);
  });
  document.querySelectorAll('.slide-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
  const titles = [
    "End-to-End Deepfake Forensics Architecture",
    "Audio Ingress & DSP Kaiser Sanitization",
    "Multi-View Acoustic, Spectral & Phase Space",
    "Dual-Stream ResNet & Attention Fusion Core",
    "Physics-Guided Calibrator & Anti-Replay",
    "Calibrated Prediction & Multi-Scenario Comparison"
  ];
  const titleEl = document.getElementById('slide-main-title');
  if (titleEl) titleEl.textContent = titles[currentSlide] || "Pipeline Overview";
  const numEl = document.getElementById('slide-counter-badge');
  if (numEl) numEl.textContent = `Slide ${currentSlide + 1} of ${TOTAL_SLIDES}`;
}

function toggleAutoPlay() {
  isAutoPlaying = !isAutoPlaying;
  const btn = document.getElementById('play-toggle-btn');
  if (isAutoPlaying) {
    if (btn) btn.innerHTML = `<span class="icon">⏸</span> Pause Auto Flow`;
    autoPlayInterval = setInterval(() => changeSlide(1), 4500);
  } else {
    if (btn) btn.innerHTML = `<span class="icon">▶</span> Play Auto Flow`;
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
}

function resetFlow() {
  if (autoPlayInterval) clearInterval(autoPlayInterval);
  isAutoPlaying = false;
  const btn = document.getElementById('play-toggle-btn');
  if (btn) btn.innerHTML = `<span class="icon">▶</span> Play Auto Flow`;
  currentSlide = 0;
  activeFilter = 'all';
  activeScenario = 'human';
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'all'));
  document.querySelectorAll('.scenario-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-scenario') === 'human'));
  goToSlide(0);
  renderAll();
}

function renderPipeline() {
  if (flowRenderer) flowRenderer.render(activeFilter, activeScenario);
}

function renderScenarioCard() {
  const sc = PREDICTION_SCENARIOS[activeScenario];
  const card = document.getElementById('scenario-result-panel');
  if (!sc || !card) return;

  card.style.setProperty('--scenario-accent', sc.accentColor);
  card.innerHTML = `
    <div class="result-header">
      <div class="result-left">
        <span class="scenario-badge ${sc.badgeType}">${sc.badge}</span>
        <h3 class="scenario-title">${sc.title}</h3>
      </div>
      <div class="result-score-box">
        <span class="score-label">Calibrated Impersonation Risk</span>
        <div class="score-val" style="color: ${sc.accentColor}">${sc.riskScore}%</div>
        <span class="threat-pill ${sc.threatTier.toLowerCase()}">THREAT: ${sc.threatTier}</span>
      </div>
    </div>
    <div class="result-metrics-grid">
      <div class="metric-card">
        <span class="m-label">Phone Loudspeaker (Sub-260Hz)</span>
        <span class="m-val">${sc.metrics.sub260Ratio}</span>
      </div>
      <div class="metric-card">
        <span class="m-label">Glottal Jitter PPQ-5</span>
        <span class="m-val">${sc.metrics.jitterPPQ}</span>
      </div>
      <div class="metric-card">
        <span class="m-label">Glottal Shimmer APQ-3</span>
        <span class="m-val">${sc.metrics.shimmerAPQ}</span>
      </div>
      <div class="metric-card">
        <span class="m-label">Fundamental Frequency (F0)</span>
        <span class="m-val">${sc.metrics.f0Variation}</span>
      </div>
    </div>
    <div class="result-footer">
      <div class="verdict-text">
        <strong>Forensic Physics Assessment:</strong> ${sc.verdictSummary}
      </div>
      <div class="action-recommendation">
        <span class="action-tag">Autonomous Action:</span>
        <span class="action-name">${sc.action}</span>
      </div>
    </div>
  `;
}

function handleNodeClick(nodeId, stageId) {
  const stage = PIPELINE_STAGES.find(s => s.id === stageId);
  const node = stage?.nodes.find(n => n.id === nodeId);
  const infoPanel = document.getElementById('node-telemetry-drawer');
  if (!node || !infoPanel) return;

  infoPanel.classList.add('visible');
  infoPanel.innerHTML = `
    <div class="drawer-header">
      <h4>${node.label} (${stage.name})</h4>
      <button class="drawer-close" onclick="document.getElementById('node-telemetry-drawer').classList.remove('visible')">✕</button>
    </div>
    <div class="drawer-body">
      <p><strong>Subsystem:</strong> ${node.sub}</p>
      <p><strong>Stage Category:</strong> ${stage.badge}</p>
      <div class="drawer-spec-box">
        <span class="spec-tag">Mathematical Specification:</span>
        <code>${getNodeSpec(node.id)}</code>
      </div>
    </div>
  `;
}

function renderAll() {
  renderPipeline();
  renderScenarioCard();
}

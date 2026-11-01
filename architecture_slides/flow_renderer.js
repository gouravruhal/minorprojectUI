/**
 * VoiceShield AI - Interactive SVG Dataflow Pipeline Renderer
 * Draws dynamic pipeline nodes, connection lines, animated glowing data packets,
 * and handles filter-specific highlighting and node selection.
 */
import { PIPELINE_STAGES, PREDICTION_SCENARIOS } from './pipeline_data.js';

export class FlowRenderer {
  constructor(svgContainerId, onNodeSelect) {
    this.container = document.getElementById(svgContainerId);
    this.onNodeSelect = onNodeSelect;
    this.activeFilter = 'all';
    this.activeScenario = 'human';
    this.animationTimer = null;
    this.packetOffset = 0;
  }

  render(filter = 'all', scenario = 'human') {
    this.activeFilter = filter;
    this.activeScenario = scenario;
    if (!this.container) return;

    const stages = filter === 'all' 
      ? PIPELINE_STAGES 
      : PIPELINE_STAGES.filter(s => s.id === filter);

    const scenarioObj = PREDICTION_SCENARIOS[scenario] || PREDICTION_SCENARIOS.human;
    const activePathNodes = new Set(scenarioObj.flowPath);
    const flowColor = scenarioObj.accentColor;

    let html = `<div class="pipeline-grid ${filter !== 'all' ? 'single-stage' : ''}">`;

    stages.forEach((stage, sIdx) => {
      const isStageHighlighted = filter === 'all' || filter === stage.id;
      html += `
        <div class="stage-column ${isStageHighlighted ? 'highlighted' : 'dimmed'}" data-stage="${stage.id}">
          <div class="stage-header">
            <span class="stage-num">${stage.number}</span>
            <div class="stage-titles">
              <h4>${stage.name}</h4>
              <span class="stage-badge">${stage.badge}</span>
            </div>
          </div>
          <div class="stage-nodes">
      `;

      stage.nodes.forEach((node, nIdx) => {
        const inActiveScenario = activePathNodes.has(node.id);
        const shapeClass = node.type === 'calib' ? 'shape-hex' : (node.type === 'dsp' ? 'shape-proc' : 'shape-card');
        const activeClass = inActiveScenario ? 'node-active' : '';

        html += `
          <div class="pipeline-node ${shapeClass} ${activeClass}" 
               data-node-id="${node.id}" 
               style="--accent: ${inActiveScenario ? flowColor : '#94a3b8'}"
               onclick="window.selectPipelineNode('${node.id}', '${stage.id}')">
            <div class="node-indicator"></div>
            <div class="node-content">
              <span class="node-label">${node.label}</span>
              <span class="node-sub">${node.sub}</span>
            </div>
            ${inActiveScenario ? `<div class="packet-tracer" style="background:${flowColor}"></div>` : ''}
          </div>
        `;
        if (nIdx < stage.nodes.length - 1) {
          html += `<div class="node-connector-v ${inActiveScenario ? 'active-wire' : ''}"></div>`;
        }
      });

      html += `</div></div>`;
      if (sIdx < stages.length - 1 && filter === 'all') {
        html += `
          <div class="inter-stage-arrow">
            <div class="arrow-line ${activePathNodes.has(stage.nodes[stage.nodes.length - 1].id) ? 'flow-active' : ''}">
              <div class="moving-packet" style="--pkt-color:${flowColor}"></div>
            </div>
            <span class="arrow-symbol">›</span>
          </div>
        `;
      }
    });

    html += `</div>`;
    this.container.innerHTML = html;
  }

  highlightPath(nodeIds, accentColor) {
    const allNodes = this.container.querySelectorAll('.pipeline-node');
    allNodes.forEach(n => {
      const id = n.getAttribute('data-node-id');
      if (nodeIds.includes(id)) {
        n.classList.add('node-active');
        n.style.setProperty('--accent', accentColor);
      } else {
        n.classList.remove('node-active');
        n.style.setProperty('--accent', '#94a3b8');
      }
    });
  }
}

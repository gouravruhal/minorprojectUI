import React from 'react';
import { Sliders, PhoneCall, DollarSign, UserCheck, UserX, Shield } from 'lucide-react';

export function MicContextMetadataPanel({ context, onChangeContext, isStreaming }) {
  const handleToggleRoute = (route) => {
    onChangeContext({ ...context, routeType: route });
  };

  const handleAmountChange = (amt) => {
    onChangeContext({ ...context, transactionAmount: amt });
  };

  const handleToggleKnown = (known) => {
    onChangeContext({ ...context, knownContact: known });
  };

  const handleVipChange = (vipId) => {
    onChangeContext({ ...context, claimedIdentity: vipId });
  };

  return (
    <div className="mic-context-panel card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Sliders size={18} className="text-accent" />
          <h3 className="panel-heading">Context-Aware Ingress & VIP Identity</h3>
        </div>
        <span className="badge badge-neutral text-xs">Dynamic 15% Context + 15% Speaker Weight</span>
      </div>

      <div className="context-controls-grid">
        <div className="context-ctrl-block">
          <label className="context-label">Call Ingress Route</label>
          <div className="toggle-pill-group">
            <button
              type="button"
              className={`pill-btn ${context.routeType === 'cellular' ? 'pill-active' : ''}`}
              onClick={() => handleToggleRoute('cellular')}
              disabled={isStreaming}
            >
              Cellular / PSTN (Normal)
            </button>
            <button
              type="button"
              className={`pill-btn pill-danger ${context.routeType === 'voip' ? 'pill-active' : ''}`}
              onClick={() => handleToggleRoute('voip')}
              disabled={isStreaming}
            >
              VoIP / Unknown (+35%)
            </button>
          </div>
        </div>

        <div className="context-ctrl-block">
          <label className="context-label">Transaction Exposure</label>
          <div className="toggle-pill-group">
            <button
              type="button"
              className={`pill-btn ${context.transactionAmount <= 0 ? 'pill-active' : ''}`}
              onClick={() => handleAmountChange(0)}
              disabled={isStreaming}
            >
              ₹0 (Inquiry)
            </button>
            <button
              type="button"
              className={`pill-btn ${context.transactionAmount === 85000 ? 'pill-active' : ''}`}
              onClick={() => handleAmountChange(85000)}
              disabled={isStreaming}
            >
              ₹85,000 (&gt; ₹50k)
            </button>
            <button
              type="button"
              className={`pill-btn pill-danger ${context.transactionAmount >= 500000 ? 'pill-active' : ''}`}
              onClick={() => handleAmountChange(500000)}
              disabled={isStreaming}
            >
              ₹5,00,000 (Wire)
            </button>
          </div>
        </div>

        <div className="context-ctrl-block">
          <label className="context-label">Caller Directory Match</label>
          <div className="toggle-pill-group">
            <button
              type="button"
              className={`pill-btn ${context.knownContact ? 'pill-active' : ''}`}
              onClick={() => handleToggleKnown(true)}
              disabled={isStreaming}
            >
              <UserCheck size={12} className="mr-1 inline" /> Known Contact
            </button>
            <button
              type="button"
              className={`pill-btn pill-danger ${!context.knownContact ? 'pill-active' : ''}`}
              onClick={() => handleToggleKnown(false)}
              disabled={isStreaming}
            >
              <UserX size={12} className="mr-1 inline" /> Unknown (+20%)
            </button>
          </div>
        </div>

        <div className="context-ctrl-block">
          <label className="context-label">Target / Claimed Executive</label>
          <select
            className="select-clay"
            value={context.claimedIdentity || ''}
            onChange={(e) => handleVipChange(e.target.value)}
            disabled={isStreaming}
          >
            <option value="">Standard Caller (Within-Call Consistency)</option>
            <option value="VIP-001">Rajesh Sharma — Chief Executive Officer (CEO)</option>
            <option value="VIP-002">Anita Roy — Chief Financial Officer (CFO)</option>
            <option value="VIP-003">Vikram Malhotra — VP Treasury Operations</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default MicContextMetadataPanel;

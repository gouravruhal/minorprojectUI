import React from 'react';
import { Bell, Clock } from 'lucide-react';

export function LiveIncidentStream({ incidentLogs }) {
  return (
    <section className="incident-stream-panel card">
      <div className="panel-title-group">
        <Bell size={18} className="text-orange" />
        <h3 className="panel-heading">Live Incident & Alert Stream</h3>
      </div>

      <div className="incident-timeline">
        {incidentLogs.map((log) => (
          <div key={log.id} className={`timeline-card ${log.level.toLowerCase()}`}>
            <div className="timeline-top">
              <span className={`timeline-badge ${log.level.toLowerCase()}`}>
                {log.level}
              </span>
              <span className="timeline-time mono-metric">
                <Clock size={11} />
                <span>{log.time}</span>
              </span>
            </div>
            <h4 className="timeline-title">{log.title}</h4>
            <p className="timeline-detail">{log.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

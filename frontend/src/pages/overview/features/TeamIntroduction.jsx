import React from 'react';
import './TeamIntroduction.css';

const TEAM_MEMBERS = [
  {
    name: 'Gourav',
    role: 'Project Handling & Engineering Lead',
    responsibility: 'End-to-end project orchestration, core system integration, milestone tracking, pipeline deployment, and technical delivery of the VoiceShield AI defense architecture.',
    badge: 'Project Handling',
    avatar: 'G'
  },
  {
    name: 'Shivang Sharma',
    role: 'Presentation & Ideation Lead',
    responsibility: 'Conceptual framework design, threat vector ideation, defense workflow UX, pitch presentation, architectural storytelling, and stakeholder solution alignment.',
    badge: 'Presentation & Ideation',
    avatar: 'SS'
  },
  {
    name: 'Punar Vasu',
    role: 'Research & Documentation Lead',
    responsibility: 'In-depth acoustic research, dataset curation & benchmarking, regulatory compliance (India DPDP Act 2023), academic whitepaper synthesis, and architectural documentation.',
    badge: 'Research & Documentation',
    avatar: 'PV'
  }
];

export function TeamIntroduction() {
  return (
    <div className="team-intro-container">
      <div className="section-header">
        <div className="section-pill">Academic Development Team</div>
        <h2 className="section-title">Meet the Engineering Team</h2>
        <p className="section-desc">
          Developed for 3rd Year 5th Semester Computer Science Minor Project & Smart India Hackathon (SIH 2026).
        </p>
      </div>

      <div className="team-grid">
        {TEAM_MEMBERS.map((member, idx) => (
          <div key={idx} className="team-card card">
            <div className="team-card-header">
              <div className="member-avatar mono-metric">{member.avatar}</div>
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <span className="member-role">{member.role}</span>
              </div>
            </div>
            <div className="member-badge-row">
              <span className="badge badge-neutral">{member.badge}</span>
              <span className="badge badge-safe">CSE 5th Sem</span>
            </div>
            <p className="member-desc">{member.responsibility}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

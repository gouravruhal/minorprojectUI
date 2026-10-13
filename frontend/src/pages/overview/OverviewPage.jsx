import React from 'react';
import { HeroSection } from './features/HeroSection';
import { ArchitectureSummary } from './features/ArchitectureSummary';
import { DefenseWorkflowSteps } from './features/DefenseWorkflowSteps';
import { TeamIntroduction } from './features/TeamIntroduction';
import { AcademicMetaCard } from './features/AcademicMetaCard';
import './OverviewPage.css';

export function OverviewPage({ onLaunchConsole, onLaunchPipeline }) {
  return (
    <div className="landing-page animate-fade-in" id="landing-overview-view">
      {/* 1. Hero Overview Section */}
      <HeroSection 
        onLaunchConsole={onLaunchConsole} 
        onLaunchPipeline={onLaunchPipeline} 
      />

      {/* 2. Three Pillars Defense Architecture */}
      <ArchitectureSummary />

      {/* 3. Interactive 4-Stage Workflow Steps */}
      <DefenseWorkflowSteps />

      {/* 4. Academic Engineering Team & Meta Details */}
      <section className="team-section" id="team-introduction-section">
        <TeamIntroduction />
        <AcademicMetaCard />
      </section>
    </div>
  );
}

export default OverviewPage;

import React from 'react';
import { PrivacyComplianceHeader } from './features/PrivacyComplianceHeader';
import { ComplianceGuaranteeCards } from './features/ComplianceGuaranteeCards';
import { AuditLogTable } from './features/AuditLogTable';
import './PrivacyCompliancePage.css';

export function PrivacyCompliancePage() {
  return (
    <div className="audit-report-view animate-fade-in" id="compliance-audit-view">
      <PrivacyComplianceHeader />
      <ComplianceGuaranteeCards />
      <AuditLogTable />
    </div>
  );
}

export default PrivacyCompliancePage;

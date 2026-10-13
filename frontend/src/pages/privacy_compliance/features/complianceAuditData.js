export const SAMPLE_AUDIT_LOGS = [
  {
    sessionId: 'SESS-2026-X892',
    timestamp: '2026-10-12 15:42:19 IST',
    caller: 'Sunil Sharma (MD & CEO) [SPOOFED]',
    phone: '+91 98110 44291',
    channel: 'SIP Trunk via VoIP',
    peakRisk: '91%',
    verdict: 'CRITICAL_SPOOF',
    actionTaken: 'Transaction Frozen & Out-of-band MFA Dispatched'
  },
  {
    sessionId: 'SESS-2026-X844',
    timestamp: '2026-10-12 15:10:04 IST',
    caller: 'Pooja Hegde (Branch Operations)',
    phone: '+91 80234 11928',
    channel: 'Airtel 2G GSM-FR (13.0 kbps)',
    peakRisk: '24%',
    verdict: 'GENUINE_HUMAN',
    actionTaken: 'Normal Pass-Through'
  },
  {
    sessionId: 'SESS-2026-X801',
    timestamp: '2026-10-12 14:35:22 IST',
    caller: 'Rajesh Verma (Regional Director)',
    phone: '+91 94150 88203',
    channel: 'WhatsApp VoIP (Opus)',
    peakRisk: '79%',
    verdict: 'CRITICAL_SPOOF',
    actionTaken: 'Operator Verbal Challenge Prompted'
  }
];

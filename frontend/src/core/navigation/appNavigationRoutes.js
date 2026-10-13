export const TAB_ROUTES = {
  overview: '/',
  voice: '/voice-analysis',
  context: '/context-analysis',
  risk: '/risk-assessment',
  alerts: '/alerts-prevention',
  privacy: '/privacy-compliance',
};

export const ROUTE_TO_TAB = {
  '/': 'overview',
  '/overview': 'overview',
  '/voice': 'voice',
  '/voice-analysis': 'voice',
  '/context': 'context',
  '/context-analysis': 'context',
  '/risk': 'risk',
  '/risk-assessment': 'risk',
  '/alerts': 'alerts',
  '/alerts-prevention': 'alerts',
  '/privacy': 'privacy',
  '/privacy-compliance': 'privacy',
};

export function getInitialTab() {
  if (typeof window !== 'undefined') {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (ROUTE_TO_TAB[rawPath]) {
      return ROUTE_TO_TAB[rawPath];
    }
    const rawHash = window.location.hash.replace('#', '').toLowerCase().replace(/^\//, '');
    if (ROUTE_TO_TAB['/' + rawHash]) {
      return ROUTE_TO_TAB['/' + rawHash];
    }
    if (TAB_ROUTES[rawHash]) {
      return rawHash;
    }
    try {
      const saved = localStorage.getItem('voiceshield_active_tab');
      if (saved && TAB_ROUTES[saved]) {
        return saved;
      }
    } catch {
      // Ignore storage read errors
    }
  }
  return 'overview';
}

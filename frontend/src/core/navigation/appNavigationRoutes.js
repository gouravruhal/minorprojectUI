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
    const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (ROUTE_TO_TAB[pathname]) {
      return ROUTE_TO_TAB[pathname];
    }
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (TAB_ROUTES[hash]) {
      return hash;
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

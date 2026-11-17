export const TAB_ROUTES = {
  overview: '/team-overview',
  voice: '/recording-analysis',
  'mic-analysis': '/microphone-analysis',
  telephony: '/telephony-link',
  history: '/history',
};

export const ROUTE_TO_TAB = {
  '/': 'overview',
  '/overview': 'overview',
  '/team-overview': 'overview',
  '/voice': 'voice',
  '/voice-analysis': 'voice',
  '/recording-analysis': 'voice',
  '/mic-analysis': 'mic-analysis',
  '/microphone-analysis': 'mic-analysis',
  '/telephony': 'telephony',
  '/telephony-link': 'telephony',
  '/live-connectivity': 'telephony',
  '/history': 'history',
  '/audit-history': 'history',
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

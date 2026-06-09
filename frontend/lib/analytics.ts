export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, params);
};

export async function trackEvent(event: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    const url = '/api/analytics/event';
    const payload = JSON.stringify({ event, metadata: metadata ?? {} });

    // Prefer Beacon for reliability during unload/navigation
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' });
      (navigator as any).sendBeacon(url, blob);
      return;
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      // Improves delivery when the page is unloading
      keepalive: true,
      credentials: 'same-origin',
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('trackEvent failed', err);
    }
  }
}

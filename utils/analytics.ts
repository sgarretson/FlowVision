export async function trackEvent(event: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, metadata }),
    });
  } catch {
    // no-op
  }
}

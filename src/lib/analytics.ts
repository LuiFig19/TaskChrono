'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  const optOut = (typeof window !== 'undefined' && localStorage.getItem('tc-analytics-optout') === '1');
  if (key && typeof window !== 'undefined' && !optOut) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      autocapture: true,
      persistence: 'memory',
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
    initialized = true;
  }
}

export function optOutAnalytics(value: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tc-analytics-optout', value ? '1' : '0');
  if (value) posthog.opt_out_capturing();
  else posthog.opt_in_capturing();
}

export function track(event: string, properties?: Record<string, any>) {
  if (!initialized) return;
  try {
    const safe = Object.fromEntries(
      Object.entries(properties || {}).filter(([k]) => !/(email|name|id|token)/i.test(k)),
    );
    posthog.capture(event, safe);
  } catch {}
}



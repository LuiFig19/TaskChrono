'use client';

import { useEffect } from 'react';

export default function AutoPopup({
  signedIn,
  callbackUrl,
}: {
  signedIn: boolean;
  callbackUrl: string;
}) {
  useEffect(() => {
    if (signedIn) {
      window.location.href = callbackUrl || '/dashboard';
      return;
    }
    const dst = callbackUrl || '/dashboard';
    const base = window.location.origin.includes('localhost')
      ? window.location.origin.replace('localhost', '127.0.0.1')
      : window.location.origin;
    const url = new URL(`/auth/popup?dst=${encodeURIComponent(dst)}`, base).toString();
    const w = 520,
      h = 640;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`;
    const child = window.open(url, 'tc-oauth', features);
    const handler = (e: MessageEvent) => {
      if (e.origin !== base && e.origin !== window.location.origin) return;
      if (typeof e.data === 'object' && e.data?.type === 'tc:signed-in') {
        window.removeEventListener('message', handler);
        try {
          child?.close();
        } catch {}
        window.location.href = e.data?.dst || dst;
      }
    };
    window.addEventListener('message', handler);
    // As a fallback, if user closes popup, stay on current page
    return () => window.removeEventListener('message', handler);
  }, [signedIn, callbackUrl]);
  return null;
}

//

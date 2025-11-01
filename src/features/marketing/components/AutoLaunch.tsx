'use client';

import React from 'react';

export default function AutoLaunch() {
  React.useEffect(() => {
    const url = new URL(window.location.href);
    // Invite deep link: open landing modal that will handle auth
    const invite = url.searchParams.get('invite');
    if (invite) {
      // redirect into dedicated join screen to show modal and continue auth
      window.location.replace(`/join?token=${encodeURIComponent(invite)}`);
      return;
    }
    if (url.searchParams.get('signin') === '1') {
      const dst = url.searchParams.get('dst') || '/dashboard';
      const base = window.location.origin.includes('localhost')
        ? window.location.origin.replace('localhost', '127.0.0.1')
        : window.location.origin;
      const w = 520,
        h = 640;
      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
      const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
      const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`;
      const abs = new URL(`/auth/popup?dst=${encodeURIComponent(dst)}`, base).toString();
      const child = window.open(abs, 'tc-oauth', features);
      const handler = (e: MessageEvent) => {
        if (e.origin !== base && e.origin !== window.location.origin) return;
        if (typeof e.data === 'object' && (e.data as any)?.type === 'tc:signed-in') {
          window.removeEventListener('message', handler);
          try {
            child?.close();
          } catch {}
          window.location.href = (e.data as any)?.dst || '/dashboard';
        }
      };
      window.addEventListener('message', handler);
      url.searchParams.delete('signin');
      url.searchParams.delete('dst');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  return null;
}


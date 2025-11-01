'use client';

import React from 'react';

export default function PopupDone() {
  React.useEffect(() => {
    async function finalize() {
      const url = new URL(window.location.href);
      const dst = url.searchParams.get('dst') || '/dashboard';
      const origin = window.location.origin;

      // Wait until the session is visible to the server (avoid race conditions)
      let sessionVerified = false;
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch('/api/onboarding/verify-session', { cache: 'no-store', credentials: 'include' });
          if (res.ok) {
            const j = await res.json().catch(() => ({} as any));
            if (j?.authenticated) {
              sessionVerified = true;
              break;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 200));
      }

      if (!sessionVerified) {
        window.location.replace('/auth/popup/no-account');
        return;
      }

      // Check if user has an active organization; if none, guide to sign up flow
      try {
        const orgRes = await fetch('/api/org/active', { cache: 'no-store', credentials: 'include' });
        if (!orgRes.ok) {
          window.location.replace('/auth/popup/no-account');
          return;
        }
        const org = await orgRes.json().catch(() => ({} as any));
        if (!org?.id) {
          window.location.replace('/auth/popup/no-account');
          return;
        }
      } catch {
        window.location.replace('/auth/popup/no-account');
        return;
      }

      try {
        window.opener?.postMessage({ type: 'tc:signed-in', dst }, '*');
      } catch {}
      try {
        if (window.opener && typeof window.opener.location?.assign === 'function') {
          const abs = new URL(dst, origin).toString();
          window.opener.location.assign(abs);
        }
      } catch {}
      setTimeout(() => {
        try { window.close(); } catch {}
        setTimeout(() => { window.location.replace(dst); }, 150);
      }, 80);
    }

    finalize().catch(() => {
      window.location.replace('/auth/popup/no-account');
    });
  }, []);

  return (
    <div className="min-h-[100vh] grid place-items-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold">Finishing sign-in…</div>
        <div className="text-sm text-slate-400">You can close this window if it doesn't close automatically.</div>
      </div>
    </div>
  );
}



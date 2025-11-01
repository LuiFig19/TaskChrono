'use client';

export default function SignInButton() {
  function openPopup() {
    const dst = '/dashboard';
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
      if (typeof e.data === 'object' && (e.data as any)?.type === 'tc:signed-in') {
        window.removeEventListener('message', handler);
        try {
          child?.close();
        } catch {}
        window.location.href = (e.data as any)?.dst || dst;
      }
    };
    window.addEventListener('message', handler);
  }

  return (
    <button onClick={openPopup} className="px-3 py-2 rounded-md">
      Sign In
    </button>
  );
}


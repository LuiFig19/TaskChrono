'use client';
import Link from 'next/link';

import ThemeToggle from '@/components/theme/ThemeToggle';

export default function Header() {
  const quickshiftUrl = '/quickshift';
  return (
    <header
      data-app-nav
      data-marketing-nav
      className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60"
    >
      <div className="tc-nav-inner max-w-screen-2xl mx-auto px-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo with gradient */}
        <Link
          href="/"
          className="tc-logo text-xl font-extrabold bg-gradient-to-r from-white via-indigo-300 to-violet-400 bg-clip-text text-transparent tracking-tight leading-none"
        >
          TaskChrono
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex justify-center items-center gap-1 text-[16px] font-medium tracking-wide">
          {[
            { href: '#features', label: 'Features' },
            { href: '#pricing', label: 'Pricing' },
            { href: '#comparison', label: 'Comparison' },
            { href: '#screenshot', label: 'View Dashboard' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative px-3 py-1.5 rounded-md hover:text-white transition-colors"
            >
              <span className="transition-[filter] group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.55)]">
                {l.label}
              </span>
              <span
                className="pointer-events-none absolute inset-x-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
            </a>
          ))}
        </nav>

        {/* Right actions: Theme toggle, QuickShift highlighted, then auth CTAs */}
        <div className="flex items-center gap-2 justify-end">
          <ThemeToggle />
          <Link
            href={quickshiftUrl}
            data-quickshift-cta
            className="relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:via-violet-400 hover:to-indigo-400 transition-colors"
          >
            QuickShift
            <span className="absolute -inset-px rounded-md ring-1 ring-white/10" aria-hidden />
          </Link>
          <button
            onClick={() => {
              const dst = '/dashboard';
              const base = window.location.origin.includes('localhost')
                ? window.location.origin.replace('localhost', '127.0.0.1')
                : window.location.origin;
              const abs = new URL(`/auth/popup?dst=${encodeURIComponent(dst)}`, base).toString();
              const w = 420,
                h = 560;
              const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
              const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
              const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`;
              const child = window.open(abs, 'tc-oauth', features);
              const allowedOrigin = base;
              const handler = (e: MessageEvent) => {
                if (e.origin !== allowedOrigin && e.origin !== window.location.origin) return;
                if (typeof e.data === 'object' && (e.data as any)?.type === 'tc:signed-in') {
                  window.removeEventListener('message', handler);
                  try {
                    child?.close();
                  } catch {}
                  const target = new URL(((e.data as any)?.dst || dst) as string, allowedOrigin).toString();
                  window.location.assign(target);
                }
              };
              window.addEventListener('message', handler);
            }}
            className="px-3 py-2 rounded-md text-slate-200 hover:text-white"
          >
            Sign In
          </button>
          <Link
            href="/get-started"
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

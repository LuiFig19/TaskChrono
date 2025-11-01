'use client';


export default function NoAccountPage() {
  return (
    <div className="min-h-[100vh] grid place-items-center bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur p-6 shadow-2xl">
        <div className="text-xl font-bold mb-2">No account found</div>
        <p className="text-slate-300 mb-4">
          This Google account isn&apos;t associated with any TaskChrono account. You can create one now.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                const base = window.location.origin;
                const url = new URL('/get-started', base).toString();
                // Navigate opener if possible
                if (window.opener && typeof window.opener.location?.assign === 'function') {
                  window.opener.location.assign(url);
                } else {
                  // Fallback: navigate this window
                  window.location.assign(url);
                }
              } finally {
                setTimeout(() => {
                  try { window.close(); } catch {}
                }, 50);
              }
            }}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
          >
            Go to sign up
          </button>
          <button
            onClick={() => {
              try { window.close(); } catch {}
            }}
            className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}



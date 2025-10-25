"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ActivationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('Activating your workspace...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const plan = searchParams.get('plan');
    
    // Wait a moment for any DB propagation, then redirect
    const timer = setTimeout(() => {
      setStatus('Redirecting to dashboard...');
      // Force a full page navigation to ensure session is picked up
      window.location.href = '/dashboard';
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <h1 className="text-2xl font-semibold text-white mb-2">Success!</h1>
        <p className="text-slate-300">{status}</p>
      </div>
    </div>
  );
}


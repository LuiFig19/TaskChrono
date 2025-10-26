"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ActivationClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('Completing your subscription...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function activate() {
      try {
        const token = searchParams.get('token');
        
        if (token) {
          // Try to restore session using the activation token
          setStatus('Restoring your session...');
          const restoreRes = await fetch('/api/onboarding/restore-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include',
          });
          
          const restoreData = await restoreRes.json().catch(() => ({} as any));
          
          if (restoreData.requiresLogin) {
            // Session was lost, need to log in again
            setStatus('Please log in to continue...');
            setTimeout(() => {
              const loginUrl = `/login?callbackUrl=${encodeURIComponent('/dashboard')}&email=${encodeURIComponent(restoreData.email || '')}`;
              window.location.href = loginUrl;
            }, 1500);
            return;
          }
        }
        
        // Check if we have a valid session now
        setStatus('Verifying your session...');
        const sessionRes = await fetch('/api/onboarding/verify-session', {
          credentials: 'include',
        });
        
        if (!sessionRes.ok) {
          // No session at all, redirect to login
          setStatus('Session expired. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/login?callbackUrl=' + encodeURIComponent('/dashboard');
          }, 1500);
          return;
        }

        // Session exists, wait for DB propagation then go to dashboard
        setStatus('Activating your workspace...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('Redirecting to your dashboard...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError('Failed to complete activation. Please try logging in.');
        setTimeout(() => {
          window.location.href = '/login?callbackUrl=' + encodeURIComponent('/dashboard');
        }, 3000);
      }
    }
    
    activate();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-rose-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Session Error</h1>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

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


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
        
        // First, check if we have a valid session
        setStatus('Verifying your session...');
        const sessionRes = await fetch('/api/onboarding/verify-session', {
          credentials: 'include',
        });
        
        const sessionData = await sessionRes.json().catch(() => ({} as any));
        
        if (!sessionRes.ok || !sessionData.authenticated) {
          // No session - need to log in
          if (token) {
            // Decode token to get email
            try {
              const decoded = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));
              // Try to get user email from complete-activation endpoint
              const activationRes = await fetch('/api/onboarding/complete-activation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
                credentials: 'include',
              });
              const activationData = await activationRes.json().catch(() => ({} as any));
              
              if (activationData.email) {
                setStatus('Please log in to access your dashboard...');
                setTimeout(() => {
                  window.location.href = `/login?callbackUrl=${encodeURIComponent('/dashboard')}&email=${encodeURIComponent(activationData.email)}`;
                }, 1000);
                return;
              }
            } catch {}
          }
          
          setStatus('Please log in to continue...');
          setTimeout(() => {
            window.location.href = `/login?callbackUrl=${encodeURIComponent('/dashboard')}`;
          }, 1000);
          return;
        }

        // Session exists! Wait for DB propagation then go to dashboard
        setStatus('Activating your workspace...');
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        setStatus('Redirecting to your dashboard...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use window.location.replace to avoid adding to history
        window.location.replace('/dashboard');
      } catch (err: any) {
        console.error('Activation error:', err);
        setError('Failed to complete activation. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login?callbackUrl=' + encodeURIComponent('/dashboard');
        }, 2000);
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


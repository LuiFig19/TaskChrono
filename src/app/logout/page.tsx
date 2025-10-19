'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/better-auth-client';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        await authClient.signOut();
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
      }
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Logging out...</p>
      </div>
    </div>
  );
}

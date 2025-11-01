'use client';
import { ThemeProvider } from 'next-themes';
import React from 'react';
import { SWRConfig } from 'swr';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { initAnalytics } from '@/lib/analytics';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="tc-theme">
      <SWRConfig
        value={{
          fetcher: (url: string) =>
            fetch(url, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()),
          revalidateOnFocus: false,
          dedupingInterval: 2000,
          keepPreviousData: true as any,
        }}
      >
        <InitAnalytics />
        {children}
        <Analytics />
      </SWRConfig>
    </ThemeProvider>
  );
}

function InitAnalytics() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}

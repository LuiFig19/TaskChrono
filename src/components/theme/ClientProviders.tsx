'use client';
import { ThemeProvider } from 'next-themes';
import React from 'react';
import { SWRConfig } from 'swr';

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
        {children}
      </SWRConfig>
    </ThemeProvider>
  );
}

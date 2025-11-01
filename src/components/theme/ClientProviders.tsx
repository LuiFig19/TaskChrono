'use client';
import { ThemeProvider } from 'next-themes';
import React from 'react';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="tc-theme">
      {children}
    </ThemeProvider>
  );
}

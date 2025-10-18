"use client"
import React from 'react'
import { ThemeProvider } from 'next-themes'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="tc-theme">
      {children}
    </ThemeProvider>
  )
}


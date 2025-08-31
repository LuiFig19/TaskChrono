"use client"
import React from 'react'
import dynamic from 'next/dynamic'
const ChatPanel = dynamic(() => import('@/components/ChatPanel'), { ssr: false, loading: () => null })

export default function ChatClientMount() {
  React.useEffect(() => {
    const handler = () => {
      // Refresh timers widgets/listeners (fire a lightweight event others can subscribe to)
      document.dispatchEvent(new CustomEvent('tc:refresh'))
    }
    document.addEventListener('tc:timer:changed', handler as EventListener)
    return () => document.removeEventListener('tc:timer:changed', handler as EventListener)
  }, [])

  // Open an SSE stream to receive server-side timer change events and refresh widgets instantly
  React.useEffect(() => {
    let es: EventSource | null = null
    function connect() {
      try { es && es.close() } catch {}
      es = new EventSource('/api/time')
      es.addEventListener('changed', () => {
        document.dispatchEvent(new CustomEvent('tc:refresh'))
      })
      es.addEventListener('error', () => {
        try { es && es.close() } catch {}
        // retry after small delay
        setTimeout(connect, 2000)
      })
    }
    connect()
    return () => { try { es && es.close() } catch {} }
  }, [])
  return <ChatPanel />
}


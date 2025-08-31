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
  return <ChatPanel />
}


"use client"
import React from 'react'
import dynamic from 'next/dynamic'
const ChatPanel = dynamic(() => import('@/components/ChatPanel'), { ssr: false, loading: () => null })

export default function ChatClientMount() {
  return <ChatPanel />
}


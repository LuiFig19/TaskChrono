"use client"
import React from 'react'
import dynamic from 'next/dynamic'
const ChatPanel = dynamic(() => import('@/components/ChatPanel').then(m=>({default:()=>null})), { ssr: false, loading: () => null })

export default function ChatClientMount() {
  return null
}


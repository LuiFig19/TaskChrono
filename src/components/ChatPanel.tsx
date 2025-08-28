"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Msg = { id: string; channelId: string; user: { id: string; name: string }; text: string; ts: number; role?: string }
type Like = { messageId: string; userId: string; userName: string }

const DEFAULT_CHANNELS = [
  { id: 'all', name: 'All Staff' },
  { id: 'managers', name: 'Management' },
  { id: 'employees', name: 'Employees' },
]

export default function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [channelId, setChannelId] = useState('all')
  const [channels, setChannels] = useState(DEFAULT_CHANNELS)
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Msg[]>>({})
  const [likes, setLikes] = useState<Record<string, Like[]>>({})
  const seenRef = useRef<Map<string, Set<string>>>(new Map())
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [draftScope, setDraftScope] = useState<'all'|'managers'|'employees'>('all')
  const eventRef = useRef<EventSource | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    // init seen set for this channel if not present
    if (!seenRef.current.has(channelId)) seenRef.current.set(channelId, new Set())
    const es = new EventSource(`/api/chat/stream?c=${encodeURIComponent(channelId)}`)
    eventRef.current = es
    es.addEventListener('message', (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data) as Msg
        const seen = seenRef.current.get(channelId)!
        if (seen.has(msg.id)) return
        seen.add(msg.id)
        setMessagesByChannel(v=> ({ ...v, [channelId]: [...(v[channelId]||[]), msg] })); scrollDown()
      } catch {}
    })
    es.addEventListener('liked', (ev: MessageEvent) => {
      try { const lk = JSON.parse(ev.data) as Like; setLikes(v=> ({ ...v, [lk.messageId]: [...(v[lk.messageId]||[]), lk] })) } catch {}
    })
    return () => { es.close(); eventRef.current = null }
  }, [open, channelId])

  function scrollDown() { requestAnimationFrame(()=> listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' })) }

  async function send() {
    const t = text.trim(); if (!t) return
    setText('')
    const res = await fetch('/api/chat/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channelId, text: t }) })
    if (res.ok) {
      const msg = await res.json()
      const seen = seenRef.current.get(channelId) || new Set<string>()
      if (!seen.has(msg.id)) {
        seen.add(msg.id)
        seenRef.current.set(channelId, seen)
        setMessagesByChannel(v=> ({ ...v, [channelId]: [...(v[channelId]||[]), msg] })); scrollDown()
      }
    }
  }

  return (
    <div className="inline-block ml-2 z-[100] relative">
      <button onClick={()=>setOpen(o=>!o)} aria-label="Open chat" className="relative h-9 w-9 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm">
        <span className="text-base" aria-hidden>💬</span>
      </button>
      {open && createPortal(
        <>
        <div className="fixed inset-0 z-[10000] bg-black/30" onClick={()=>setOpen(false)} />
        <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] max-w-[100vw] bg-slate-950 text-slate-100 border-l border-slate-800 shadow-2xl animate-[slidein_.2s_ease-out] grid grid-rows-[auto_1fr_auto] z-[10001]" role="dialog" aria-label="Team chat">
          <div className="p-3 md:p-3 border-b border-slate-800 flex items-center gap-2">
            <label htmlFor="chat-channel" className="sr-only">Channel</label>
            <select id="chat-channel" value={channelId} onChange={e=>setChannelId(e.target.value)} className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm">
              {channels.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {/* Always three channels; no add button */}
            <button onClick={()=>setOpen(false)} className="px-2 py-1 text-slate-300 hover:text-white">✕</button>
          </div>
          <div ref={listRef} className="overflow-y-auto p-3 space-y-2 text-sm bg-slate-950/50">
            {(messagesByChannel[channelId]||[]).map(m=> {
              const d = new Date(m.ts)
              const mm = String(d.getMonth()+1).padStart(2,'0')
              const dd = String(d.getDate()).padStart(2,'0')
              const yy = String(d.getFullYear()).slice(-2)
              const dateStr = `${mm}/${dd}/${yy}`
              const roleLabel = m.role || (m.channelId==='managers' ? 'Management' : 'Employee')
              return (
              <div key={m.id} className={`rounded-md border p-2 shadow-sm ${channelId==='managers' ? 'border-rose-700 bg-rose-950/30' : 'border-slate-800 bg-slate-900'}`}>
                <div className="text-slate-300 text-xs mb-0.5 flex items-center justify-between">
                  <span>{m.user.name} ({roleLabel})</span>
                  <span className="opacity-80 flex items-center gap-2">
                    {dateStr}
                    <button title="Delete" aria-label="Delete message" onClick={async()=>{ await fetch('/api/chat/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: m.id }) }); setMessagesByChannel(v=> ({ ...v, [channelId]: (v[channelId]||[]).filter(x=>x.id!==m.id) })) }} className="px-1 py-0.5 rounded border border-slate-700 hover:bg-slate-800">🗑</button>
                  </span>
                </div>
                <div className="text-slate-100 leading-relaxed">{m.text}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                  <button onClick={async()=>{ await fetch('/api/chat/like', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messageId: m.id }) }) }} className="px-1.5 py-0.5 rounded border border-slate-700 hover:bg-slate-800">❤ Like</button>
                  <span className="opacity-80">{(likes[m.id]?.length||0) > 0 ? `${likes[m.id].length} like(s)` : ''}</span>
                </div>
              </div>
            )})}
          </div>
          <form onSubmit={async(e)=>{e.preventDefault(); await send();}} className="p-3 border-t border-slate-800 grid grid-cols-[1fr_auto] gap-2">
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Message..." aria-label="Message" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 focus:ring-2 focus:ring-indigo-500/50" />
            <button className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-transform active:scale-[0.98]">Send</button>
          </form>
        </div>
        </>, document.body)
      }
      <style jsx global>{`
        @keyframes slidein { from { transform: translateX(20px); opacity: .0 } to { transform: translateX(0); opacity:1 } }
      `}</style>
    </div>
  )
}


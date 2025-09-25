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
  const [channels] = useState(DEFAULT_CHANNELS)
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Msg[]>>({})
  const [likes, setLikes] = useState<Record<string, Like[]>>({})
  const seenRef = useRef<Map<string, Set<string>>>(new Map())
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const eventRef = useRef<EventSource | null>(null)

  useEffect(() => {
    DEFAULT_CHANNELS.forEach(c => { if (!seenRef.current.has(c.id)) seenRef.current.set(c.id, new Set()) })
    const es = new EventSource(`/api/chat/stream?c=${encodeURIComponent(channelId)}`)
    eventRef.current = es
    es.addEventListener('message', (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data) as Msg
        const id = (msg.channelId || channelId)
        const seen = seenRef.current.get(id) || seenRef.current.get(channelId)!
        if (seen.has(msg.id)) return
        seen.add(msg.id)
        setMessagesByChannel(v=> ({ ...v, [id]: [...(v[id]||[]), msg] })); scrollDown()
      } catch {}
    })
    es.addEventListener('liked', (ev: MessageEvent) => {
      try { const lk = JSON.parse(ev.data) as Like; setLikes(v=> ({ ...v, [lk.messageId]: [...(v[lk.messageId]||[]), lk] })) } catch {}
    })
    return () => { es.close(); eventRef.current = null }
  }, [channelId])

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
      {createPortal(
        <>
          {open && <div className="fixed inset-0 z-[2147483646] bg-black/30" onClick={()=>setOpen(false)} />}
          <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] max-w-[100vw] bg-slate-950 text-slate-100 border-l border-slate-800 shadow-2xl grid grid-rows-[auto_1fr_auto] z-[2147483647] transition-transform duration-200 ease-out will-change-transform ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`} role="dialog" aria-label="Team chat">
            <div className="p-0 border-b border-slate-800">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-200 font-medium">Chat</div>
                  <label htmlFor="chat-channel" className="sr-only">Channel</label>
                  <select
                    id="chat-channel"
                    value={channelId}
                    onChange={e=>setChannelId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-100 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-300/50 hover:border-slate-600"
                  >
                    {channels.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={()=>setOpen(false)} aria-label="Close chat" className="relative h-8 w-8 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm">
                  <span aria-hidden className="block relative h-3 w-5">
                    <span className="absolute left-0 top-0 h-0.5 w-5 bg-slate-200 translate-y-1.5 rotate-45"></span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-5 bg-slate-200 -translate-y-1.5 -rotate-45"></span>
                  </span>
                </button>
              </div>
            </div>
            <div ref={listRef} className="overflow-y-auto p-3 space-y-2 text-sm bg-slate-950 tc-scroll">
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
                      <button
                        title="Delete"
                        aria-label="Delete message"
                        onClick={async()=>{ await fetch('/api/chat/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: m.id }) }); setMessagesByChannel(v=> ({ ...v, [channelId]: (v[channelId]||[]).filter(x=>x.id!==m.id) })) }}
                        className="px-1.5 py-0.5 rounded-md border border-slate-700 text-rose-300 hover:bg-rose-900/30 hover:border-rose-600 transition-colors"
                      >
                        🗑
                      </button>
                    </span>
                  </div>
                  <div className="text-slate-100 leading-relaxed">{m.text}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                    <button
                      aria-label="Like message"
                      onClick={async()=>{ await fetch('/api/chat/like', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messageId: m.id }) }) }}
                      className="px-1.5 py-0.5 rounded-md border border-rose-700/40 text-rose-300 hover:bg-rose-900/30 hover:border-rose-600 transition-colors leading-none"
                    >
                      ❤
                    </button>
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


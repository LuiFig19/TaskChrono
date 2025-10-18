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
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojis = useMemo(() => (
    '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 👍 👎 🙌 👏 🔥 ✅ ❌ ⭐ 🎉 ❤️ 🧡 💛 💚 💙 💜 🤍 🤎 🖤'
      .split(/\s+/)
  ), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEmojiOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    <div className="inline-block ml-2 z-[100] relative chat-panel">
      <button onClick={()=>setOpen(o=>!o)} aria-label="Open chat" className="relative h-9 w-9 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm light:border-[#D8DEE4] light:text-[#202124] light:bg-[#F5F7FA] light:hover:bg-[#E9ECF1]">
        <span className="text-base" aria-hidden>💬</span>
      </button>
      {createPortal(
        <>
          {open && <div className="fixed inset-0 z-[2147483646] bg-black/30" onClick={()=>setOpen(false)} />}
          <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] max-w-[100vw] bg-slate-950 text-slate-100 border-l border-slate-800 shadow-2xl grid grid-rows-[auto_1fr_auto] z-[2147483647] transition-transform duration-200 ease-out will-change-transform light:bg-[#FAFBFD] light:text-[#1B1D20] light:border-[#D8DEE4] ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`} role="dialog" aria-label="Team chat">
            <div className="p-0 border-b border-slate-800">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950 light:bg-[#FAFBFD]">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-200 font-medium light:text-[#1B1D20]">Chat</div>
                  <label htmlFor="chat-channel" className="sr-only">Channel</label>
                  <select
                    id="chat-channel"
                    value={channelId}
                    onChange={e=>setChannelId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-100 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-300/50 hover:border-slate-600 light:border-[#D8DEE4] light:bg-white light:text-[#202124]"
                  >
                    {channels.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={()=>setOpen(false)} aria-label="Close chat" className="relative h-8 w-8 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm light:bg-white light:border-[#D8DEE4] light:text-black light:hover:bg-[#F3F4F6]">
                  <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 text-black dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 3 L13 13" />
                    <path d="M13 3 L3 13" />
                  </svg>
                </button>
              </div>
            </div>
            <div ref={listRef} className="overflow-y-auto p-3 space-y-2 text-sm bg-slate-950 tc-scroll light:bg-[#FAFBFD]">
              {(messagesByChannel[channelId]||[]).map(m=> {
                const d = new Date(m.ts)
                const mm = String(d.getMonth()+1).padStart(2,'0')
                const dd = String(d.getDate()).padStart(2,'0')
                const yy = String(d.getFullYear()).slice(-2)
                const dateStr = `${mm}/${dd}/${yy}`
                const roleLabel = m.role || (m.channelId==='managers' ? 'Management' : 'Employee')
                return (
                <div key={m.id} className={`rounded-md border p-2 shadow-sm light:border-[#E2E8F0] light:bg-white light:shadow-[0_1px_4px_rgba(0,0,0,0.08)] ${channelId==='managers' ? 'border-rose-700 bg-rose-950/30' : 'border-slate-800 bg-slate-900'}`}>
                  <div className="text-slate-300 text-xs mb-0.5 flex items-center justify-between light:text-[#475569]">
                    <span>{m.user.name} ({roleLabel})</span>
                    <span className="opacity-80 flex items-center gap-2">
                      {dateStr}
                      <button
                        title="Delete"
                        aria-label="Delete message"
                        onClick={async()=>{ await fetch('/api/chat/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: m.id }) }); setMessagesByChannel(v=> ({ ...v, [channelId]: (v[channelId]||[]).filter(x=>x.id!==m.id) })) }}
                        className="px-1.5 py-0.5 rounded-md border border-slate-700 text-rose-300 hover:bg-rose-900/30 hover:border-rose-600 transition-colors light:all-[unset] light:text-[#EF4444] light:cursor-pointer light:outline-none"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4V5h4V4a1 1 0 0 1 1-1zm1 4v12h2V7h-2zm4 0v12h2V7h-2zM8 5v0h8V4H8v1z" /></svg>
                      </button>
                    </span>
                  </div>
                  <div className="text-slate-100 leading-relaxed light:text-[#1F2937]">{m.text}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                    <button
                      aria-label="Like message"
                      onClick={async()=>{ await fetch('/api/chat/like', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messageId: m.id }) }) }}
                      className="px-1.5 py-0.5 rounded-md border border-rose-700/40 text-rose-300 hover:bg-rose-900/30 hover:border-rose-600 transition-colors leading-none light:all-[unset] light:text-[#ef4444] light:cursor-pointer"
                    >
                      ❤️
                    </button>
                    <span className="opacity-80">{(likes[m.id]?.length||0) > 0 ? `${likes[m.id].length} like(s)` : ''}</span>
                  </div>
                </div>
              )})}
            </div>
            <form onSubmit={async(e)=>{e.preventDefault(); await send();}} className="p-3 border-t border-slate-800 grid grid-cols-[auto_1fr_auto] gap-2 relative light:border-[#D8DEE4] light:bg-[#FAFBFD]">
              <div className="relative">
                <button type="button" aria-label="Emoji" className="h-10 w-10 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 light:border-[#D8DEE4] light:bg-white light:text-[#202124] light:hover:bg-[#F3F4F6]" onClick={()=>setEmojiOpen(v=>!v)}>😊</button>
                {emojiOpen && (
                  <div className="absolute bottom-12 left-0 z-[2147483647] w-[320px] max-h-[260px] overflow-auto tc-scroll rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl light:border-[#D8DEE4] light:bg-white">
                    <div className="grid grid-cols-8 gap-1 text-lg">
                      {emojis.map((e,i)=> (
                        <button key={i} className="h-8 w-8 grid place-items-center rounded hover:bg-slate-800 light:hover:bg-[#F3F4F6]" onMouseDown={(ev)=>{ ev.preventDefault(); setText(t=>t + e); setEmojiOpen(false) }}>{e}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Message..." aria-label="Message" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 light:border-[#D8DEE4] light:bg-white light:text-[#1B1D20]" />
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


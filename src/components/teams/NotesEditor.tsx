"use client"
import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
// Lists are also available from StarterKit; to avoid extra deps, we’ll use StarterKit’s list features
// Bold/Italic/History are provided by StarterKit
// We will fall back to HTML serialize/parse since the Markdown extension isn't available in deps

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export type NotesEditorHandle = {
  getMarkdown: () => string
  insertEmoji: (emoji: string) => void
}

export default forwardRef<NotesEditorHandle, { initialMarkdown: string; onEmojiClick?: () => void }>(function NotesEditor(
  { initialMarkdown },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
    ],
    content: initialMarkdown || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  // Force React to re-render toolbar when editor state changes so isActive() reflects current marks
  const [, setTick] = React.useState(0)
  useEffect(() => {
    if (!editor) return
    const rerender = () => setTick((x) => x + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    editor.on('update', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
      editor.off('update', rerender)
    }
  }, [editor])

  useEffect(() => {
    if (editor && typeof initialMarkdown === 'string') {
      // Update content on note switch; do not push into history
      editor.commands.setContent(initialMarkdown || '', false)
    }
  }, [initialMarkdown, editor])

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      // Without Markdown extension available, return HTML as a fallback
      return editor?.getHTML?.() || ''
    },
    insertEmoji: (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run()
    },
  }))

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
          className={cn('px-2 py-1 rounded-md border text-sm transition-colors', editor?.isActive('bold') ? 'bg-green-600/20 border-green-500 text-green-300' : 'border-slate-700 hover:bg-slate-800')}
        >
          Bold
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }}
          className={cn('px-2 py-1 rounded-md border text-sm transition-colors', editor?.isActive('italic') ? 'bg-green-600/20 border-green-500 text-green-300' : 'border-slate-700 hover:bg-slate-800')}
        >
          Italic
        </button>
        {/* Emoji picker anchored to this button */}
        <EmojiButton editorInsert={(emoji)=> editor?.chain().focus().insertContent(emoji).run()} />
      </div>
      <div className="rounded-xl bg-black/20 border border-white/5 p-3 h-96 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})


function EmojiButton({ editorInsert }: { editorInsert: (emoji: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const emojis = React.useMemo(() => (
    '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 💀 ☠️ 👻 👽 🤖 🎃 💩 🙈 🙉 🙊 💘 💝 💖 💗 💓 💞 💕 💌 💟 👍 👎 🙌 👏 🔥 ✅ ❌ ⭐ 🌟 ✨ ⚡ 🎉 🥳 ❤️ 🧡 💛 💚 💙 💜 🤍 🤎 🖤'
      .split(/\s+/)
  ), [])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v=>!v) }}
        className="px-2 py-1 rounded-md border border-slate-700 text-sm hover:bg-slate-800"
        aria-label="Insert emoji"
      >
        😃 Emoji
      </button>
      {open && (
        <div className="absolute z-[1000] mt-2 left-0 w-[340px] max-h-[260px] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
          <div className="grid grid-cols-8 gap-1 text-lg">
            {emojis.map((e, i) => (
              <button
                key={i}
                className="h-8 w-8 grid place-items-center rounded hover:bg-slate-800"
                onMouseDown={(ev) => { ev.preventDefault(); editorInsert(e); setOpen(false) }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



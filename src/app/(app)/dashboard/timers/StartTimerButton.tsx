"use client"

import React, { useRef } from 'react'
import { startTimer } from './actions'

export default function StartTimerButton({ disabled }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form ref={formRef} action={startTimer} className="inline">
      <input ref={inputRef} type="hidden" name="name" />
      <input type="hidden" name="timerId" />
      <button
        type="button"
        disabled={disabled}
        className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        onClick={() => {
          const name = window.prompt('Name this timer:')?.trim()
          if (!name) return
          if (inputRef.current) inputRef.current.value = name
          if (formRef.current) formRef.current.requestSubmit()
        }}
      >
        Start Timer
      </button>
    </form>
  )
}



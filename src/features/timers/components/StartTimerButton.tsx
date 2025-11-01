'use client';

import { useRef, useState } from 'react';

import { startTimer } from '@/app/(app)/dashboard/timers/actions';

export default function StartTimerButton({ disabled }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <>
      <form ref={formRef} action={startTimer} className="inline">
        <input ref={inputRef} type="hidden" name="name" />
        <input type="hidden" name="timerId" />
        <button
          type="button"
          disabled={disabled}
          className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          onClick={() => {
            setName('');
            setOpen(true);
          }}
        >
          + Add Timer
        </button>
      </form>
      {open && (
        <div className="fixed inset-0 z-[100000]">
          <div
            className="absolute inset-0 bg-slate-950/90"
            onClick={() => !busy && setOpen(false)}
          />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Create Timer</div>
              <div className="text-sm text-slate-400 mt-1">
                Name your timer to keep things organized.
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputRef.current) inputRef.current.value = name || 'Timer';
                  setBusy(true);
                  if (formRef.current) formRef.current.requestSubmit();
                  setBusy(false);
                  setOpen(false);
                  document.dispatchEvent(new CustomEvent('tc:timer:changed'));
                }}
                className="mt-4 grid gap-3"
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Timer name"
                  className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => !busy && setOpen(false)}
                    className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-transform active:scale-[0.98]"
                  >
                    {busy ? 'Starting…' : 'Start'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


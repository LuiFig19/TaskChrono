"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registerLocalAction, type RegisterState } from "./actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-2 w-full px-5 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-lg shadow-indigo-500/30"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export default function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useFormState<RegisterState, FormData>(registerLocalAction as any, {});

  // Clear password field after each attempt
  React.useEffect(() => {
    const el = document.querySelector<HTMLInputElement>('input[name="password"]');
    if (el) el.value = "";
  }, [state?.error]);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm text-slate-300">Name (optional)</span>
        <input name="name" type="text" placeholder="John Doe" className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-slate-300">Email</span>
        <input name="email" type="email" placeholder="you@company.com" required className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-slate-300">Password</span>
        <input name="password" type="password" placeholder="••••••••" required className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
      </label>

      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      {state?.error ? (
        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
          {state.error}
        </div>
      ) : null}

      <SubmitBtn />
    </form>
  );
}



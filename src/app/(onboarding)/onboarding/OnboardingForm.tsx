"use client";

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createOrganizationAction, type OnboardingState } from './actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
      {pending ? 'Continuing…' : 'Continue'}
    </button>
  );
}

export default function OnboardingForm({ plan }: { plan: string }) {
  const [state, formAction] = useFormState<OnboardingState, FormData>(createOrganizationAction as any, {});
  return (
    <form className="mt-6 grid gap-5" action={formAction}>
      <label className="grid gap-1">
        <span className="text-sm text-slate-300">Organization name</span>
        <input className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" name="name" placeholder="Acme Inc" required />
      </label>
      <div className="grid gap-1">
        <span className="text-sm text-slate-300">Invite teammates (optional)</span>
        <input className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-3 py-2" name="emails" placeholder="name1@company.com, name2@company.com" />
        <span className="text-xs text-slate-400">We’ll send email invites after setup. You can manage roles in Settings.</span>
      </div>
      <input type="hidden" name="plan" value={plan} />
      {state?.error ? (
        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">{state.error}</div>
      ) : null}
      <div className="flex items-center gap-3">
        <SubmitBtn />
      </div>
    </form>
  );
}



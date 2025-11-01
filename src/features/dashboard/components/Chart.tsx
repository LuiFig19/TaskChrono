'use client';

export default function Chart({ demo }: { demo?: boolean }) {
  return (
    <div className="h-40 w-full rounded-md bg-slate-800/70 border border-slate-700 text-slate-300 flex items-center justify-center">
      {demo ? 'Chart (demo)' : 'Chart'}
    </div>
  );
}


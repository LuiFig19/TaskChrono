'use client';

export default function MonthGrid({
  events,
  baseDate,
  onSelect,
}: {
  events: Array<{ title: string; startsAt: string; description?: string | null }>;
  baseDate: string;
  onSelect: (value: string) => void;
}) {
  const d = new Date(baseDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const clsMap: Record<string, { bg: string; ring: string }> = {
    meeting: { bg: 'bg-blue-500/30', ring: 'ring-blue-400/60' },
    release: { bg: 'bg-lime-500/30', ring: 'ring-lime-400/60' },
    invoice: { bg: 'bg-rose-500/30', ring: 'ring-rose-400/60' },
    review: { bg: 'bg-violet-500/30', ring: 'ring-violet-400/60' },
    demo: { bg: 'bg-teal-500/30', ring: 'ring-teal-400/60' },
    deadline: { bg: 'bg-amber-500/30', ring: 'ring-amber-400/60' },
    personal: { bg: 'bg-emerald-500/30', ring: 'ring-emerald-400/60' },
    urgent: { bg: 'bg-red-600/30', ring: 'ring-red-500/60' },
    general: { bg: 'bg-fuchsia-500/30', ring: 'ring-fuchsia-400/60' },
  };
  const getMeta = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    const dayEvents = (events || []).filter(
      (e: any) => new Date(e.startsAt).toDateString() === dateStr,
    );
    if (dayEvents.length === 0) return null;
    const items = dayEvents.map((e: any) => {
      let parsed: any = {};
      try {
        parsed = e.description ? JSON.parse(e.description) : {};
      } catch {}
      const category: string = String(parsed.category || 'general').toLowerCase();
      const time = new Date(e.startsAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { title: e.title, time, category };
    });
    const primaryCategory = items[0]?.category || 'general';
    return { items, category: primaryCategory };
  };
  return (
    <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
      {Array.from({ length: daysInMonth }).map((_, idx) => {
        const day = idx + 1;
        const meta = getMeta(day);
        const val = `${year}-${pad(month + 1)}-${pad(day)}T09:00`;
        return (
          <button
            key={`mday-${day}`}
            onClick={() => onSelect(val)}
            className={`relative group block py-2 rounded-lg border transition-colors ${meta ? `ring-1 ${clsMap[(meta.category || 'general') as keyof typeof clsMap]?.bg} ${clsMap[(meta.category || 'general') as keyof typeof clsMap]?.ring} dark:text-white light:text-[#202124]` : 'border-slate-700 bg-slate-800/60 text-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 light:border-[#E0E6ED] light:bg-white light:text-[#4A4A4A] light:hover:bg-[#F1F3F6]'}`}
            aria-label={
              meta
                ? `${day}: ${meta.items.map((i: any) => `${i.title} ${i.time}`).join(', ')}`
                : String(day)
            }
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}


type Labels = { route: string; method: string; status: number };

const counters = new Map<string, number>();
const durations: Array<{ route: string; method: string; ms: number }> = [];

function key(name: string, l: Labels) {
  return `${name}{route="${l.route}",method="${l.method}",status="${l.status}"}`;
}

export function recordRequest(l: Labels) {
  const k = key('tc_requests_total', l);
  counters.set(k, (counters.get(k) || 0) + 1);
}

export function recordError(l: Labels) {
  const k = key('tc_errors_total', l);
  counters.set(k, (counters.get(k) || 0) + 1);
}

export function recordDuration(route: string, method: string, ms: number) {
  durations.push({ route, method, ms });
  if (durations.length > 5000) durations.splice(0, durations.length - 5000);
}

export function formatPrometheus(): string {
  let out = '';
  for (const [k, v] of counters.entries()) out += `${k} ${v}\n`;
  // simple duration summary per route/method
  const groups = new Map<string, number[]>();
  for (const d of durations) {
    const k = `tc_request_duration_ms_sum{route="${d.route}",method="${d.method}"}`;
    const c = groups.get(k) || [];
    c.push(d.ms);
    groups.set(k, c);
  }
  for (const [k, arr] of groups.entries()) {
    const sum = arr.reduce((a, b) => a + b, 0);
    const count = arr.length;
    out += `${k} ${sum}\n`;
    out += `${k.replace('_sum', '_count')} ${count}\n`;
  }
  return out;
}



// Simple in-memory subscriber registry for timer SSE
type Subscriber = {
  id: string
  userId: string
  write: (line: string) => void
}

type TimerStore = {
  subs: Map<string, Set<Subscriber>> // key = userId
}

const g = globalThis as any
if (!g.__timerStore) {
  g.__timerStore = { subs: new Map() } as TimerStore
}

export const timerStore: TimerStore = g.__timerStore as TimerStore

export function broadcastTimer(userId: string, event: string, data: any) {
  const set = timerStore.subs.get(userId)
  if (!set) return
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const s of set) s.write(payload)
}

export function addTimerSubscriber(sub: Subscriber) {
  let set = timerStore.subs.get(sub.userId)
  if (!set) { set = new Set(); timerStore.subs.set(sub.userId, set) }
  set.add(sub)
}

export function removeTimerSubscriber(sub: Subscriber) {
  const set = timerStore.subs.get(sub.userId)
  if (!set) return
  set.delete(sub)
  if (set.size === 0) timerStore.subs.delete(sub.userId)
}








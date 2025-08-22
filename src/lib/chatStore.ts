// Simple in-memory subscriber registry for Server-Sent Events
// Persisted across hot reloads using globalThis

type Subscriber = {
  id: string
  orgId: string
  channelId: string
  write: (line: string) => void
}

type ChatStore = {
  subs: Map<string, Set<Subscriber>> // key = `${orgId}:${channelId}`
}

const g = globalThis as any
if (!g.__chatStore) {
  g.__chatStore = { subs: new Map() } as ChatStore
}

export const chatStore: ChatStore = g.__chatStore as ChatStore

export function broadcast(orgId: string, channelId: string, event: string, data: any) {
  const key = `${orgId}:${channelId}`
  const set = chatStore.subs.get(key)
  if (!set) return
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const s of set) s.write(payload)
}

export function addSubscriber(sub: Subscriber) {
  const key = `${sub.orgId}:${sub.channelId}`
  let set = chatStore.subs.get(key)
  if (!set) { set = new Set(); chatStore.subs.set(key, set) }
  set.add(sub)
}

export function removeSubscriber(sub: Subscriber) {
  const key = `${sub.orgId}:${sub.channelId}`
  const set = chatStore.subs.get(key)
  if (!set) return
  set.delete(sub)
  if (set.size === 0) chatStore.subs.delete(key)
}


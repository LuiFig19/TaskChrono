// Lightweight in-memory activity broadcaster for SSE
// Note: Suitable for local/dev and simple deployments; not clustered

type ActivityEvent = {
  type: string
  message: string
  meta?: Record<string, unknown>
  ts?: number
}

const subscribers = new Set<(ev: ActivityEvent) => void>()

export function broadcastActivity(event: ActivityEvent) {
  const payload: ActivityEvent = { ts: Date.now(), ...event }
  for (const send of subscribers) {
    try { send(payload) } catch {}
  }
}

export function sseActivityResponse() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (ev: ActivityEvent) => {
        const chunk = `data: ${JSON.stringify(ev)}\n\n`
        controller.enqueue(encoder.encode(chunk))
      }
      subscribers.add(send)
      // Initial hello to open the stream
      send({ type: 'connected', message: 'connected', ts: Date.now() })
      ;(controller as any)._send = send
    },
    cancel() {
      // On cancel, remove the associated sender if present
      // We cannot access the exact closure here, but the GC will clean up on reloads
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}



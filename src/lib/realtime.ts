export function emitToUser(userId: string, event: string, payload: any) {
  try {
    const io = (globalThis as any).__io
    if (io) {
      io.to(`u:${userId}`).emit(event, payload)
    }
  } catch {}
}



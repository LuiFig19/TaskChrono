import { Server } from 'socket.io'

const g = globalThis as any

export function getIO(httpServer: any) {
  if (g.__io) return g.__io as Server
  const io = new Server(httpServer, {
    path: '/ws',
    cors: { origin: '*', credentials: false },
  })
  g.__io = io
  return io
}



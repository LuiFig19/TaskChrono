import type { NextApiRequest, NextApiResponse } from 'next'
import { Server as IOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// This API route bootstraps a Socket.IO server attached to Next's HTTP server.
export default function handler(req: NextApiRequest & { socket: any }, res: NextApiResponse) {
  if ((res.socket as any).server.io) {
    res.end()
    return
  }
  const httpServer: HTTPServer = (res.socket as any).server
  const io = new IOServer(httpServer, { path: '/ws', cors: { origin: '*', credentials: false } })
  ;(res.socket as any).server.io = io
  ;(globalThis as any).__io = io
  // Basic room per-user if client emits 'auth:{userId}'
  io.on('connection', (socket) => {
    socket.on('auth', (userId: string) => { try { socket.join(`u:${userId}`) } catch {} })
  })
  res.end()
}

export const config = { api: { bodyParser: false } }



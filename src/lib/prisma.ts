import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

const runtimeDbUrl = process.env.DATABASE_URL

function isLocalDevNoDb(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const url = runtimeDbUrl || ''
  // Heuristic: default localhost creds likely not running
  // Allow app to run for UI demo without DB by catching connection at first query instead
  return !url || /postgresql:\/\/postgres:postgres@localhost:5432\/.*/i.test(url)
}

export const prisma: PrismaClient =
  global.prismaGlobal ||
  (isLocalDevNoDb()
    ? (new Proxy({} as PrismaClient, {
        get(_t, prop) {
          // Throw a clear error only when DB is actually needed
          throw new Error(
            `Database not configured. Set DATABASE_URL in .env.local and run migrations. Tried to access prisma.${String(prop)}.`
          )
        },
      }) as unknown as PrismaClient)
    : (runtimeDbUrl
        ? new PrismaClient({ datasources: { db: { url: runtimeDbUrl } } })
        : new PrismaClient()))

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}



import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

function ensureSchemaParam(url: string | undefined): string | undefined {
  if (!url) return url
  if (/[?&]schema=/.test(url)) return url
  return url + (url.includes('?') ? '&' : '?') + 'schema=taskchrono'
}

const runtimeDbUrl = ensureSchemaParam(process.env.DATABASE_URL)

export const prisma: PrismaClient =
  global.prismaGlobal ||
  (runtimeDbUrl
    ? new PrismaClient({ datasources: { db: { url: runtimeDbUrl } } })
    : new PrismaClient())

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}



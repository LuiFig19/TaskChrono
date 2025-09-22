import { sseActivityResponse } from '@/lib/activity'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  return sseActivityResponse()
}

import { sseActivityResponse } from '@/lib/activity';
import { withErrorHandling } from '@/lib/route-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export const GET = withErrorHandling(async () => {
  return sseActivityResponse();
});

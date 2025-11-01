import { NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async () => {
  return NextResponse.json({ status: 'ok', app: 'taskchrono' });
});

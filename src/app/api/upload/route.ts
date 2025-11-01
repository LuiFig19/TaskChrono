import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: Request) => {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filename = `${Date.now()}_${safeName}`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, name: file.name });
  } catch (e: any) {
    // Likely not writable in serverless environments; return a graceful error
    return NextResponse.json({ error: 'Upload not available on this host' }, { status: 400 });
  }
});

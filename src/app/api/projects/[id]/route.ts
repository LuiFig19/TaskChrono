import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const PATCH = withErrorHandling(
  async (request: Request, { params }: { params: { id: string } }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string | null;
      status?: string;
      budgetCents?: number;
    };

    // Normalize status values from UI labels (e.g. "ON HOLD") to enum values ("ON_HOLD")
    let status: string | undefined = undefined;
    if (typeof body.status === 'string' && body.status.trim()) {
      const raw = body.status.trim().toUpperCase().replace(/\s+/g, '_');
      // Map common synonyms
      const normalized = raw === 'IN_PROGRESS' ? 'ACTIVE' : raw;
      const allowed = new Set(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);
      status = allowed.has(normalized) ? normalized : undefined;
    }

    const proj = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim() || undefined,
        description: body.description === undefined ? undefined : body.description?.trim() || null,
        status: status as any,
        estimatedBudgetCents:
          typeof body.budgetCents === 'number'
            ? Math.max(0, Math.floor(body.budgetCents))
            : undefined,
      },
    });
    return NextResponse.json({ ok: true, id: proj.id });
  },
);

export const DELETE = withErrorHandling(
  async (_request: Request, { params }: { params: { id: string } }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  },
);

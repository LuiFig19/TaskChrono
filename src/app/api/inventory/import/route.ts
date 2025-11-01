import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

async function getActiveOrganizationId(userId: string) {
  const membership = await prisma.organizationMember.findFirst({ where: { userId } });
  if (membership?.organizationId) return membership.organizationId;
  const existingOrg = await prisma.organization.findFirst({ where: { createdById: userId } });
  const org =
    existingOrg ||
    (await prisma.organization.create({ data: { name: 'Personal', createdById: userId } }));
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId } },
    update: {},
    create: { organizationId: org.id, userId, role: 'OWNER' as any },
  });
  return org.id;
}

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const organizationId = await getActiveOrganizationId(userId);
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, organizationId },
  });
  const role = membership?.role as string | undefined;
  if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const [header, ...rows] = lines;
  const cols = header.split(',').map((s) => s.trim().toLowerCase());
  // Expected logical fields; we'll support mapping by header names present
  const toCents = (v: string) => Math.round(parseFloat(v.replace(/[^\d.\-]/g, '')) * 100) || 0;

  const errors: { line: number; message: string }[] = [];
  let processed = 0;
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (!row.trim()) continue;
    const parts = row.split(',');
    const rec: Record<string, string> = {};
    cols.forEach((c, cidx) => (rec[c] = (parts[cidx] || '').trim()));
    const name = (rec['name'] || '').trim();
    if (!name) {
      errors.push({ line: idx + 2, message: 'Missing name' });
      continue;
    }
    const sku = (rec['sku'] || name).trim();
    const quantity = Number(rec['quantity'] || '0');
    const minQuantity = Number(rec['minquantity'] || '0');
    if (!Number.isFinite(quantity) || quantity < 0) {
      errors.push({ line: idx + 2, message: 'Invalid quantity' });
      continue;
    }
    if (!Number.isFinite(minQuantity) || minQuantity < 0) {
      errors.push({ line: idx + 2, message: 'Invalid minQuantity' });
      continue;
    }

    // Upsert category/supplier by name if provided
    let categoryId: string | undefined;
    if (rec['category']) {
      const cat = await prisma.inventoryCategory.upsert({
        where: { organizationId_name: { organizationId, name: rec['category'] } },
        update: {},
        create: { organizationId, name: rec['category'] },
      });
      categoryId = cat.id;
    }
    let supplierId: string | undefined;
    if (rec['supplier']) {
      const sup = await prisma.supplier.upsert({
        where: { organizationId_name: { organizationId, name: rec['supplier'] } },
        update: {},
        create: { organizationId, name: rec['supplier'] },
      });
      supplierId = sup.id;
    }

    await prisma.inventoryItem.upsert({
      where: { organizationId_sku: { organizationId, sku } },
      update: {
        name,
        description: rec['description'] || null,
        quantity,
        minQuantity,
        costCents: toCents(rec['cost'] || '0'),
        priceCents: toCents(rec['price'] || '0'),
        barcode: rec['barcode'] || null,
        categoryId,
        supplierId,
        updatedById: userId,
      },
      create: {
        organizationId,
        name,
        sku,
        description: rec['description'] || null,
        quantity,
        minQuantity,
        costCents: toCents(rec['cost'] || '0'),
        priceCents: toCents(rec['price'] || '0'),
        barcode: rec['barcode'] || null,
        categoryId,
        supplierId,
        createdById: userId,
        updatedById: userId,
      },
    });
    processed++;
  }
  await prisma.inventoryActivity.create({
    data: {
      organizationId,
      itemId: (await prisma.inventoryItem.findFirst({
        where: { organizationId },
        select: { id: true },
      }))!.id,
      userId,
      type: 'IMPORT',
      message: `Imported ${processed} row(s)`,
    },
  });
  return NextResponse.json({ ok: true, processed, errors });
});

import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { makeKey, withCache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitIdentifierFromRequest, tooManyResponse } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/route-helpers';

import { buildOrderBy, parseInventoryQuery } from './_query';

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

export const GET = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const organizationId = await getActiveOrganizationId(userId);
  const q = parseInventoryQuery(request.url);

  // Base where for text/category/supplier filters (status handled below if needed)
  const where: any = { organizationId };
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: 'insensitive' } },
      { sku: { contains: q.q, mode: 'insensitive' } },
    ];
  }
  if (q.category) where.category = { name: { equals: q.category } };
  if (q.supplier) where.supplier = { name: { equals: q.supplier } };

  // If status filter is present, we cannot express it with Prisma field-to-field comparison.
  // We'll fetch a slightly larger window and filter in-memory to preserve correctness
  // while keeping performance stable for typical page sizes.
  const orderBy = buildOrderBy(q);
  const skip = (q.page! - 1) * q.pageSize!;
  const take = q.pageSize!;

  // Count without status filter first, then adjust if status used by computing in memory
  const rl = await rateLimit(rateLimitIdentifierFromRequest(request), 120, 60);
  if (!rl.allowed) return tooManyResponse();

  const keyItems = makeKey([
    'inv:list',
    organizationId,
    q.q || '-',
    q.category || '-',
    q.supplier || '-',
    q.status || '-',
    q.page!,
    q.pageSize!,
    JSON.stringify(orderBy),
  ]);

  const [baseTotal, baseItems] = await withCache(keyItems, 10, async () => {
    const total = await prisma.inventoryItem.count({ where });
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: take * 2,
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        minQuantity: true,
        costCents: true,
        priceCents: true,
        barcode: true,
        updatedAt: true,
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });
    return [total, items] as const;
  });

  const mapped = baseItems.map((i) => ({
    id: i.id,
    name: i.name,
    sku: i.sku ?? null,
    category: i.category?.name ?? null,
    supplier: i.supplier?.name ?? null,
    quantity: i.quantity,
    minQuantity: i.minQuantity,
    costCents: i.costCents,
    priceCents: i.priceCents,
    barcode: i.barcode ?? null,
    updatedAt: i.updatedAt,
  }));

  const statusFiltered = q.status
    ? mapped.filter((i) => {
        if (q.status === 'out') return i.quantity <= 0;
        if (q.status === 'low') return i.quantity > 0 && i.quantity <= i.minQuantity;
        return i.quantity > i.minQuantity;
      })
    : mapped;

  const paged = statusFiltered.slice(0, take);
  let total = q.status ? statusFiltered.length + skip : baseTotal;

  // Distinct category/supplier options for dropdowns
  const [categoryNames, supplierNames] = await withCache(
    makeKey(['inv:meta', organizationId]),
    60,
    async () =>
      Promise.all([
        prisma.inventoryCategory.findMany({
          where: { organizationId },
          select: { name: true },
          orderBy: { name: 'asc' },
        }),
        prisma.supplier.findMany({
          where: { organizationId },
          select: { name: true },
          orderBy: { name: 'asc' },
        }),
      ]),
  );

  // Summary
  let totalItems = total;
  let inventoryValueCents = 0;
  let lowStockCount = 0;
  if (q.includeTotals) {
    // Compute totals across filtered set; over-fetch a larger window for approximation if status filter present.
    // For correctness, fetch all filtered ids but cap at 100k to avoid excessive memory.
    const allForTotals = await prisma.inventoryItem.findMany({
      where,
      select: { id: true, quantity: true, minQuantity: true, costCents: true },
      take: 100000,
    });
    const filteredForTotals = q.status
      ? allForTotals.filter((i) => {
          if (q.status === 'out') return i.quantity <= 0;
          if (q.status === 'low') return i.quantity > 0 && i.quantity <= i.minQuantity;
          return i.quantity > i.minQuantity;
        })
      : allForTotals;
    inventoryValueCents = filteredForTotals.reduce((sum, i) => sum + i.quantity * i.costCents, 0);
    lowStockCount = filteredForTotals.reduce(
      (n, i) => n + (i.quantity > 0 && i.quantity <= i.minQuantity ? 1 : 0),
      0,
    );
    totalItems = filteredForTotals.length;
    if (q.status) total = totalItems;
  }

  const res = NextResponse.json({
    items: paged,
    meta: {
      total,
      page: q.page,
      pageSize: q.pageSize,
      categories: categoryNames.map((c) => c.name),
      suppliers: supplierNames.map((s) => s.name),
      summary: q.includeTotals ? { totalItems, inventoryValueCents, lowStockCount } : undefined,
    },
  });
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.headers.set(k, v));
  return res;
});

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const organizationId = await getActiveOrganizationId(userId);
  const body = (await request.json().catch(() => ({}))) as any;
  // Role-based permissions: only ADMIN/MANAGER can write
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, organizationId },
  });
  const role = membership?.role as string | undefined;
  if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Validation
  if (!body.name?.trim()) return error;
  if (body.quantity != null && !Number.isFinite(body.quantity)) return error;
  if (body.minQuantity != null && !Number.isFinite(body.minQuantity)) return error;
  if (body.costCents != null && !Number.isFinite(body.costCents)) return error;
  if (body.priceCents != null && !Number.isFinite(body.priceCents)) return error;

  // Optional category/supplier upsert by name
  let categoryId: string | undefined = undefined;
  if (typeof body.categoryName === 'string' && body.categoryName.trim()) {
    const cat = await prisma.inventoryCategory.upsert({
      where: { organizationId_name: { organizationId, name: body.categoryName.trim() } },
      update: {},
      create: { organizationId, name: body.categoryName.trim() },
    });
    categoryId = cat.id;
  }
  let supplierId: string | undefined = undefined;
  if (typeof body.supplierName === 'string' && body.supplierName.trim()) {
    const sup = await prisma.supplier.upsert({
      where: { organizationId_name: { organizationId, name: body.supplierName.trim() } },
      update: {},
      create: { organizationId, name: body.supplierName.trim() },
    });
    supplierId = sup.id;
  }

  // SKU uniqueness per org
  if (body.sku?.trim()) {
    const exists = await prisma.inventoryItem.findFirst({
      where: { organizationId, sku: body.sku.trim() },
      select: { id: true },
    });
    if (exists) return error;
  }
  const created = await prisma.inventoryItem.create({
    data: {
      organizationId,
      name: body.name.trim(),
      sku: body.sku?.trim() || null,
      description: body.description?.trim() || null,
      quantity: Number.isFinite(body.quantity) ? body.quantity : 0,
      minQuantity: Number.isFinite(body.minQuantity) ? body.minQuantity : 0,
      costCents: Number.isFinite(body.costCents) ? body.costCents : 0,
      priceCents: Number.isFinite(body.priceCents) ? body.priceCents : 0,
      barcode: body.barcode?.trim() || null,
      categoryId,
      supplierId,
      createdById: userId,
      updatedById: userId,
    },
    select: { id: true },
  });
  await prisma.inventoryActivity.create({
    data: { organizationId, itemId: created.id, userId, type: 'CREATE', message: 'Item created' },
  });
  return NextResponse.json({ id: created.id });
});

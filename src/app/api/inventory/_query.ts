import { Prisma } from '@prisma/client';

export type InventorySortField =
  | 'name'
  | 'sku'
  | 'category'
  | 'supplier'
  | 'quantity'
  | 'minQuantity'
  | 'costCents'
  | 'priceCents'
  | 'updatedAt';

export type InventoryQuery = {
  q?: string;
  category?: string;
  supplier?: string;
  status?: 'in' | 'low' | 'out';
  sort?: InventorySortField;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeTotals?: boolean;
  includeMeta?: boolean;
};

export function parseInventoryQuery(url: string): InventoryQuery {
  const p = new URL(url).searchParams;
  const q = (p.get('q') || '').trim() || undefined;
  const category = (p.get('category') || '').trim() || undefined;
  const supplier = (p.get('supplier') || '').trim() || undefined;
  const statusParam = (p.get('status') || '').trim();
  const status =
    statusParam === 'in' || statusParam === 'low' || statusParam === 'out'
      ? statusParam
      : undefined;
  const sortRaw = (p.get('sort') || '').trim() as InventorySortField;
  const sort: InventorySortField | undefined = (
    [
      'name',
      'sku',
      'category',
      'supplier',
      'quantity',
      'minQuantity',
      'costCents',
      'priceCents',
      'updatedAt',
    ] as InventorySortField[]
  ).includes(sortRaw)
    ? sortRaw
    : undefined;
  const orderRaw = (p.get('order') || '').trim().toLowerCase();
  const order: 'asc' | 'desc' | undefined =
    orderRaw === 'asc' || orderRaw === 'desc' ? orderRaw : undefined;
  const page = Math.max(1, Number(p.get('page') || '1') || 1);
  const pageSize = Math.min(200, Math.max(1, Number(p.get('pageSize') || '25') || 25));
  const includeTotals = p.get('includeTotals') === '1';
  const includeMeta = p.get('includeMeta') === '1';
  return { q, category, supplier, status, sort, order, page, pageSize, includeTotals, includeMeta };
}

// Note: status filter (in/low/out) is applied post-query since Prisma cannot compare two columns directly

export function buildOrderBy(
  query: InventoryQuery,
): Prisma.InventoryItemOrderByWithRelationInput[] {
  const order: 'asc' | 'desc' = query.order || 'asc';
  switch (query.sort) {
    case 'category':
      return [{ category: { name: order } }, { name: 'asc' }];
    case 'supplier':
      return [{ supplier: { name: order } }, { name: 'asc' }];
    case 'sku':
      return [{ sku: order }, { name: 'asc' }];
    case 'quantity':
      return [{ quantity: order }, { name: 'asc' }];
    case 'minQuantity':
      return [{ minQuantity: order }, { name: 'asc' }];
    case 'costCents':
      return [{ costCents: order }, { name: 'asc' }];
    case 'priceCents':
      return [{ priceCents: order }, { name: 'asc' }];
    case 'updatedAt':
      return [{ updatedAt: order }];
    case 'name':
    default:
      return [{ name: order }];
  }
}

export function computeStatus(quantity: number, minQuantity: number): 'in' | 'low' | 'out' {
  if (quantity <= 0) return 'out';
  if (quantity <= minQuantity) return 'low';
  return 'in';
}

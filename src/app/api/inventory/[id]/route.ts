import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
	const { error, userId } = await requireApiAuth()
	if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const body = await request.json().catch(() => ({})) as any
  const role = (session.user as any).role as string | undefined
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validation & sanitization
  if (body.quantity != null && !Number.isFinite(body.quantity)) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  if (body.minQuantity != null && !Number.isFinite(body.minQuantity)) return NextResponse.json({ error: 'Invalid minQuantity' }, { status: 400 })
  if (body.costCents != null && !Number.isFinite(body.costCents)) return NextResponse.json({ error: 'Invalid cost' }, { status: 400 })
  if (body.priceCents != null && !Number.isFinite(body.priceCents)) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

  // Enforce SKU uniqueness per org if updating SKU
  if (typeof body.sku === 'string' && body.sku.trim()) {
    const existing = await prisma.inventoryItem.findUnique({ where: { id: params.id }, select: { organizationId: true } })
    if (existing) {
      const conflict = await prisma.inventoryItem.findFirst({ where: { organizationId: existing.organizationId, sku: body.sku.trim(), NOT: { id: params.id } }, select: { id: true } })
      if (conflict) return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }
  }

	// Optional category/supplier upsert by name
	let categoryId: string | undefined = undefined
	if (typeof body.categoryName === 'string' && body.categoryName.trim()) {
		const existing = await prisma.inventoryItem.findUnique({ where: { id: params.id }, select: { organizationId: true } })
		if (existing) {
			const cat = await prisma.inventoryCategory.upsert({
				where: { organizationId_name: { organizationId: existing.organizationId, name: body.categoryName.trim() } },
				update: {},
				create: { organizationId: existing.organizationId, name: body.categoryName.trim() },
			})
			categoryId = cat.id
		}
	}
	let supplierId: string | undefined = undefined
	if (typeof body.supplierName === 'string' && body.supplierName.trim()) {
		const existing = await prisma.inventoryItem.findUnique({ where: { id: params.id }, select: { organizationId: true } })
		if (existing) {
			const sup = await prisma.supplier.upsert({
				where: { organizationId_name: { organizationId: existing.organizationId, name: body.supplierName.trim() } },
				update: {},
				create: { organizationId: existing.organizationId, name: body.supplierName.trim() },
			})
			supplierId = sup.id
		}
	}

	const item = await prisma.inventoryItem.update({
		where: { id: params.id },
		data: {
			name: body.name?.trim(),
			sku: body.sku?.trim(),
			description: body.description?.trim(),
			quantity: Number.isFinite(body.quantity) ? body.quantity : undefined,
			minQuantity: Number.isFinite(body.minQuantity) ? body.minQuantity : undefined,
			costCents: Number.isFinite(body.costCents) ? body.costCents : undefined,
			priceCents: Number.isFinite(body.priceCents) ? body.priceCents : undefined,
			barcode: body.barcode?.trim(),
			categoryId,
			supplierId,
			updatedById: userId,
		},
		select: { id: true },
	})
	await prisma.inventoryActivity.create({ data: { organizationId: (await prisma.inventoryItem.findUnique({ where: { id: params.id }, select: { organizationId: true } }))!.organizationId, itemId: params.id, userId, type: 'UPDATE', message: 'Item updated' }})
	return NextResponse.json({ id: item.id })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
	const { error, userId } = await requireApiAuth()
	if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const role = (session.user as any).role as string | undefined
	if (role !== 'ADMIN' && role !== 'MANAGER') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}
	const item = await prisma.inventoryItem.delete({ where: { id: params.id }, select: { id: true, organizationId: true } })
	await prisma.inventoryActivity.create({ data: { organizationId: item.organizationId, itemId: item.id, type: 'DELETE', message: 'Item deleted' }})
	return NextResponse.json({ id: item.id })
}



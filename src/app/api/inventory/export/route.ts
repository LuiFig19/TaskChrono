import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { parseInventoryQuery } from '../_query'

async function getActiveOrganizationId(userId: string) {
	const membership = await prisma.organizationMember.findFirst({ where: { userId } })
	if (membership?.organizationId) return membership.organizationId
	const existingOrg = await prisma.organization.findFirst({ where: { createdById: userId } })
	const org = existingOrg || await prisma.organization.create({ data: { name: 'Personal', createdById: userId } })
	await prisma.organizationMember.upsert({
		where: { organizationId_userId: { organizationId: org.id, userId } },
		update: {},
		create: { organizationId: org.id, userId, role: 'OWNER' as any },
	})
	return org.id
}

export async function GET(request: Request) {
	const { error, userId } = await requireApiAuth()
	if (error) return error
	const organizationId = await getActiveOrganizationId(userId)
	const q = parseInventoryQuery(request.url)

	// Filters (match list endpoint)
	const where: any = { organizationId }
	if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { sku: { contains: q.q, mode: 'insensitive' } }]
	if (q.category) where.category = { name: { equals: q.category } }
	if (q.supplier) where.supplier = { name: { equals: q.supplier } }

	const items = await prisma.inventoryItem.findMany({
		where,
		orderBy: { name: 'asc' },
		include: { category: true, supplier: true },
	})

	const includeComputed = new URL(request.url).searchParams.get('computed') === '1'

	const header = ['name','sku','category','supplier','quantity','minQuantity','cost','price','barcode']
	if (includeComputed) header.push('stockValue','potentialRevenue')

	function sanitizeCell(v: string): string {
		// Prevent CSV injection by prefixing =, +, -, @ with a single quote
		if (/^[=+\-@]/.test(v)) return `'${v}`
		return v
	}

	const rows = [
		header.join(','),
		...items.map(i => {
			const base = [
				sanitizeCell(i.name),
				sanitizeCell(i.sku || ''),
				sanitizeCell(i.category?.name || ''),
				sanitizeCell(i.supplier?.name || ''),
				String(i.quantity),
				String(i.minQuantity),
				(i.costCents/100).toFixed(2),
				(i.priceCents/100).toFixed(2),
				sanitizeCell(i.barcode || ''),
			]
			if (includeComputed) {
				base.push(((i.quantity * i.costCents)/100).toFixed(2))
				base.push(((i.quantity * i.priceCents)/100).toFixed(2))
			}
			return base.map(v => String(v).replace(/,/g,' ')).join(',')
		})
	]
	const csv = rows.join('\n')
	return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="inventory.csv"' }})
}



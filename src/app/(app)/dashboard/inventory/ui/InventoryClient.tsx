"use client"
import React, { useEffect, useMemo, useState } from 'react'

type Item = {
	id: string
	name: string
	sku: string | null
	category: string | null
	supplier: string | null
	quantity: number
	minQuantity: number
	costCents: number
	priceCents: number
	barcode: string | null
	updatedAt?: string
}

export default function InventoryClient() {
	const [items, setItems] = useState<Item[]>([])
	const [query, setQuery] = useState('')
	const [categoryFilter, setCategoryFilter] = useState<string>('')
	const [supplierFilter, setSupplierFilter] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(25)
	const [total, setTotal] = useState(0)
	const [sort, setSort] = useState<{ field: string; order: 'asc'|'desc' }>({ field: 'updatedAt', order: 'desc' })
	const [categories, setCategories] = useState<string[]>([])
	const [suppliers, setSuppliers] = useState<string[]>([])
	const [summary, setSummary] = useState<{ totalItems: number; inventoryValueCents: number; lowStockCount: number } | null>(null)
	const [showImport, setShowImport] = useState(false)
	const [importRaw, setImportRaw] = useState('')
	const [importHeaders, setImportHeaders] = useState<string[]>([])
	const targetFields = ['name','sku','category','supplier','quantity','minQuantity','cost','price','barcode'] as const
	type TargetField = typeof targetFields[number]
	const [mapping, setMapping] = useState<Record<TargetField, string>>({
		name: 'name', sku: 'sku', category: 'category', supplier: 'supplier', quantity: 'quantity', minQuantity: 'minQuantity', cost: 'cost', price: 'price', barcode: 'barcode'
	})
	const [importErrors, setImportErrors] = useState<{ line: number; message: string }[] | null>(null)
	const [toast, setToast] = useState<string | null>(null)
	const [form, setForm] = useState({
		name: '', sku: '', categoryName: '', supplierName: '',
		quantity: '', minQuantity: '', cost: '', price: '', barcode: ''
	})

	async function load() {
		setLoading(true)
		setError(null)
		try {
			const params = new URLSearchParams()
			if (query.trim()) params.set('q', query.trim())
			if (categoryFilter) params.set('category', categoryFilter)
			if (supplierFilter) params.set('supplier', supplierFilter)
			if (statusFilter) params.set('status', statusFilter)
			params.set('page', String(page))
			params.set('pageSize', String(pageSize))
			params.set('sort', sort.field)
			params.set('order', sort.order)
			params.set('includeTotals', '1')
			const res = await fetch('/api/inventory?' + params.toString())
			if (!res.ok) throw new Error(await res.text())
			const data = await res.json() as { items: Item[]; meta: any }
			setItems(data.items)
			setTotal(data.meta?.total || 0)
			setCategories(data.meta?.categories || [])
			setSuppliers(data.meta?.suppliers || [])
			setSummary(data.meta?.summary || null)
		} catch (e: any) {
			setError(e?.message || 'Failed to load inventory')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { load() }, [query, categoryFilter, supplierFilter, statusFilter, page, pageSize, sort.field, sort.order])

	const filtered = items

  async function createItem() {
    setError(null)
    if (!form.name.trim() || !String(form.quantity).trim()) {
      setError('Name and quantity are required')
      return
    }
    const qty = Number(form.quantity)
    if (!Number.isFinite(qty)) {
      setError('Quantity must be a number')
      return
    }
    const costCents = Math.round(parseFloat((form.cost||'0').replace(/[^\d.\-]/g,'')) * 100) || 0
    const priceCents = Math.round(parseFloat((form.price||'0').replace(/[^\d.\-]/g,'')) * 100) || 0
    const res = await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name: form.name,
      sku: form.sku || undefined,
      categoryName: form.categoryName || undefined,
      supplierName: form.supplierName || undefined,
      quantity: qty,
      minQuantity: String(form.minQuantity).trim() ? Number(form.minQuantity) : 0,
      costCents,
      priceCents,
      barcode: form.barcode || undefined,
    }) })
    if (!res.ok) {
      setError('Failed to create item')
      return
    }
    setForm({ name:'', sku:'', categoryName:'', supplierName:'', quantity:'', minQuantity:'', cost:'', price:'', barcode:'' })
    load()
  }

	async function updateField(id: string, patch: Record<string, unknown>) {
		const prev = items
		setItems(curr => curr.map(it => it.id === id ? { ...it, ...patch } as any : it))
		const res = await fetch(`/api/inventory/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
		if (!res.ok) setItems(prev)
		load()
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
				<h1 className="text-xl font-semibold">Inventory</h1>
				<div className="flex gap-2">
					<button className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800" onClick={load}>Refresh</button>
					<a href={`/api/inventory/export?${new URLSearchParams({ computed: '1', q: query, category: categoryFilter, supplier: supplierFilter, status: statusFilter }).toString()}`} className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800">Export CSV</a>
					<label className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 cursor-pointer">
						Import CSV
						<input type="file" accept=".csv" className="hidden" onChange={async (e) => {
							const file = e.target.files?.[0]
							if (!file) return
							const body = new FormData()
							body.append('file', file)
							const res = await fetch('/api/inventory/import', { method: 'POST', body })
							if (!res.ok) {
								const text = await res.text()
								setError(text || 'Import failed')
							}
							load()
						}} />
					</label>
				</div>
			</div>

			{/* Quick Add form */}
      <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-2 p-3 border border-slate-800 rounded-md bg-slate-950/40">
				<input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} placeholder="Name" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<input value={form.sku} onChange={e=>setForm(f=>({...f, sku:e.target.value}))} placeholder="SKU" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<input value={form.categoryName} onChange={e=>setForm(f=>({...f, categoryName:e.target.value}))} placeholder="Category" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
        <input value={form.supplierName} onChange={e=>setForm(f=>({...f, supplierName:e.target.value}))} placeholder="Supplier" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
        <input value={form.quantity} onChange={e=>setForm(f=>({...f, quantity:e.target.value}))} placeholder="Qty" type="number" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
        <input value={form.minQuantity} onChange={e=>setForm(f=>({...f, minQuantity:e.target.value}))} placeholder="Min" type="number" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<input value={form.cost} onChange={e=>setForm(f=>({...f, cost:e.target.value}))} placeholder="Cost ($)" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<input value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} placeholder="Price ($)" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<input value={form.barcode} onChange={e=>setForm(f=>({...f, barcode:e.target.value}))} placeholder="Barcode" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<button onClick={createItem} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Add</button>
			</div>
			<div className="grid md:grid-cols-4 gap-2">
				<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or SKU" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700" />
				<select title="Filter by category" aria-label="Filter by category" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
					<option value="">All categories</option>
					{categories.map(c=> <option key={c} value={c}>{c}</option>)}
				</select>
				<select title="Filter by supplier" aria-label="Filter by supplier" value={supplierFilter} onChange={e=>setSupplierFilter(e.target.value)} className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
					<option value="">All suppliers</option>
					{suppliers.map(s=> <option key={s} value={s}>{s}</option>)}
				</select>
				<select title="Status" aria-label="Status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
					<option value="">All status</option>
					<option value="in">In Stock</option>
					<option value="low">Low</option>
					<option value="out">Out</option>
				</select>
			</div>
			{error && <div className="text-rose-400 text-sm">{error}</div>}
			<div className="overflow-auto rounded-lg border border-slate-800">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-900/70 sticky top-0">
						<tr className="text-left">
							{[
								{ key: 'name', label: 'Name' },
								{ key: 'sku', label: 'SKU' },
								{ key: 'category', label: 'Category' },
								{ key: 'supplier', label: 'Supplier' },
								{ key: 'quantity', label: 'Qty' },
								{ key: 'minQuantity', label: 'Min' },
								{ key: 'costCents', label: 'Cost' },
								{ key: 'priceCents', label: 'Price' },
								{ key: 'stockValue', label: 'Stock Value' },
								{ key: 'potential', label: 'Potential Rev' },
								{ key: 'status', label: 'Status' },
								{ key: 'actions', label: '' },
							].map(col => (
								<th key={col.key} className="px-3 py-2 select-none">
									<button className={`inline-flex items-center gap-1 hover:text-slate-200 ${col.key!=='actions'?'':'cursor-default'}`} disabled={col.key==='actions'} onClick={()=>{
										if (col.key==='actions' || col.key==='status' || col.key==='stockValue' || col.key==='potential') return
											const next: 'asc'|'desc' = sort.field===col.key && sort.order==='asc' ? 'desc' : 'asc'
											setSort({ field: col.key, order: next })
									}}>
										{col.label}
										{col.key!=='actions' && <span className="text-xs opacity-60">{sort.field===col.key ? (sort.order==='asc'?'▲':'▼') : ''}</span>}
									</button>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filtered.map(i=>{
							const low = i.quantity <= i.minQuantity
							const usd = (c:number)=> `$${(c/100).toFixed(2)}`
							return (
								<tr key={i.id} className={`border-t border-slate-800 ${low?'bg-rose-950/30':''}`}>
									<td className="px-3 py-2">
										<input title="Name" placeholder="Name" className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={i.name} onBlur={e=>updateField(i.id,{ name:e.target.value })} />
									</td>
									<td className="px-3 py-2">
										<input title="SKU" placeholder="SKU" className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={i.sku||''} onBlur={e=>updateField(i.id,{ sku:e.target.value })} />
									</td>
									<td className="px-3 py-2">
										<input title="Category" placeholder="Category" className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={i.category||''} onBlur={e=>updateField(i.id,{ categoryName:e.target.value })} />
									</td>
									<td className="px-3 py-2">
										<input title="Supplier" placeholder="Supplier" className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={i.supplier||''} onBlur={e=>updateField(i.id,{ supplierName:e.target.value })} />
									</td>
									<td className="px-3 py-2 font-mono">
										<input title="Quantity" placeholder="Qty" type="number" className={`w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 ${low?'text-rose-400':''}`} defaultValue={i.quantity} onBlur={e=>updateField(i.id,{ quantity:Number(e.target.value||0) })} />
									</td>
									<td className="px-3 py-2 font-mono">
										<input title="Min" placeholder="Min" type="number" className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={i.minQuantity} onBlur={e=>updateField(i.id,{ minQuantity:Number(e.target.value||0) })} />
									</td>
									<td className="px-3 py-2">
										<input title="Cost" placeholder="Cost ($)" className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={(i.costCents/100).toFixed(2)} onBlur={e=>updateField(i.id,{ costCents: Math.round(parseFloat((e.target.value||'0').replace(/[^\d.\-]/g,''))*100)||0 })} />
									</td>
									<td className="px-3 py-2">
										<input title="Price" placeholder="Price ($)" className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700" defaultValue={(i.priceCents/100).toFixed(2)} onBlur={e=>updateField(i.id,{ priceCents: Math.round(parseFloat((e.target.value||'0').replace(/[^\d.\-]/g,''))*100)||0 })} />
									</td>
									<td className="px-3 py-2 font-mono">{usd(i.quantity * i.costCents)}</td>
									<td className="px-3 py-2 font-mono">{usd(i.quantity * i.priceCents)}</td>
									<td className="px-3 py-2">
										<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${low? (i.quantity<=0?'border-slate-700 bg-slate-900 text-slate-400':'border-amber-600/40 bg-amber-500/10 text-amber-300') : 'border-emerald-700/40 bg-emerald-500/10 text-emerald-300'}`}>
											{i.quantity <= 0 ? 'Out' : (low ? 'Low' : 'In Stock')}
										</span>
									</td>
									<td className="px-3 py-2">
										<div className="flex items-center gap-2">
											<button title="Adjust -1" className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={()=> updateField(i.id, { quantity: Math.max(0, i.quantity - 1) })}>-</button>
											<button title="Adjust +1" className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={()=> updateField(i.id, { quantity: i.quantity + 1 })}>+</button>
											{low && i.quantity > 0 && (
												<button title="Quick Reorder" className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white" onClick={()=> updateField(i.id, { quantity: i.minQuantity + 1 })}>Reorder</button>
											)}
										</div>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			{/* Pagination controls */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
				<div className="text-sm text-slate-400">{total ? `Showing ${Math.min((page-1)*pageSize+1, total)}-${Math.min(page*pageSize, total)} of ${total}` : ''}</div>
				<div className="flex items-center gap-2">
					<select aria-label="Items per page" title="Items per page" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }} className="px-2 py-1 rounded bg-slate-900 border border-slate-700">
						{[10,25,50,100,200].map(n=> <option key={n} value={n}>{n}/page</option>)}
					</select>
					<div className="flex items-center gap-1">
						<button className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))}>Prev</button>
						<button className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50" disabled={page*pageSize>=total} onClick={()=> setPage(p=> p+1)}>Next</button>
					</div>
				</div>
			</div>
		</div>
	)
}



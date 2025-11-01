'use server';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';

export async function createInventoryItem(formData: FormData) {
  const { organizationId } = await getCurrentUserAndOrg();
  if (!organizationId) return;
  const name = String(formData.get('name') || '').trim();
  const quantity = Number(formData.get('quantity') || 0);
  if (!name) return;
  await prisma.inventoryItem.create({
    data: { organizationId, name, quantity: isFinite(quantity) ? quantity : 0 },
  });
}

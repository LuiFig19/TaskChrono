'use server';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';

export async function createFileRecord(formData: FormData) {
  const { organizationId, userId } = await getCurrentUserAndOrg();
  if (!organizationId || !userId) return;
  const name = String(formData.get('name') || '').trim();
  const url = String(formData.get('url') || '').trim();
  if (!name) return;
  await prisma.fileRecord.create({
    data: { organizationId, name, url: url || '#', uploadedById: userId },
  });
}

export async function deleteFileRecord(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await prisma.fileRecord.delete({ where: { id } });
}

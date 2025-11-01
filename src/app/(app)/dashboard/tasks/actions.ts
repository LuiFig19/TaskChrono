'use server';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';

export async function createTask(formData: FormData) {
  const { organizationId, userId } = await getCurrentUserAndOrg();
  if (!organizationId || !userId) return;
  const title = String(formData.get('title') || '').trim();
  if (!title) return;
  // Create a default project if missing
  let project = await prisma.project.findFirst({ where: { organizationId } });
  if (!project) {
    project = await prisma.project.create({ data: { organizationId, name: 'General' } });
  }
  await prisma.task.create({
    data: { organizationId, projectId: project.id, title, assigneeId: userId },
  });
}

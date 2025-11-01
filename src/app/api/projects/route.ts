import { NextResponse } from 'next/server';

import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

async function getActiveOrganizationId(userId: string) {
  const membership = await prisma.organizationMember.findFirst({ where: { userId } });
  if (membership?.organizationId) return membership.organizationId;
  // Fallback: create a personal org so project creation works out of the box
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

export const GET = withErrorHandling(async () => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  let organizationId: string | null = null;
  try {
    organizationId = await getActiveOrganizationId(userId);
  } catch (e) {
    return NextResponse.json({ error: 'Organization lookup failed' }, { status: 500 });
  }
  if (!organizationId) return NextResponse.json({ projects: [] });
  // FREE tier limits: up to 5 projects
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });
    const plan = membership?.organization?.planTier || 'FREE';
    if (plan === 'FREE') {
      const count = await prisma.project.count({ where: { organizationId } });
      if (count >= 5) {
        // If over limit, we still list all, but creation will be blocked; no-op here
      }
    }
  } catch {}
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      estimatedBudgetCents: true,
      updatedAt: true,
      _count: { select: { tasks: true } },
      tasks: { select: { status: true } },
    },
  });
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      status: p.status,
      budgetCents: p.estimatedBudgetCents,
      taskCount: p._count.tasks,
      doneCount: p.tasks.filter((t) => t.status === 'DONE').length,
      updatedAt: p.updatedAt,
    })),
  });
});

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  let organizationId: string | null = null;
  try {
    organizationId = await getActiveOrganizationId(userId);
  } catch (e) {
    return NextResponse.json({ error: 'Organization lookup failed' }, { status: 500 });
  }
  if (!organizationId) return error;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    status?: string;
    budgetCents?: number;
    members?: string[];
  };
  if (!body.name?.trim()) return error;
  // Enforce FREE tier project cap
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });
    const plan = membership?.organization?.planTier || 'FREE';
    if (plan === 'FREE') {
      const count = await prisma.project.count({ where: { organizationId } });
      if (count >= 5) return error;
    }
  } catch {}
  let proj;
  try {
    proj = await prisma.project.create({
      data: {
        organizationId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        status: (body.status as any) || 'PLANNING',
        estimatedBudgetCents: typeof body.budgetCents === 'number' ? body.budgetCents : 0,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
  // Assign creator as OWNER by default
  try {
    await prisma.projectMember.create({
      data: { projectId: proj.id, userId, role: 'OWNER' as any },
    });
  } catch (e) {
    // Non-fatal
  }
  try {
    broadcastActivity({
      type: 'project.created',
      message: `Project created: ${proj.name}`,
      meta: { projectId: proj.id },
    });
  } catch {}
  return NextResponse.json({ id: proj.id });
});

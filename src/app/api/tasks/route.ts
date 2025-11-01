import { NextResponse } from 'next/server';

import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { makeKey, withCache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { recomputeProjectStatus } from '@/lib/projectStatus';
import { rateLimit, rateLimitIdentifierFromRequest, tooManyResponse } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/route-helpers';

async function getActiveOrganizationId(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  return membership?.organizationId ?? null;
}

export const GET = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;

  const organizationId = await getActiveOrganizationId(userId);
  if (!organizationId) return NextResponse.json({ projects: [] });
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  const where = projectId ? { organizationId, id: projectId } : { organizationId };
  const rl = await rateLimit(rateLimitIdentifierFromRequest(request), 120, 60);
  if (!rl.allowed) return tooManyResponse();

  const key = makeKey(['tasks', organizationId, projectId || 'all']);
  const projects = await withCache(key, 5, async () =>
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            assigneeId: true,
            teamId: true,
          },
        },
      },
    }),
  );

  const payload = projects.map((p) => ({
    id: p.id,
    name: p.name,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      assigneeId: t.assigneeId,
      teamId: (t as any).teamId || null,
    })),
  }));

  const res = NextResponse.json({ projects: payload });
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.headers.set(k, v));
  return res;
});

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;

  const organizationId = await getActiveOrganizationId(userId);
  if (!organizationId) return error;

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    projectName?: string;
    priority?: number;
    dueDate?: string;
    teamId?: string | null;
  };
  const { title, projectName, description, priority, dueDate, teamId } = body;
  if (!title || !projectName) return error;

  let project = await prisma.project.findFirst({ where: { organizationId, name: projectName } });
  if (!project) {
    project = await prisma.project.create({ data: { organizationId, name: projectName } });
  }

  const task = await prisma.task.create({
    data: {
      organizationId,
      projectId: project.id,
      title,
      description: description ?? null,
      priority: typeof priority === 'number' && priority >= 1 && priority <= 5 ? priority : 3,
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: userId,
      teamId: teamId || null,
    },
  });
  // If project was PLANNING or COMPLETED, adding a task should make it ACTIVE
  try {
    await recomputeProjectStatus(project.id);
  } catch {}
  try {
    broadcastActivity({
      type: 'task.created',
      message: `Task added: ${task.title}`,
      meta: { projectId: project.id, taskId: task.id },
    });
  } catch {}
  return NextResponse.json({ ok: true, taskId: task.id });
});

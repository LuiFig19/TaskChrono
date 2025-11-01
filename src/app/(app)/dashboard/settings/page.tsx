import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import SettingsClient from '@/features/settings/components/SettingsClient';
import { auth } from '@/lib/better-auth';
import { prisma } from '@/lib/prisma';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect('/login');
  }
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  const isAdmin = membership?.role === 'OWNER' || membership?.role === 'ADMIN';
  const organizationId = membership?.organizationId ?? null;
  return (
    <SettingsClient
      isAdmin={!!isAdmin}
      organizationId={organizationId}
      plan={membership?.organization?.planTier || 'FREE'}
    />
  );
}

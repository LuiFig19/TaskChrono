import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/better-auth';

import NewTeamClient from '../NewTeamClient';

export default async function NewTeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');
  return (
    <div className="max-w-screen-sm mx-auto px-4 pt-6 pb-6">
      <h1 className="text-2xl font-semibold">Create Team</h1>
      <NewTeamClient />
    </div>
  );
}

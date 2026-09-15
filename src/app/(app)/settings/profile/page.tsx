import type { Metadata } from 'next';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { DetailList } from '@/components/shared/detail-list';
import { formatDate } from '@/lib/date';
import { initials } from '@/lib/utils';
import { db } from '@/lib/db';
import { requireTenant } from '@/server/tenant';

import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'My profile' };

export default async function ProfilePage() {
  // Your own details, so no module permission: everyone who can sign in owns
  // their own name, and locking this behind `settings.edit` would leave most
  // of a workspace unable to correct a typo in it.
  const context = await requireTenant();

  const user = await db.user.findUniqueOrThrow({
    where: { id: context.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      jobTitle: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Your details and your password. Nobody else in the workspace can change these."
      />

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-[15px]">{user.name}</CardTitle>
            <CardDescription className="truncate">{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: 'Workspace', value: context.organization.name },
              { label: 'Role', value: context.role.name },
              {
                label: 'Email confirmed',
                value: user.emailVerified ? formatDate(user.emailVerified) : 'Not yet',
              },
              {
                label: 'Last signed in',
                value: user.lastLoginAt ? formatDate(user.lastLoginAt) : 'This is the first time',
              },
              { label: 'Member since', value: formatDate(user.createdAt) },
            ]}
          />
        </CardContent>
      </Card>

      <ProfileForm
        defaultValues={{
          name: user.name,
          phone: user.phone ?? '',
          jobTitle: user.jobTitle ?? '',
        }}
        email={user.email}
      />

      <PasswordForm />
    </div>
  );
}

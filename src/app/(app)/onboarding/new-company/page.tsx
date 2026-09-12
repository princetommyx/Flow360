import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireTenant } from '@/server/tenant';

import { NewCompanyForm } from './new-company-form';

export const metadata: Metadata = { title: 'Add a company' };

export default async function NewCompanyPage() {
  await requireTenant();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add another company"
        description="Each company is a separate workspace with its own customers, invoices, stock and books. Nothing is shared between them."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Company details</CardTitle>
            <CardDescription>
              You&rsquo;ll be set as the owner and can invite your team afterwards.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <NewCompanyForm />
        </CardContent>
      </Card>
    </div>
  );
}

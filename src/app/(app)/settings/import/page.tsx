import type { Metadata } from 'next';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RankedTable } from '@/components/reports/ranked-table';
import { TimeAgo } from '@/components/shared/time-ago';
import { formatNumber } from '@/lib/money';
import { IMPORT_DATASETS, importPermissionKeys } from '@/lib/import/datasets';
import { AuthorizationError, requireTenant } from '@/server/tenant';
import { hasAnyPermission } from '@/lib/permissions';
import { listImportRuns } from '@/server/services/import';

import { ImportWizard } from './import-wizard';

export const metadata: Metadata = {
  title: 'Import data',
  description: 'Bring your customers, products and invoices across from ERPNext or a spreadsheet.',
};

export default async function ImportPage() {
  const context = await requireTenant();

  /*
    Not `settings.view`. Loading a file of customers is adding customers, and
    the page is reachable by whoever may add one — any one of the five, not the
    owner alone. The person doing a migration is usually the one who knows the
    data, not the one who pays the bill.
  */
  if (!hasAnyPermission(context.permissions, importPermissionKeys())) {
    throw new AuthorizationError();
  }

  /*
    And then narrowed to what they may actually load. A salesperson can add
    customers but not products, so the choice they are offered says so rather
    than failing at the last step.
  */
  const allowed = IMPORT_DATASETS.filter((dataset) =>
    hasAnyPermission(context.permissions, [`${dataset.module}.create`]),
  ).map((dataset) => ({
    key: dataset.key,
    label: dataset.label,
    erpnext: dataset.erpnext,
    summary: dataset.summary,
    // Resolved here: the list the browser gets is narrowed by permission, so a
    // prerequisite this person cannot import would otherwise show as its key.
    afterLabels: dataset.after.map(
      (key) => IMPORT_DATASETS.find((other) => other.key === key)?.label ?? key,
    ),
    updatable: dataset.key !== 'invoices',
    canUpdate: hasAnyPermission(context.permissions, [`${dataset.module}.edit`]),
    fields: dataset.fields.map((field) => ({
      key: field.key,
      label: field.label,
      hint: field.hint ?? null,
      required: field.required ?? false,
      line: field.line ?? false,
    })),
  }));

  const runs = await listImportRuns(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import data"
        description="Bring what you already have into this workspace: your customers, your products, your open invoices."
      />

      <ImportWizard datasets={allowed} />

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">The order to do it in</CardTitle>
          <CardDescription>
            Each file can point at the ones above it. Products look up their category
            and supplier by name; invoices look up their customer. Going in this order
            means those are already here to be found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {IMPORT_DATASETS.map((dataset, index) => (
              <li key={dataset.key} className="flex items-start gap-3">
                <span className="tabular mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">
                    {dataset.label}{' '}
                    <Badge variant="neutral" size="sm">
                      {dataset.erpnext}
                    </Badge>
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {dataset.summary}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            In ERPNext each of these is under{' '}
            <span className="font-medium text-foreground">
              Menu &rarr; Export &rarr; CSV
            </span>
            . Export Sales Invoices with the <em>Items</em> child table included, or
            their lines will not come across.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">What you have imported</CardTitle>
          <CardDescription>
            Every run, whether it worked or not. Nothing here is removed by a later one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankedTable
            rows={runs}
            keyOf={(row) => row.id}
            emptyTitle="Nothing imported yet"
            emptyDescription="Load a file above and this becomes the record of what went in."
            columns={[
              {
                header: 'File',
                cell: (row) => (
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate">
                      <FileSpreadsheet className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      {row.fileName}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {row.datasetLabel} · <TimeAgo value={row.startedAt} />
                    </p>
                  </div>
                ),
              },
              {
                header: 'Added',
                numeric: true,
                cell: (row) => formatNumber(row.created, 0),
              },
              {
                header: 'Updated',
                numeric: true,
                cell: (row) => formatNumber(row.updated, 0),
              },
              {
                header: 'Already there',
                numeric: true,
                cell: (row) => formatNumber(row.skipped, 0),
              },
              {
                header: 'Refused',
                numeric: true,
                cell: (row) =>
                  row.failed === 0 ? (
                    '—'
                  ) : (
                    <a
                      href={`/settings/import/${row.id}/report`}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      {formatNumber(row.failed, 0)} <ArrowRight className="size-3" aria-hidden />
                    </a>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

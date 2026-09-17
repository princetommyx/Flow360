'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileUp,
  Info,
  RotateCcw,
  TriangleAlert,
  Upload,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/money';
import { cn } from '@/lib/utils';
import { previewImportAction, runImportAction } from '@/server/actions/import';
import type { ImportOutcome, ImportPreview } from '@/server/services/import';

/**
 * Loading somebody's existing records, in three steps they can see the end of.
 *
 * The rule the screen is built to: nothing is written until the person has been
 * shown what would be. Choosing a file only reads it; the mapping is theirs to
 * correct and re-checks itself the moment they change one; and the button that
 * writes says how many records it is about to write.
 *
 * The file itself never leaves their machine until they ask for something. It
 * is held here, in the browser, and posted once to check and once to import,
 * which is a second upload and no store of other people's customer lists.
 */

/** Radix cannot hold an empty string as a value, so "not mapped" needs a word. */
const UNMAPPED = '__none__';

const DESTINATION: Record<string, string> = {
  customers: '/customers',
  suppliers: '/suppliers',
  'product-categories': '/categories',
  products: '/products',
  invoices: '/invoices',
};

export type WizardField = {
  key: string;
  label: string;
  hint: string | null;
  required: boolean;
  line: boolean;
};

export type WizardDataset = {
  key: string;
  label: string;
  erpnext: string;
  summary: string;
  /** Datasets to load before this one, by label. */
  afterLabels: string[];
  /** Whether re-running the file can overwrite what is already here. */
  updatable: boolean;
  /** Whether this person may overwrite. */
  canUpdate: boolean;
  fields: WizardField[];
};

type Stage = 'choose' | 'map' | 'done';

export function ImportWizard({ datasets }: { datasets: WizardDataset[] }) {
  const router = useRouter();

  const [datasetKey, setDatasetKey] = React.useState(datasets[0]?.key ?? '');
  const [mode, setMode] = React.useState<'create' | 'update'>('create');
  const [file, setFile] = React.useState<File | null>(null);
  const [stage, setStage] = React.useState<Stage>('choose');
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [outcome, setOutcome] = React.useState<ImportOutcome | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const fileInput = React.useRef<HTMLInputElement>(null);

  const dataset = datasets.find((item) => item.key === datasetKey) ?? datasets[0];
  const canOverwrite = Boolean(dataset?.updatable && dataset.canUpdate);
  const effectiveMode = canOverwrite ? mode : 'create';

  function payload(withMapping: Record<string, number | null> | null, forFile: File) {
    const form = new FormData();
    form.set('dataset', datasetKey);
    form.set('mode', effectiveMode);
    form.set('file', forFile);
    if (withMapping) form.set('mapping', JSON.stringify(withMapping));
    return form;
  }

  async function check(
    withMapping: Record<string, number | null> | null,
    forFile = file,
  ) {
    if (!forFile) {
      toast.error('Choose a CSV file first.');
      return;
    }

    setChecking(true);
    const result = await previewImportAction(payload(withMapping, forFile));
    setChecking(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setPreview(result.data);
    setStage('map');
  }

  function remap(fieldKey: string, columnValue: string) {
    if (!preview) return;
    const next = {
      ...preview.mapping,
      [fieldKey]: columnValue === UNMAPPED ? null : Number(columnValue),
    };

    // Two fields cannot read the same column: whichever was holding it lets go,
    // so the screen never claims a value is being used twice over.
    if (columnValue !== UNMAPPED) {
      for (const key of Object.keys(next)) {
        if (key !== fieldKey && next[key] === Number(columnValue)) next[key] = null;
      }
    }

    setPreview({ ...preview, mapping: next });
    void check(next);
  }

  async function runIt() {
    if (!preview || !file) return;

    setImporting(true);
    const result = await runImportAction(payload(preview.mapping, file));
    setImporting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setOutcome(result.data);
    setStage('done');
    router.refresh();

    const { created, updated } = result.data;
    toast.success(
      created + updated === 0
        ? 'Nothing new to add — everything in that file was already here'
        : `${formatNumber(created + updated, 0)} ${dataset?.label.toLowerCase() ?? 'records'} imported`,
    );
  }

  function startOver() {
    setStage('choose');
    setPreview(null);
    setOutcome(null);
    setFile(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  if (!dataset) return null;

  /* ── Done ───────────────────────────────────────────────────────────────── */

  if (stage === 'done' && outcome) {
    const landed = outcome.created + outcome.updated;

    return (
      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                outcome.failed > 0
                  ? 'bg-warning-soft text-warning'
                  : 'bg-success-soft text-success',
              )}
            >
              {outcome.failed > 0 ? (
                <TriangleAlert className="size-5" aria-hidden />
              ) : (
                <CheckCircle2 className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold tracking-[-0.015em]">
                {landed > 0
                  ? `${formatNumber(landed, 0)} ${dataset.label.toLowerCase()} are in`
                  : 'Nothing new went in'}
              </h2>
              <p className="mt-1 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {outcome.failed > 0
                  ? 'Everything that could be read went in. The rows that could not are listed below, with the row number they are on in your file — fix those and load the same file again.'
                  : 'Every row in that file was read. You can load the next one whenever you are ready.'}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Added', value: outcome.created },
              { label: 'Updated', value: outcome.updated },
              { label: 'Already there', value: outcome.skipped },
              { label: 'Refused', value: outcome.failed },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border px-3 py-2.5">
                <dt className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="tabular mt-0.5 text-[18px] font-semibold">
                  {formatNumber(item.value, 0)}
                </dd>
              </div>
            ))}
          </dl>

          <IssueList title="Rows that were refused" issues={outcome.errors} tone="error" total={outcome.errorCount} />
          <IssueList title="Worth knowing" issues={outcome.warnings} tone="warning" total={outcome.warningCount} />

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button asChild>
              <Link href={DESTINATION[dataset.key] ?? '/dashboard'}>
                See your {dataset.label.toLowerCase()}
              </Link>
            </Button>
            {outcome.failed > 0 ? (
              <Button variant="secondary" asChild>
                <a href={`/settings/import/${outcome.runId}/report`}>
                  <Download /> Download the refused rows
                </a>
              </Button>
            ) : null}
            <Button variant="ghost" onClick={startOver}>
              <RotateCcw /> Import another file
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Mapping ────────────────────────────────────────────────────────────── */

  if (stage === 'map' && preview) {
    const columns = preview.headers.map((header, index) => ({
      value: String(index),
      label: header.trim() === '' ? `Column ${index + 1}` : header,
    }));

    const documentFields = dataset.fields.filter((field) => !field.line);
    const lineFields = dataset.fields.filter((field) => field.line);
    const ready = preview.missing.length === 0 && preview.totalRecords > preview.errorCount;

    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Check the columns</CardTitle>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              We read {formatNumber(preview.totalRecords, 0)}{' '}
              {preview.totalRecords === 1 ? 'record' : 'records'} out of{' '}
              {formatNumber(preview.totalRows, 0)}{' '}
              {preview.totalRows === 1 ? 'row' : 'rows'} in {file?.name ?? 'your file'}
              {preview.existingRecords > 0
                ? `, and ${formatNumber(preview.existingRecords, 0)} of them ${
                    preview.existingRecords === 1 ? 'is' : 'are'
                  } already here`
                : ''}
              . Nothing has been written yet.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {preview.missing.length > 0 ? (
            <Notice tone="error" icon={TriangleAlert}>
              Nothing can be imported until{' '}
              <span className="font-medium">{preview.missing.join(' and ')}</span>{' '}
              {preview.missing.length === 1 ? 'has' : 'have'} a column pointing at{' '}
              {preview.missing.length === 1 ? 'it' : 'them'}.
            </Notice>
          ) : null}

          {preview.unmapped.length > 0 ? (
            <Notice tone="info" icon={Info}>
              {preview.unmapped.length}{' '}
              {preview.unmapped.length === 1 ? 'column is' : 'columns are'} in your file
              and not being read:{' '}
              <span className="font-medium">{preview.unmapped.slice(0, 8).join(', ')}</span>
              {preview.unmapped.length > 8 ? ` and ${preview.unmapped.length - 8} more` : ''}.
              Point one at a field below if it should come across.
            </Notice>
          ) : null}

          <FieldMapper
            title="The record"
            fields={documentFields}
            mapping={preview.mapping}
            columns={columns}
            disabled={checking}
            onChange={remap}
          />

          {lineFields.length > 0 ? (
            <FieldMapper
              title="Each line of the invoice"
              note="A row whose invoice number is blank belongs to the invoice above it — which is how ERPNext writes an invoice with several lines."
              fields={lineFields}
              mapping={preview.mapping}
              columns={columns}
              disabled={checking}
              onChange={remap}
            />
          ) : null}

          {preview.sample.length > 0 ? (
            <div>
              <h3 className="text-[13px] font-semibold">How the first rows read</h3>
              <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-subtle">
                      <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Row
                      </th>
                      {preview.sample[0].cells.map((cell) => (
                        <th
                          key={cell.label}
                          className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          {cell.label}
                        </th>
                      ))}
                      {dataset.key === 'invoices' ? (
                        <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Lines
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((record) => (
                      <tr
                        key={record.row}
                        className={cn(
                          'border-b border-border/60 last:border-0',
                          record.refused && 'bg-destructive-soft/30 text-muted-foreground',
                        )}
                      >
                        <td className="tabular whitespace-nowrap px-3 py-2 text-muted-foreground">
                          {record.row}
                          {record.refused ? (
                            <Badge variant="destructive" size="sm" className="ml-1.5">
                              out
                            </Badge>
                          ) : record.existing ? (
                            <Badge variant="neutral" size="sm" className="ml-1.5">
                              here
                            </Badge>
                          ) : null}
                        </td>
                        {record.cells.map((cell) => (
                          <td key={cell.label} className="max-w-[16rem] truncate px-3 py-2">
                            {cell.value}
                          </td>
                        ))}
                        {dataset.key === 'invoices' ? (
                          <td className="tabular px-3 py-2 text-right">{record.lines}</td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <IssueList
            title="Rows that will not go in"
            issues={preview.errors}
            tone="error"
            total={preview.errorCount}
          />
          <IssueList
            title="Worth knowing before you start"
            issues={preview.warnings}
            tone="warning"
            total={preview.warningCount}
          />

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setStage('choose')} disabled={importing}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={runIt} loading={importing} disabled={!ready || checking}>
              <Upload />
              Import {formatNumber(Math.max(0, preview.totalRecords - preview.errorCount), 0)}{' '}
              {dataset.label.toLowerCase()}
            </Button>
            {checking ? (
              <span className="text-[12.5px] text-muted-foreground">Re-reading your file…</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Choosing ───────────────────────────────────────────────────────────── */

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>What are you importing?</CardTitle>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            One file at a time, as CSV. We read your column headings for you and show
            you what we found before anything is saved.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div role="radiogroup" aria-label="What to import" className="grid gap-2 sm:grid-cols-2">
          {datasets.map((item) => {
            const selected = item.key === datasetKey;
            return (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDatasetKey(item.key)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  selected
                    ? 'border-primary/50 bg-primary-soft/40 ring-1 ring-primary/20'
                    : 'border-border hover:bg-surface-subtle',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium">{item.label}</span>
                  <Badge variant="neutral" size="sm">
                    {item.erpnext}
                  </Badge>
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                  {item.summary}
                </span>
                {item.afterLabels.length > 0 ? (
                  <span className="mt-1.5 block text-[11.5px] text-muted-foreground/80">
                    Load after: {item.afterLabels.join(' and ')}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="import-file">Your file</Label>
          <input
            ref={fileInput}
            id="import-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-lg border border-border bg-surface text-[13px] file:mr-3 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-muted file:px-3.5 file:py-2.5 file:text-[13px] file:font-medium hover:border-border-strong"
          />
          <p className="text-[12px] text-muted-foreground">
            CSV only, up to 5 MB.{' '}
            <a
              href={`/settings/import/template?dataset=${datasetKey}`}
              className="font-medium text-primary hover:underline"
            >
              Download a blank {dataset.label.toLowerCase()} template
            </a>{' '}
            if you would rather start from ours.
          </p>
        </div>

        {canOverwrite ? (
          <fieldset className="space-y-2">
            <legend className="text-[13px] font-medium">
              When a record is already here
            </legend>
            {[
              {
                value: 'create' as const,
                label: 'Leave it alone',
                hint: 'Only records we have never seen are added. The safe one, and the one to use when you are loading the same file twice.',
              },
              {
                value: 'update' as const,
                label: 'Update it from the file',
                hint: 'Existing records are overwritten with what the file says. Blank cells clear what is there.',
              },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                  mode === option.value
                    ? 'border-primary/50 bg-primary-soft/40'
                    : 'border-border hover:bg-surface-subtle',
                )}
              >
                <input
                  type="radio"
                  name="import-mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="mt-0.5 size-3.5 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : dataset.updatable ? null : (
          <Notice tone="info" icon={Info}>
            An invoice that is already here is never rewritten by an import. It is a
            statement of what was owed on a day, and re-running a file must not go back
            and change it.
          </Notice>
        )}

        <div className="border-t border-border pt-4">
          <Button onClick={() => check(null)} loading={checking} disabled={!file}>
            <FileUp /> Read the file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function FieldMapper({
  title,
  note,
  fields,
  mapping,
  columns,
  disabled,
  onChange,
}: {
  title: string;
  note?: string;
  fields: WizardField[];
  mapping: Record<string, number | null>;
  columns: Array<{ value: string; label: string }>;
  disabled: boolean;
  onChange: (fieldKey: string, columnValue: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold">{title}</h3>
      {note ? (
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{note}</p>
      ) : null}

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {fields.map((field) => {
          const current = mapping[field.key];
          const missing = field.required && (current === null || current === undefined);

          return (
            <div
              key={field.key}
              className={cn(
                'rounded-lg border p-3',
                missing ? 'border-destructive/40 bg-destructive-soft/30' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`map-${field.key}`} className="text-[12.5px]">
                  {field.label}
                </Label>
                {field.required ? (
                  <Badge variant={missing ? 'destructive' : 'neutral'} size="sm">
                    Required
                  </Badge>
                ) : null}
              </div>

              <Select
                value={current === null || current === undefined ? UNMAPPED : String(current)}
                onValueChange={(value) => onChange(field.key, value)}
                disabled={disabled}
              >
                <SelectTrigger id={`map-${field.key}`} className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNMAPPED}>Not imported</SelectItem>
                  {columns.map((column) => (
                    <SelectItem key={column.value} value={column.value}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {field.hint ? (
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {field.hint}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
  total,
}: {
  title: string;
  issues: Array<{ row: number; message: string }>;
  tone: 'error' | 'warning';
  total: number;
}) {
  if (issues.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-2 text-[13px] font-semibold">
        {title}
        <Badge variant={tone === 'error' ? 'destructive' : 'warning'} size="sm">
          {formatNumber(total, 0)}
        </Badge>
      </h3>
      <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
        {issues.map((issue, index) => (
          <li key={`${issue.row}-${index}`} className="flex gap-2.5 px-3 py-2 text-[12.5px]">
            <span className="tabular shrink-0 text-muted-foreground">Row {issue.row}</span>
            <span className="min-w-0 leading-relaxed">{issue.message}</span>
          </li>
        ))}
      </ul>
      {total > issues.length ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          and {formatNumber(total - issues.length, 0)} more.
        </p>
      ) : null}
    </div>
  );
}

function Notice({
  tone,
  icon: Icon,
  children,
}: {
  tone: 'error' | 'info';
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed',
        tone === 'error'
          ? 'border-destructive/30 bg-destructive-soft/40'
          : 'border-border bg-surface-subtle',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-3.5 shrink-0',
          tone === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

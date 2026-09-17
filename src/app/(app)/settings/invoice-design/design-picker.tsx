'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, Check, Lock, Maximize2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormStatus } from '@/components/shared/form-status';
import { InvoiceDesign } from '@/components/invoice-templates';
import { runAction } from '@/lib/client-action';
import { cn } from '@/lib/utils';
import type { InvoiceDocument } from '@/lib/invoice-document';
import { updateInvoiceTemplateAction } from '@/server/actions/settings';

type DesignRow = {
  id: string;
  name: string;
  description: string;
  /** Worked out on the server from the plan. The lock is decided there too. */
  allowed: boolean;
  planName: string;
};

/**
 * The six designs, drawn at a third of A4.
 *
 * Every tile is the real component rendering the real sample — not a
 * screenshot — so a design can never be shown here looking like something it
 * does not print as, and adding a design needs no artwork.
 *
 * A locked tile is still a working control: it goes to billing, where the plan
 * that opens it can be bought. What it is not is a radio button that silently
 * does nothing.
 */
export function DesignPicker({
  designs,
  doc,
  stored,
  inUse,
  planName,
  canEdit,
}: {
  designs: DesignRow[];
  doc: InvoiceDocument;
  /** What is on the settings row — which may be a design the plan lost. */
  stored: string;
  /** What invoices actually print with today. */
  inUse: string;
  planName: string;
  canEdit: boolean;
}) {
  const [choice, setChoice] = React.useState(inUse);
  const [saved, setSaved] = React.useState(stored);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The stored design is no longer included in the plan, so invoices are
  // printing with the fallback. Worth saying plainly — it is the one case
  // where the page and the paper would otherwise disagree.
  const lapsed = stored !== inUse;
  const dirty = choice !== saved;

  async function save() {
    setError(null);
    setSaving(true);
    const result = await runAction(() => updateInvoiceTemplateAction({ invoiceTemplate: choice }));
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(choice);
    toast.success(`Invoices will print in ${designs.find((d) => d.id === choice)?.name}`);
  }

  return (
    <div className="space-y-6">
      <FormStatus error={error} />

      {lapsed ? (
        <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-[13px]">
          <p>
            This workspace was set to{' '}
            <span className="font-medium">
              {designs.find((d) => d.id === stored)?.name ?? stored}
            </span>
            , which is not part of the {planName} plan. Invoices are printing in{' '}
            <span className="font-medium">{designs.find((d) => d.id === inUse)?.name}</span> until
            you upgrade or choose another.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(258px,1fr))]">
        {designs.map((design) => {
          const selected = design.id === choice;
          const live = design.id === saved && design.allowed;

          return (
            <Card
              key={design.id}
              className={cn(
                'gap-0 overflow-hidden p-0 transition-shadow',
                selected && design.allowed && 'ring-2 ring-primary',
              )}
            >
              <button
                type="button"
                disabled={!design.allowed || !canEdit}
                onClick={() => setChoice(design.id)}
                aria-pressed={selected}
                aria-label={`Use the ${design.name} design`}
                className={cn(
                  'relative block h-[300px] w-full overflow-hidden border-b border-border bg-[#f4f5f7]',
                  design.allowed && canEdit
                    ? 'cursor-pointer'
                    : 'cursor-default',
                )}
              >
                {/*
                  A whole A4 sheet drawn at 832px and scaled to fit the tile.
                  The shift is in the same `transform` as the scale rather than
                  a `-translate-x-1/2` class: Tailwind v4 puts that on the
                  separate `translate` property, which would compose with this
                  one and push the page clean off the tile.
                */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-3 w-[832px] [&_article]:my-0 [&_article]:shadow-sm"
                  style={{ transform: 'translateX(-50%) scale(0.3)', transformOrigin: 'top center' }}
                >
                  <InvoiceDesign template={design.id} doc={doc} />
                </div>

                {!design.allowed ? (
                  <span className="absolute inset-0 bg-white/55" aria-hidden />
                ) : null}

                {selected && design.allowed ? (
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>

              <div className="space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold">{design.name}</p>
                  {live ? (
                    <Badge variant="success">In use</Badge>
                  ) : !design.allowed ? (
                    <Badge variant="neutral">
                      <Lock className="h-3 w-3" /> {design.planName}
                    </Badge>
                  ) : null}
                </div>

                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {design.description}
                </p>

                {design.allowed ? (
                  <Button variant="ghost" size="sm" className="-ml-2" asChild>
                    <Link href={`/invoice-designs/${design.id}`} target="_blank">
                      <Maximize2 /> See it full size
                    </Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="-ml-2" asChild>
                    <Link href="/settings/billing">
                      <ArrowUpRight /> Comes with {design.planName}
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {canEdit ? (
        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <p className="text-[12.5px] text-muted-foreground">
            You are on {planName}. Changing the design affects every invoice printed from now
            on, including ones already issued.
          </p>
          <Button
            className="w-full sm:w-auto"
            disabled={!dirty}
            loading={saving}
            onClick={save}
          >
            Save design
          </Button>
        </div>
      ) : null}
    </div>
  );
}

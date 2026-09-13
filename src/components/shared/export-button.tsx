'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Exports exactly what the reader is looking at: the current search, filters
 * and sort are forwarded to the route handler that streams the CSV.
 */
export function ExportButton({
  endpoint,
  label = 'Export',
}: {
  endpoint?: string;
  label?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams.toString());
  params.delete('page');
  params.delete('perPage');
  const query = params.toString();

  const href = `${endpoint ?? `${pathname}/export`}${query ? `?${query}` : ''}`;

  return (
    <Button variant="secondary" size="sm" asChild>
      <a href={href} download>
        <Download />
        <span className="hidden sm:inline">{label}</span>
      </a>
    </Button>
  );
}

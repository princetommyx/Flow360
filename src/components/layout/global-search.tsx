'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Search } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { globalSearch, type SearchHit } from '@/server/actions/search';
import { EXTRA_SEARCH_TARGETS, type NavGroup } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/shared/icon';

type GlobalSearchProps = {
  navGroups: NavGroup[];
  className?: string;
};

/**
 * ⌘K palette. Navigation entries are matched locally for instant feedback;
 * records come from a debounced, permission-scoped server action.
 */
export function GlobalSearch({ navGroups, className }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState('');
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const query = term.trim();
  const shouldSearch = query.length >= 2;

  React.useEffect(() => {
    if (!shouldSearch) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const results = await globalSearch(query);
        if (!cancelled) setHits(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, shouldSearch]);

  const pages = React.useMemo(() => {
    const all = [...navGroups.flatMap((group) => group.items), ...EXTRA_SEARCH_TARGETS];
    const query = term.trim().toLowerCase();
    if (!query) return all.slice(0, 7);
    return all
      .filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.keywords?.some((keyword) => keyword.includes(query)),
      )
      .slice(0, 7);
  }, [navGroups, term]);

  const groupedHits = React.useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    if (!shouldSearch) return [] as Array<[string, SearchHit[]]>;
    for (const hit of hits) {
      map.set(hit.group, [...(map.get(hit.group) ?? []), hit]);
    }
    return [...map.entries()];
  }, [hits, shouldSearch]);

  function go(href: string) {
    setOpen(false);
    setTerm('');
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 text-left text-[13px] text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface',
          className,
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">Search customers, invoices, products…</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10.5px] font-medium lg:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} label="Global search">
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder="Search records or jump to a page…"
        />
        <CommandList>
          {loading && shouldSearch ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching…
            </div>
          ) : null}

          {!loading && pages.length === 0 && groupedHits.length === 0 ? (
            <CommandEmpty>
              No matches for “{term}”. Try a customer name, invoice number or SKU.
            </CommandEmpty>
          ) : null}

          {groupedHits.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((hit) => (
                <CommandItem key={hit.id} value={hit.id} onSelect={() => go(hit.href)}>
                  <span className="min-w-0 flex-1 truncate font-medium">{hit.title}</span>
                  {hit.subtitle ? (
                    <span className="truncate text-muted-foreground">{hit.subtitle}</span>
                  ) : null}
                  <ArrowRight className="opacity-0 data-[selected=true]:opacity-100" aria-hidden />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {pages.length > 0 ? (
            <CommandGroup heading="Go to">
              {pages.map((page) => (
                <CommandItem
                  key={page.href}
                  value={`page-${page.href}`}
                  onSelect={() => go(page.href)}
                >
                  <Icon name={page.icon} />
                  <span className="flex-1 truncate">{page.label}</span>
                  <CommandShortcut>Page</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}

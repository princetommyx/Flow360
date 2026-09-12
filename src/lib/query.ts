/**
 * URL-driven list state.
 *
 * Search, filters, sorting and pagination all live in the query string, which
 * keeps list pages server-rendered, shareable and back-button friendly.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export type ListQuery = {
  q: string;
  page: number;
  perPage: number;
  sort: string;
  dir: 'asc' | 'desc';
  filters: Record<string, string>;
};

export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

const RESERVED = new Set(['q', 'page', 'perPage', 'sort', 'dir']);

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function parseListQuery(
  params: SearchParams,
  defaults: { sort?: string; dir?: 'asc' | 'desc'; perPage?: number } = {},
): ListQuery {
  const page = Number.parseInt(first(params.page), 10);
  const perPage = Number.parseInt(first(params.perPage), 10);
  const dir = first(params.dir);

  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (RESERVED.has(key)) continue;
    const single = first(value);
    if (single && single !== 'all') filters[key] = single;
  }

  return {
    q: first(params.q).trim(),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage:
      Number.isFinite(perPage) && PER_PAGE_OPTIONS.includes(perPage as never)
        ? perPage
        : (defaults.perPage ?? 25),
    sort: first(params.sort) || (defaults.sort ?? 'createdAt'),
    dir: dir === 'asc' || dir === 'desc' ? dir : (defaults.dir ?? 'desc'),
    filters,
  };
}

export function paginationFor(query: ListQuery) {
  return { skip: (query.page - 1) * query.perPage, take: query.perPage };
}

/** Builds Prisma `orderBy` from a whitelist, guarding against arbitrary fields. */
export function orderByFor<T extends Record<string, unknown>>(
  query: ListQuery,
  allowed: Record<string, T>,
  fallback: T,
): T {
  const mapped = allowed[query.sort];
  if (!mapped) return fallback;
  return applyDirection(mapped, query.dir) as T;
}

function applyDirection(
  shape: Record<string, unknown>,
  dir: 'asc' | 'desc',
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(shape).map(([key, value]) => [
      key,
      value === null || typeof value !== 'object' ? dir : applyDirection(value as Record<string, unknown>, dir),
    ]),
  );
}

export type PageInfo = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
};

export function pageInfo(query: ListQuery, total: number): PageInfo {
  const totalPages = Math.max(1, Math.ceil(total / query.perPage));
  const from = total === 0 ? 0 : (query.page - 1) * query.perPage + 1;
  const to = Math.min(total, query.page * query.perPage);
  return { page: query.page, perPage: query.perPage, total, totalPages, from, to };
}

/** Merge changes into the current query string, dropping empty values. */
export function buildQueryString(
  current: SearchParams | URLSearchParams,
  changes: Record<string, string | number | null | undefined>,
): string {
  const params = new URLSearchParams();

  if (current instanceof URLSearchParams) {
    current.forEach((value, key) => params.set(key, value));
  } else {
    for (const [key, value] of Object.entries(current)) {
      const single = first(value);
      if (single) params.set(key, single);
    }
  }

  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === '' || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  // Any change other than paging returns the reader to the first page.
  if (!('page' in changes) && Object.keys(changes).length > 0) {
    params.delete('page');
  }
  if (params.get('page') === '1') params.delete('page');

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Case-insensitive `contains` across several columns. */
export function searchFilter<T extends string>(
  term: string,
  fields: readonly T[],
): Array<Record<T, { contains: string; mode: 'insensitive' }>> | undefined {
  if (!term) return undefined;
  return fields.map(
    (field) =>
      ({ [field]: { contains: term, mode: 'insensitive' } }) as Record<
        T,
        { contains: string; mode: 'insensitive' }
      >,
  );
}

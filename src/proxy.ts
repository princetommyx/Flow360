import { NextResponse, type NextRequest } from 'next/server';

/**
 * First line of defence only.
 *
 * The edge runtime cannot talk to the database, so this checks for the
 * presence of a session cookie to avoid a pointless render. Real authorization
 * — membership, organization scope and permissions — happens server-side in
 * `requireTenant()` / `requirePermission()` for every page and action.
 */
const SESSION_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/invoices',
  '/quotations',
  '/customers',
  '/payments',
  '/purchase-orders',
  '/suppliers',
  '/bills',
  '/products',
  '/categories',
  '/inventory',
  '/stock-adjustments',
  '/expenses',
  '/income',
  '/accounts',
  '/transactions',
  '/employees',
  '/payroll',
  '/attendance',
  '/projects',
  '/tasks',
  '/timesheets',
  '/reports',
  '/settings',
  '/notifications',
  '/onboarding',
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg).*)'],
};

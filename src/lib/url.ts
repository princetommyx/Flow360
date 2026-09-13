/**
 * Resolving the application's own origin.
 *
 * `NEXT_PUBLIC_APP_URL` is set by hand during deployment, so it is routinely
 * wrong — a placeholder pasted verbatim, a missing scheme, a trailing stray
 * character. `new URL()` throws on those, which during a build surfaces as an
 * opaque metadata failure and at runtime produces broken links in verification
 * and password-reset emails.
 *
 * Candidates are tried in order of preference and the first one that actually
 * parses wins, so a malformed value degrades to the platform-provided origin
 * rather than taking the page down.
 */
function candidates(): string[] {
  const values = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    'http://localhost:3000',
  ];

  return values.filter((value): value is string => Boolean(value?.trim()));
}

export function appUrl(): URL {
  for (const candidate of candidates()) {
    try {
      return new URL(candidate.trim());
    } catch {
      // Try the next candidate.
    }
  }
  // The literal fallback above always parses, so this is unreachable in
  // practice; it exists so the function has a total return type.
  return new URL('http://localhost:3000');
}

export function appOrigin(): string {
  return appUrl().origin;
}

/** Absolute link to a path on this deployment, for emails and metadata. */
export function absoluteUrl(path: string): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, appUrl()).toString();
}

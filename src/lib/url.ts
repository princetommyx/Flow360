const BRAND_DOMAIN = (process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? 'adwuma360.online')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');

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

/**
 * The origin this site should be *found* at, which is not always the one it is
 * *served* from.
 *
 * `appUrl()` follows `NEXT_PUBLIC_APP_URL` and the platform's own host, which
 * is right for a password-reset link: that has to point at wherever the person
 * actually is. It is wrong for canonical tags, sitemaps and robots, where the
 * answer must be the one public home of the site whatever host happens to be
 * serving the request. A preview deployment announcing itself as canonical is
 * how a site competes with itself and loses.
 *
 * So this prefers the brand's own domain in production, and only falls back to
 * the configured URL where there is no brand domain to use.
 */
export function siteUrl(): URL {
  if (isProductionSite()) {
    try {
      return new URL(`https://${BRAND_DOMAIN}`);
    } catch {
      // A malformed brand domain falls through to the configured URL.
    }
  }
  return appUrl();
}

export function siteOrigin(): string {
  return siteUrl().origin;
}

/** Absolute link on the public site, for sitemaps and canonical tags. */
export function siteLink(path: string): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, siteUrl()).toString();
}

/**
 * Whether this deployment is the real, public one.
 *
 * `VERCEL_ENV` is set by the platform and cannot be mistyped into the wrong
 * value by hand, which is exactly what makes it a better signal than a URL
 * somebody pasted. Off Vercel, a configured URL on the brand's own domain is
 * taken at its word.
 */
export function isProductionSite(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === 'production';
  if (!BRAND_DOMAIN) return false;
  return appUrl().hostname.replace(/^www\./, '') === BRAND_DOMAIN;
}

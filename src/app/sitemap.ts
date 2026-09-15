import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/url';

/**
 * The pages worth indexing.
 *
 * Written by hand rather than crawled from the router, because the router is
 * almost entirely the signed-in product and a sitemap listing pages that
 * redirect to a login screen is worse than no sitemap at all.
 *
 * `lastModified` is the deploy time. It is honest: these pages change when the
 * site is rebuilt, and inventing an older date to look stable would be a lie
 * that search engines are good at noticing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/pricing'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/register'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/login'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}

import type { MetadataRoute } from 'next';

import { isProductionSite, siteOrigin } from '@/lib/url';

/**
 * What a crawler may read.
 *
 * Only the marketing pages are public, so everything else is refused by name
 * rather than left to chance. The signed-in product would be a crawl budget
 * spent on pages that redirect to a login screen, and `/admin` is refused here
 * as well as being invisible to anyone who is not staff: a disallow line is a
 * published list of what exists, so the two have to agree.
 *
 * A preview deployment is refused entirely. Two copies of the same marketing
 * copy on two hostnames is the textbook way to split your own ranking.
 */
export default function robots(): MetadataRoute.Robots {
  // Decided from the platform's own environment rather than from a URL
  // somebody pasted, because getting that wrong hides the entire site from
  // search and says nothing about having done so.
  if (!isProductionSite()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
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
          '/no-workspace',
          '/verify-email',
          '/reset-password',
          '/accept-invite',
        ],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
    host: siteOrigin(),
  };
}

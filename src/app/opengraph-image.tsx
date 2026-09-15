import { ImageResponse } from 'next/og';

import { brand, locale } from '@/lib/config/brand';
import { TRIAL_DAYS } from '@/lib/config/plans';

/**
 * The card a link to this site unfurls into.
 *
 * Drawn here rather than shipped as a file so it follows the brand config: a
 * deployment that changes its name or its colours gets a matching card without
 * anybody opening a design tool. Facebook's crawler and LinkedIn's both cache
 * this aggressively, so the size and the filename stay put.
 */
export const alt = `${brand.name}: ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  // Built as single strings rather than mixed text and expressions: the
  // renderer behind this treats every child as a box and refuses an element
  // holding more than one without an explicit display.
  const summary = `Invoicing, stock, purchasing, expenses and payroll on one set of records. Built for businesses in ${locale.country}.`;
  const footer = `${brand.domain}  ·  ${TRIAL_DAYS} days free, no card`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: `linear-gradient(135deg, ${brand.colors.secondary} 0%, ${brand.colors.primary} 100%)`,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {brand.name.slice(0, 1)}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {brand.name}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              maxWidth: 940,
            }}
          >
            {brand.tagline}
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.4,
              opacity: 0.86,
              maxWidth: 860,
            }}
          >
            {summary}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 23, opacity: 0.8 }}>{footer}</div>
      </div>
    ),
    size,
  );
}

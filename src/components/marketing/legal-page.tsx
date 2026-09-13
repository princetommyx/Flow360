import Link from 'next/link';

import { brand, company } from '@/lib/config/brand';

export type LegalSection = { heading: string; paragraphs: string[]; list?: string[] };

/**
 * Shared shell for the terms and privacy documents.
 *
 * Both are plain, readable statements of how the product behaves — they are
 * not legal advice, and the page says so rather than implying review it has
 * not had.
 */
export function LegalPage({
  title,
  summary,
  updated,
  sections,
}: {
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-20">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
        {brand.name}
      </p>
      <h1 className="mt-3 text-balance text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
        {summary}
      </p>
      <p className="mt-4 text-[12.5px] text-muted-foreground">Last updated {updated}</p>

      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-pretty text-[14px] leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.list ? (
              <ul className="mt-3 space-y-2">
                {section.list.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[14px] leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          Questions about this document go to{' '}
          <a
            href={`mailto:${brand.supportEmail}`}
            className="font-medium text-primary hover:underline"
          >
            {brand.supportEmail}
          </a>
          , or by post to {company.legalName}, {company.addressLine1}, {company.city},{' '}
          {company.state} {company.postalCode}, {company.country}.
        </p>
        <p className="mt-3">
          This is a plain-language summary of how the product works, not legal
          advice. Read it alongside{' '}
          <Link href="/terms" className="text-primary hover:underline">
            the terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            the privacy notice
          </Link>
          .
        </p>
      </footer>
    </article>
  );
}

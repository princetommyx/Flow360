import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { brand, company } from '@/lib/config/brand';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Take a look inside', href: '/#inside' },
      { label: 'Features', href: '/#features' },
      { label: 'Modules', href: '/#modules' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'How it works', href: '/#how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'Contact', href: `mailto:${brand.supportEmail}` },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Create an account', href: '/register' },
      { label: 'Sign in', href: '/login' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface-subtle">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div>
          <Logo size={30} />
          <p className="mt-4 max-w-xs text-pretty text-[13px] leading-relaxed text-muted-foreground">
            {brand.description}
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
              {column.title}
            </p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-[12.5px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>
            © {new Date().getFullYear()} {company.legalName}. All rights reserved.
          </p>
          <p>
            {company.city}, {company.country} · {brand.supportEmail}
          </p>
        </div>
      </div>
    </footer>
  );
}

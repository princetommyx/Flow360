import type { Metadata } from 'next';

import { LegalPage, type LegalSection } from '@/components/marketing/legal-page';
import { brand } from '@/lib/config/brand';
import { TRIAL_DAYS } from '@/lib/config/plans';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: `The agreement covering use of ${brand.name}.`,
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'What this covers',
    paragraphs: [
      `These terms apply to everyone who uses ${brand.name}, whether on a free trial or a paid plan. Creating a workspace means accepting them on behalf of the company that workspace belongs to.`,
    ],
  },
  {
    heading: 'Your workspace and your data',
    paragraphs: [
      'The records you enter belong to you: customers, invoices, stock, payroll, everything. We store and process them so the product can do its job, and for no other purpose. We do not sell them, and we do not use them to train anything.',
      'Every list and report exports to CSV and every document prints to PDF, so you can take a full copy out at any time, including after you stop paying.',
    ],
  },
  {
    heading: 'The free trial',
    paragraphs: [
      `Every new workspace gets ${TRIAL_DAYS} days free on the full feature set. No card is required to start, so nothing can be charged when the trial ends.`,
      'When the trial runs out, the workspace stays intact and readable. Choosing a plan picks up exactly where you left off.',
    ],
  },
  {
    heading: 'Paying for a plan',
    paragraphs: [
      'Plans are billed monthly or annually in advance, in the currency shown when you sign up. Moving to a larger plan takes effect immediately; moving to a smaller one takes effect at the end of the period you have already paid for.',
      'Prices can change, but never during a period you have already paid for, and we will tell you at least 30 days before a change applies to you.',
    ],
  },
  {
    heading: 'Who may use your workspace',
    paragraphs: [
      'You decide who gets access and what they can see, using roles and per-module permissions. You are responsible for keeping that list current and for what the people you invite do with the access you give them.',
      'Keep sign-in credentials to yourself. Tell us promptly if you think an account has been compromised.',
    ],
  },
  {
    heading: 'What we ask you not to do',
    paragraphs: ['Reasonable limits, so the service stays usable for everyone:'],
    list: [
      'Do not attempt to reach another organization’s data, or to bypass permission checks.',
      'Do not use the service to break the law, or to store material you have no right to store.',
      'Do not resell access, or run automated load against the service that degrades it for others.',
    ],
  },
  {
    heading: 'Availability',
    paragraphs: [
      'We work to keep the service running and to make planned maintenance short and infrequent, but we do not promise uninterrupted availability. Where an interruption is our fault and materially affects you, contact us and we will make it right on the affected period.',
    ],
  },
  {
    heading: 'Ending the agreement',
    paragraphs: [
      'You can stop using the service and close your workspace whenever you like. Export what you need first, because closure removes the data on a defined schedule and it cannot be recovered afterwards.',
      'We can suspend an account that is being used in breach of these terms, and will say what the problem is and give you a chance to fix it unless doing so would put others at risk.',
    ],
  },
  {
    heading: 'Liability',
    paragraphs: [
      'Nothing here excludes liability that cannot legally be excluded. Beyond that, our liability in any 12-month period is limited to what you paid us in that period. We are not liable for lost profits or for records you did not keep a copy of.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'If we change anything material, we will say so in the product and by email before it takes effect. Continuing to use the service after that means the updated terms apply.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      summary={`The agreement between you and ${brand.name}: what you can expect from the service, and what we ask of you.`}
      updated="13 September 2026"
      sections={SECTIONS}
    />
  );
}

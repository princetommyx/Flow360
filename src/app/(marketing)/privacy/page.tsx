import type { Metadata } from 'next';

import { LegalPage, type LegalSection } from '@/components/marketing/legal-page';
import { brand } from '@/lib/config/brand';

export const metadata: Metadata = {
  title: 'Privacy notice',
  description: `What ${brand.name} collects, why, and what it never does with it.`,
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'The short version',
    paragraphs: [
      `${brand.name} holds two different kinds of information: the account details of the people who sign in, and the business records those people enter. We use the first to run the service and the second only to show it back to you.`,
      'We do not sell either. We do not use your business records for advertising, and we do not use them to train models.',
    ],
  },
  {
    heading: 'What we collect about account holders',
    paragraphs: ['Only what the service needs to work:'],
    list: [
      'Name, email address, phone number and job title, so colleagues can tell each other apart and we can reach you about the account.',
      'A hashed password. The original is never stored and cannot be recovered — only reset.',
      'Sign-in times and the actions taken inside a workspace, kept as an audit trail its owner can inspect.',
      'Basic technical details of each request, such as browser type and approximate location, used to keep accounts secure.',
    ],
  },
  {
    heading: 'What you put into your workspace',
    paragraphs: [
      'Customers, suppliers, invoices, stock, expenses, employees and everything else you record are yours. We process them to run the features you use, to produce your reports and documents, and to back the data up.',
      'Your records are separated from every other organization at the database level: each row carries the organization it belongs to, and every query is filtered by the organization of the person asking. One workspace cannot read another.',
    ],
  },
  {
    heading: 'Who else sees it',
    paragraphs: [
      'People you have invited to your workspace, with the visibility their role allows. Beyond that, a small number of service providers who make the product run — hosting, database, email delivery — each handling data only on our instructions.',
      'Our own staff access workspace contents only when you ask us to look at something, or where it is unavoidable to fix a fault, and that access is logged.',
      'We disclose data to an authority only where the law requires it, and we will tell you unless we are legally prevented from doing so.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'Workspace records are kept while the workspace is open. When you close it, the contents are deleted on a defined schedule, other than what we must keep for accounting and legal reasons.',
      'Audit and security logs are kept for a limited period and then removed.',
    ],
  },
  {
    heading: 'Keeping it safe',
    paragraphs: [
      'Traffic is encrypted in transit, passwords are hashed, permissions are enforced on the server rather than by hiding buttons in the interface, and access to production systems is limited and logged.',
      'No system is perfect. If a breach affects your data, we will tell you what happened, what it means for you, and what we are doing about it.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: ['You can, at any time:'],
    list: [
      'Export everything — every list and report writes CSV, and documents print to PDF.',
      'Correct your own account details from your profile page.',
      'Ask us to delete your account, or your whole workspace if you own it.',
      'Ask what we hold about you and receive a copy.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'We use cookies to keep you signed in, to remember which company you are working in, and to remember whether you prefer the light or dark appearance. There are no advertising or cross-site tracking cookies.',
    ],
  },
  {
    heading: 'Changes to this notice',
    paragraphs: [
      'If what we do with data changes in a way that matters, we will say so in the product and by email before the change takes effect.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      summary="What we collect, why we collect it, who can see it, and what we will never do with it."
      updated="13 September 2026"
      sections={SECTIONS}
    />
  );
}

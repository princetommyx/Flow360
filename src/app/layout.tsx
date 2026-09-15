import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { BrandStyle } from '@/components/brand/brand-style';
import { UnhandledErrorToast } from '@/components/layout/unhandled-error-toast';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { ThemeProvider, ThemeScript } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { brand } from '@/lib/config/brand';
import { appUrl } from '@/lib/url';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} · ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  icons: { icon: brand.faviconUrl },
  metadataBase: appUrl(),
  openGraph: {
    title: `${brand.name} · ${brand.tagline}`,
    description: brand.description,
    siteName: brand.name,
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#14161f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <BrandStyle />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
          <Toaster />
          <UnhandledErrorToast />
        </ThemeProvider>
      </body>
    </html>
  );
}

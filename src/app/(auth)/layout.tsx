import { ThemeToggle } from '@/components/layout/theme-toggle';

/** Page ground for every auth screen. The card itself comes from `AuthPanel`. */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-dvh bg-muted/50 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <ThemeToggle className="absolute right-5 top-5 z-20 lg:right-10 lg:top-10" />
      {children}
    </div>
  );
}

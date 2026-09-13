import { AuthShowcase } from '@/components/marketing/auth-showcase';

/**
 * The auth card: form on the left, brand panel on the right from `lg` upward.
 *
 * Each page passes its own showcase copy, which a shared layout could not do —
 * layouts receive no props from the page they wrap.
 */
export function AuthPanel({
  children,
  showcase,
}: {
  children: React.ReactNode;
  showcase?: { headline: string; sub?: string };
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[72rem] items-stretch sm:min-h-[calc(100dvh-4rem)]">
      <div
        className={`grid w-full grid-cols-1 border-border bg-background sm:rounded-2xl sm:border sm:p-3 sm:shadow-xl ${
          showcase ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]' : ''
        }`}
      >
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="motion-safe:animate-rise w-full max-w-[24rem]">
            {children}
          </div>
        </div>

        {showcase ? (
          <AuthShowcase headline={showcase.headline} sub={showcase.sub} />
        ) : null}
      </div>
    </div>
  );
}

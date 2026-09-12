import { brand } from '@/lib/config/brand';

/**
 * Injects the configured brand hues as CSS custom properties.
 *
 * Every brand-coloured token in globals.css derives from these two values, so
 * changing `NEXT_PUBLIC_BRAND_PRIMARY` re-themes the entire product — including
 * charts, badges and focus rings — with no component edits.
 */
export function BrandStyle({
  primary,
  secondary,
}: {
  primary?: string | null;
  secondary?: string | null;
}) {
  const css = `:root{--brand-primary:${primary || brand.colors.primary};--brand-secondary:${secondary || brand.colors.secondary};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

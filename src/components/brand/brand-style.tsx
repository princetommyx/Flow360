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
  /*
    `html:root` rather than `:root`: the root layout renders this in <head>,
    where Next's own stylesheet link is appended after it. Two `:root` rules of
    equal specificity means the later one wins, so the defaults in globals.css
    were silently beating the configured hues. The extra element selector
    settles it by specificity instead of by document order.
  */
  const css = `html:root{--brand-primary:${primary || brand.colors.primary};--brand-secondary:${secondary || brand.colors.secondary};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

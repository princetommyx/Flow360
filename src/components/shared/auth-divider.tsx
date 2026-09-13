/** "OR" rule between social and credential sign-in. */
export function AuthDivider({ label = 'OR' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-[11.5px] font-semibold tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

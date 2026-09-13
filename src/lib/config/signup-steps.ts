/**
 * Steps in the sign-up flow.
 *
 * Only steps the product can actually complete appear here — a step promising
 * something that never happens is worse than one fewer step.
 */
export const SIGNUP_STEPS = [
  { label: 'Your details' },
  { label: 'Verify email' },
] as const satisfies ReadonlyArray<{ label: string }>;

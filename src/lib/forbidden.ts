/**
 * The digest an authorisation refusal travels under.
 *
 * Being refused by your role is not a fault, but React strips a server error
 * down to its `digest` before it reaches an error boundary, so without an
 * agreed value the boundary cannot tell the two apart and apologises for a
 * crash that did not happen. `AuthorizationError` carries this string; the
 * boundary under `(app)` recognises it.
 *
 * Kept in its own file, with no server imports, so a client component can read
 * it without pulling `server/tenant` into the browser bundle.
 */
export const FORBIDDEN_DIGEST = 'ADWUMA_FORBIDDEN';

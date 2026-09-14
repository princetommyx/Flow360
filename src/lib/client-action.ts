import type { ActionResult } from '@/server/actions/types';

/**
 * Calls a server action and turns a *thrown* one into an ordinary failed
 * result.
 *
 * Actions return `ActionResult` for everything they anticipate, but they can
 * still throw: a database the schema has moved on from, a deploy swapped out
 * mid-request, a phone that lost signal between the tap and the response. A
 * thrown action rejects the submit handler, and a rejected submit handler
 * shows nothing at all — the button un-busies itself and the form sits there,
 * which reads to the person using it as the button being broken.
 *
 * The cause is worth separating, because the two have different remedies: a
 * dropped connection is theirs to retry, and a server fault is not.
 */
export async function runAction<T>(
  call: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await call();
  } catch (error) {
    // The reason only exists in the server log; the browser sees a bare 500.
    console.error('Server action failed', error);

    const offline =
      typeof navigator !== 'undefined' && navigator.onLine === false;

    return {
      ok: false,
      error: offline
        ? 'You appear to be offline. Check your connection and try again.'
        : 'Something went wrong at our end and this did not go through. Please try again in a moment.',
    };
  }
}

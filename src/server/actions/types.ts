/** Uniform result shape returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export function actionError(error: string, field?: string): ActionResult<never> {
  return { ok: false, error, field };
}

export function actionOk(): ActionResult<undefined>;
export function actionOk<T>(data: T): ActionResult<T>;
export function actionOk<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

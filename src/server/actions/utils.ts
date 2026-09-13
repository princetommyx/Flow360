/**
 * Helpers shared by server actions.
 */

type Nullified<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: Exclude<T[P], undefined | ''> | null;
};

/**
 * Turns the named optional text fields from `''` (what an empty input posts)
 * into `null` (what the column should hold), leaving every other field alone.
 *
 * Listing the keys explicitly keeps required fields from being widened to
 * `string | null`, which would then not satisfy Prisma's input types.
 */
export function nullifyBlanks<T extends object, K extends keyof T>(
  input: T,
  keys: readonly K[],
): Nullified<T, K> {
  const output = { ...input } as Record<string, unknown>;
  for (const key of keys) {
    const value = output[key as string];
    if (value === '' || value === undefined) output[key as string] = null;
  }
  return output as Nullified<T, K>;
}

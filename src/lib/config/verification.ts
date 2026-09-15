/**
 * Site-ownership tokens for the search engines' webmaster tools.
 *
 * These are not secrets. They are published in the page source by design, and
 * all they prove is that whoever holds the token can change this site. They
 * live in the environment anyway, because they belong to a deployment rather
 * than to the code: a fork, a staging copy or a second brand each needs its
 * own, and none of them should inherit this one.
 *
 * Google tells you not to remove the tag once verified. Leaving the variable
 * set is what keeps that promise.
 */
/**
 * Adwuma360's own token, so the deployed site is verified without anybody
 * setting a variable. A fork or a second brand overrides it in the
 * environment, exactly as it would override the brand name.
 */
const GOOGLE_DEFAULT = 'JSn_i_HG728Snn5FCcUn5qWMIuV5ZpfZTVLy7UHBRoM';

export const verification = {
  google:
    (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '').trim() ||
    GOOGLE_DEFAULT,
  bing: (process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? '').trim(),
} as const;

/** Only the ones actually set, so no empty tag is ever rendered. */
export function verificationMeta() {
  return {
    ...(verification.google ? { google: verification.google } : {}),
    ...(verification.bing ? { other: { 'msvalidate.01': verification.bing } } : {}),
  };
}

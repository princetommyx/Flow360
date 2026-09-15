/**
 * Who operates Adwuma360 itself.
 *
 * Three ways in, and they are not interchangeable.
 *
 *  - `users.isPlatformAdmin`, granted and revoked from the console itself.
 *    This is how access is managed day to day.
 *  - `PLATFORM_ADMIN_EMAILS`, exact addresses named in the environment. The
 *    bootstrap: a fresh deployment has no operator and something has to make
 *    the first one, and it is the way back in if the last flag is revoked by
 *    mistake.
 *  - `PLATFORM_ADMIN_DOMAINS`, whole domains. Everyone on the company's own
 *    domain is staff, without anybody being added one at a time.
 *
 * None of them grants anything inside a customer's workspace.
 */

function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function platformAdminEmails(): string[] {
  return list(process.env.PLATFORM_ADMIN_EMAILS);
}

/** Domains are stored bare: `adwuma360.online`, not `@adwuma360.online`. */
export function platformAdminDomains(): string[] {
  return list(process.env.PLATFORM_ADMIN_DOMAINS).map((entry) =>
    entry.replace(/^@/, ''),
  );
}

/** True when this exact address is named in the environment, flag or no flag. */
export function isBootstrapAdmin(email: string): boolean {
  return platformAdminEmails().includes(email.trim().toLowerCase());
}

/**
 * True when the address sits on a domain the company has claimed as its own.
 *
 * Subdomains do not count. `mail.adwuma360.online` is a different place from
 * `adwuma360.online` and whoever runs one does not necessarily run the other,
 * so each has to be named.
 */
export function isStaffDomain(email: string): boolean {
  const at = email.trim().toLowerCase().lastIndexOf('@');
  if (at < 0) return false;
  return platformAdminDomains().includes(email.trim().toLowerCase().slice(at + 1));
}

/** Whether the deployment has any way of reaching the console at all. */
export function hasBootstrapAdmins(): boolean {
  return platformAdminEmails().length > 0 || platformAdminDomains().length > 0;
}

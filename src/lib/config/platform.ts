/**
 * Who operates Adwuma360 itself.
 *
 * Two ways in, on purpose. The database flag is how access is granted and
 * revoked day to day, from inside the console. The environment list is the
 * bootstrap: a fresh deployment has no platform admin, and something has to be
 * able to make the first one. It is also the way back in if the last flag is
 * revoked by mistake.
 *
 * Neither grants anything inside a customer's workspace.
 */
export function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** True when this address is named in the environment, flag or no flag. */
export function isBootstrapAdmin(email: string): boolean {
  return platformAdminEmails().includes(email.trim().toLowerCase());
}

/** Whether the deployment has any way of reaching the console at all. */
export function hasBootstrapAdmins(): boolean {
  return platformAdminEmails().length > 0;
}

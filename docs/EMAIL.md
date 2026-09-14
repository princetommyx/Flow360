# Sending real email

Out of the box nothing is sent. `EMAIL_TRANSPORT` defaults to `console`, which
prints each message — including confirmation and password-reset links — to the
server log. Every flow works; the app says plainly that no email was sent
instead of pointing people at an inbox that will stay empty.

To deliver for real, use Resend. It is an HTTPS API, which matters: serverless
hosts generally block outbound SMTP ports, so an SMTP client would hang until it
timed out rather than fail cleanly.

## 1. Get a key

1. Sign up at <https://resend.com> — the free tier covers 3,000 emails a month
2. **API Keys** → **Create API Key**, with sending permission
3. Copy it; it is shown once

## 2. Set three variables

In Vercel → the project → **Settings** → **Environment Variables**:

| Name | Value | Type |
|---|---|---|
| `EMAIL_TRANSPORT` | `resend` | Config |
| `RESEND_API_KEY` | `re_...` | **Secret** |
| `EMAIL_FROM` | `Flow360 <onboarding@resend.dev>` | Config |

Then redeploy — environment variables only reach a build that starts after they
are saved.

## 3. The sending domain

This is the part that catches people out.

Until you verify a domain, Resend accepts `onboarding@resend.dev` as the sender
but **only delivers to the address that owns the Resend account**. Mail to
anyone else is rejected, so sign-up will appear to work for you and silently
fail for every other person.

To send to anyone, verify a domain: Resend → **Domains** → **Add Domain**, then
add the DNS records it gives you at your registrar. Once it verifies, set
`EMAIL_FROM` to an address on that domain, for example
`Flow360 <no-reply@yourdomain.com>`, and redeploy.

## What gets sent

Three messages, all from `src/lib/mailer.ts`:

- **Confirm your account** — on sign-up, and again from *Resend confirmation email*
- **Reset your password** — from the forgot-password form

Each is rendered as HTML and plain text. The HTML uses a table layout and inline
styles because that is what mail clients render predictably — Gmail strips
`<style>` blocks and Outlook ignores flexbox.

## How failures behave

Deliberately different by context:

- **Sign-up**: the account and workspace are already committed when the mail is
  attempted, so a provider failure is logged and sign-up still succeeds.
  Turning it into an error would strand an account that cannot be registered
  again — and verification is not required to sign in.
- **Resend confirmation**: sending *is* the request, so a failure is reported.
- **Password reset**: the response never changes, because varying it would
  reveal whether an address has an account. Failures are logged.

`mailIsDelivered()` reports whether a transport *and* its credential are both
present. A transport named without a key counts as not configured, so the app
keeps telling the truth rather than claiming a send that cannot happen.

## Checking it worked

Resend's dashboard has an **Emails** log showing every attempt with its status.
On the app side, Vercel → the deployment → **Runtime Logs** shows the thrown
error, including the provider's own reason — an unverified domain and a bad key
are indistinguishable otherwise.

# Sending real email

Out of the box nothing is sent. `EMAIL_TRANSPORT` defaults to `console`, which
prints each message — including confirmation and password-reset links — to the
server log. Every flow works; the app says plainly that no email was sent
instead of pointing people at an inbox that will stay empty.

To deliver for real, use Resend. It is an HTTPS API, which matters: serverless
hosts generally block outbound SMTP ports, so an SMTP client would hang until it
timed out rather than fail cleanly.

## 0. There is nothing to install

Resend is reached over its HTTPS API with `fetch`, so there is no npm package,
no SDK and no SMTP client — `npm install resend` is not a step. Connecting it
is three environment variables and a verified domain, below.

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
| `EMAIL_FROM` | `Adwuma360 <onboarding@resend.dev>` | Config |

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
`Adwuma360 <no-reply@yourdomain.com>`, and redeploy.

## What gets sent

Five messages. The copy for each lives in `src/lib/email/templates.ts`; the
shell they are poured into is `src/lib/email/render.ts`; `src/lib/mailer.ts`
only decides where they go.

| Message | Sent when | From |
|---|---|---|
| **Confirm your email** — six-digit code and a one-click link | Sign-up, and again from *Send a new code* | `registerAction`, `resendVerificationAction` |
| **Your account is ready** | The address is confirmed, by code or by link | `completeEmailVerification` |
| **Your 30-day trial has started** | Sign-up — the trial begins there | `registerAction` |
| **Reset your password** | The forgot-password form | `forgotPasswordAction` |
| **Plan requested** | An owner picks a plan on the billing page | `requestPlanAction` |

Each is rendered as HTML and plain text. The HTML uses a table layout and inline
styles because that is what mail clients render predictably — Gmail strips
`<style>` blocks and Outlook ignores flexbox. Outlook also ignores
`border-radius`, so the call-to-action button is square there and round
everywhere else; that is the trade for not shipping VML.

## Reading them without sending

```bash
npm run email:preview   # writes .email-preview/*.html and *.txt
```

Templates are plain functions, so this needs no provider, no database and no
send. Open `.email-preview/index.html` to page through them.

## The confirmation code

One record carries both ways in: a 32-byte token behind the link, and a
six-digit code in the body. Using either consumes the record, so a code cannot
outlive the link it arrived with, and issuing a new one retires everything
outstanding — the newest email is always the only one that works.

Six digits is a million guesses, which is not many, so a wrong code costs an
attempt and the record is burned after five. Codes are issued for email
confirmation only, never for a password reset: the digest of a six-digit
number is recoverable by anyone holding the database, and a reset is worth
more than a confirmation.

On a deployment with no provider connected, the code is printed to the server
log and the confirmation screen says so. It is a real code either way — the
field is never hidden, because an account that can be confirmed should never be
missing the means to confirm it.

## How failures behave

Deliberately different by context:

- **Sign-up**: the account and workspace are already committed when the mail is
  attempted, so a provider failure is logged and sign-up still succeeds.
  Turning it into an error would strand an account that cannot be registered
  again — and verification is not required to sign in.
- **Trial and welcome**: informational, sent after the thing they describe has
  already happened, so a failure is logged and nothing is rolled back.
- **New code**: sending *is* the request, so a failure is reported.
- **Plan requested**: the request is already stored when the mail is attempted,
  so a failure is logged rather than reported as a failed request.
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

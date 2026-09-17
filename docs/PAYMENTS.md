# Taking payments with Paystack

Adwuma360 charges for itself with Paystack subscriptions. This is the whole
setup, in order. Until you do it, the billing page still works: it records which
plan a workspace asked for and says someone will be in touch. Nothing anywhere
shows a checkout button that cannot complete.

## How it works, in three sentences

A workspace owner picks a plan, and we start a Paystack transaction against a
**Plan** you created in the Paystack dashboard. Paystack takes the card details
on its own page — they never touch our servers — and charges the plan's amount
on its interval, for as long as the subscription runs. Paystack then tells us
what happened over a **webhook**, and that webhook, not the page the customer
comes back to, is what marks the workspace as paid.

That last point is the one worth holding on to. Browsers get closed on the way
back from a checkout, and a renewal twelve months from now involves no browser
at all.

## 1. Decide the prices

The prices live in `src/lib/config/plans.ts` and they must match the Plans you
are about to create in Paystack, to the pesewa. Before anyone is sent to a
checkout, the server reads the live plan and refuses if the two figures differ,
so a mismatch can never charge someone a number they were not shown — but it
also means a mismatch stops sales, with the message *"This plan is mid-update
and we do not want to charge you the wrong amount."*

So: set the real prices in `plans.ts` first, then create the Plans to match.

The currency is `PLATFORM_CURRENCY` in the same file, and it is `GHS`. Your
Paystack plans must be in cedis too; a plan in another currency is refused
rather than converted.

## 2. Create the Plans in Paystack

In the Paystack dashboard, **Plans → Create Plan**, four times:

| Plan name           | Interval  | Amount                        |
| ------------------- | --------- | ----------------------------- |
| Adwuma360 Starter   | Monthly   | `starter.monthly` from `plans.ts` |
| Adwuma360 Starter   | Annually  | `starter.annual`              |
| Adwuma360 Business  | Monthly   | `business.monthly`            |
| Adwuma360 Business  | Annually  | `business.annual`             |

Enterprise deliberately has no plan: it is priced per customer, so its button
emails you instead. That is also what any plan without a code does, which is
how you can launch with Business only and add Starter later.

Each saved plan shows a **plan code** like `PLN_8x2k1q0w7v`. Copy all four.

## 3. Set the environment variables

On Vercel: **Project → Settings → Environment Variables**. Locally: `.env`.

```
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
PAYSTACK_PLAN_STARTER_MONTHLY=PLN_...
PAYSTACK_PLAN_STARTER_ANNUAL=PLN_...
PAYSTACK_PLAN_BUSINESS_MONTHLY=PLN_...
PAYSTACK_PLAN_BUSINESS_ANNUAL=PLN_...
```

Use the **test** key (`sk_test_`) and test-mode plan codes while you are trying
it out — test and live plans are separate lists in Paystack with different
codes, so switching keys means switching codes too.

The secret key is server-only. It is not prefixed `NEXT_PUBLIC_`, and the file
that reads it is marked `server-only`, so importing it into anything that runs
in a browser fails the build instead of leaking the key.

Redeploy after changing these. Environment variables are read at boot.

## 4. Point the webhook at us

Paystack dashboard → **Settings → API Keys & Webhooks → Webhook URL**:

```
https://adwuma360.online/api/webhooks/paystack
```

There is no separate webhook secret to set. Paystack signs each delivery with
the same secret key, as HMAC SHA-512 over the exact bytes it sent, and we verify
that before parsing anything. A request with a wrong or missing signature gets a
flat `401` and is never read.

Set the test-mode webhook URL as well if you are testing against a deployed
preview. A webhook cannot reach `localhost`; to test the full loop locally, use
a tunnel (`ngrok http 3000`) and put the tunnel's URL in the test webhook field.

## 5. Try it

With test keys, open **Settings → Plan & billing** as a workspace owner, pick a
plan and pay with one of [Paystack's test
cards](https://paystack.com/docs/payments/test-payments). Then check, in order:

1. The return page says *"Payment received"*.
2. The billing page badge turns to **Active** and the card on the right says
   when it renews. This one comes from the webhook, so it can lag the return
   page by a second or two — that is the design, not a bug.
3. `/admin/organizations/<id>` in the operator console shows the charge under
   **What we have charged**, with its Paystack reference.
4. Cancelling from the billing page leaves the workspace paid to the end of the
   period it bought, and stops the renewal.

## What each event does

| Paystack event           | What Adwuma360 does                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `charge.success`         | Marks the workspace active, sets the plan and the period end, notifies the owner |
| `subscription.create`    | Stores the subscription code and email token, so it can be cancelled later |
| `invoice.payment_failed` | Marks it past due and tells the owner. Nothing is switched off — Paystack retries |
| `subscription.not_renew` | The same                                                          |
| `subscription.disable`   | Marks it cancelled and clears the subscription                    |
| anything else            | Recorded in the ledger, acted on by nobody                        |

Every event is written to `billing_events` keyed by its Paystack reference,
which is unique. Paystack retries deliveries, and the second delivery of the
same event therefore writes nothing and does nothing — a retry cannot extend a
subscription twice.

Unrecognised events are acknowledged rather than refused, on purpose. Answering
`4xx` would have Paystack retry an event we will never understand, forever.

## Going live

1. Complete Paystack's business verification, so the account can accept live
   payments and settle to your bank.
2. Recreate the four Plans in **live mode** — the test ones do not carry over —
   and put the live plan codes in the environment variables.
3. Swap `PAYSTACK_SECRET_KEY` for the `sk_live_` key.
4. Set the live-mode webhook URL as well as the test one.
5. Redeploy, and buy the cheapest plan once with a real card to prove the whole
   path. Refund it from the Paystack dashboard afterwards; the refund arrives as
   an event and appears in the ledger like everything else.

## If something goes wrong

**"This plan is mid-update…"** — the price in `plans.ts` and the amount on the
Paystack plan disagree, or the plan is not in GHS. Nobody has been charged. The
server log names both figures.

**"Card payment is not configured on this deployment."** — `PAYSTACK_SECRET_KEY`
is missing or empty on the environment being served.

**The buttons say "Choose" rather than "Subscribe"** — that plan and period has
no plan code set, so it is on the request route. Check the variable name matches
exactly, and that you redeployed.

**Paid, but the billing page still says trialing** — the webhook is not arriving.
Paystack's dashboard shows each delivery and the response it got. A `401` there
means the key the webhook was signed with is not the key this deployment holds:
usually a test-mode webhook hitting a deployment configured with the live key.

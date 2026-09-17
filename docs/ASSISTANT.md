# The assistant

Ask about the business in plain words. It reads this workspace and answers from
what is actually in it, and it drafts the work — an invoice, a quotation, a
payslip — for somebody to confirm.

**Assistant** in the sidebar, once it is switched on.

## The one thing to understand

**The assistant cannot change anything.**

A drafting tool does not write. It resolves the names, fills in what was left
out, runs the same validation the form runs, totals the document with the same
function the invoice page uses — and then stops, with the filled-in form on
screen and a button under it. Nothing exists until a person presses that button,
and pressing it runs the ordinary server action their own click would have run.

That is worth being precise about, because it is the whole safety argument:

- The permission check, the stock check, the numbering, the notification and the
  activity log are **not** reimplemented for the assistant. They cannot drift
  from what the forms do, because they are the same code.
- A draft is stored on the server. The browser cannot edit one, so what gets
  created is exactly what was shown.
- A draft can only be confirmed by the person it was drafted for.
- An invoice created this way appears in the activity log as
  "Created invoice INV-2026-00031", like any other.

A misheard name costs a second, not an invoice sent to the wrong customer.

## Switching it on

One environment variable:

```
GEMINI_API_KEY=AIza...
```

From [aistudio.google.com/apikey](https://aistudio.google.com/apikey). On
Vercel: **Project → Settings → Environment Variables**, then redeploy.

Without it the feature is absent — no menu item, no page. That is deliberate: a
link to a page that can only say "not configured" is a dead control.

Two optional variables:

- `GEMINI_MODEL` picks the model. The default is `gemini-flash-latest`, the
  moving alias for Google's current Flash model, so a new one is picked up
  without a code change. Pin a version here to decide that for yourself.
- `GEMINI_BASE_URL` points the client somewhere other than Google. Unset in
  normal use; it is how the assistant gets exercised against a stand-in without
  a key, and the escape hatch for a deployment behind its own proxy.

## What it costs, and who pays

**You do**, past the free tier. Google's free tier is rate limited but costs
nothing, which is enough to find out whether the assistant earns its place.
After that every message is billed to your key, for every workspace on the
deployment. There is no per-tenant metering and no cap.

That matters at your prices. Starter is GH₵35 a year; a customer who talks to
the assistant all afternoon can cost more than that in a sitting. Decide who
gets it — and whether it needs a cap — before you tell customers it exists.

One thing that keeps it down is already in place: every turn is capped at eight
rounds of tool use, forty messages of history and eight thousand output tokens.

Each message row records `inputTokens` and `outputTokens`, so
`select sum("inputTokens"), sum("outputTokens") from chat_messages` tells you
what has actually been used.

## What it can do

Fifteen tools. Each one is gated on the same permission as the page it stands
for, so a salesperson gets a smaller assistant than an owner — and the list it is
offered is narrowed before the conversation starts, not refused afterwards.

**Reading** — runs without asking:

| Tool | Needs |
| --- | --- |
| How the business is doing | `dashboard.view` |
| Find customers, with what each owes | `customers.view` |
| Find products, with price, tax and stock | `products.view` |
| List invoices — unpaid, overdue, by customer, by date | `invoices.view` |
| One invoice in full, with its lines and payments | `invoices.view` |
| Find staff, with role, status and salary | `employees.view` |
| Attendance already recorded | `attendance.view` |
| Payslips already raised | `payroll.view` |

**Drafting** — produces a card, writes nothing:

| Tool | Needs | Confirming runs |
| --- | --- | --- |
| Draft an invoice | `invoices.create` | `createInvoiceAction` |
| Draft a quotation | `quotations.create` | `createQuotationAction` |
| Draft a customer | `customers.create` | `createCustomerAction` |
| Draft a payment received | `payments.create` | `recordPaymentAction` |
| Draft an attendance day | `attendance.create` | `saveAttendanceAction` |
| Draft a staff record | `employees.create` | `createEmployeeAction` |
| Draft a payslip | `payroll.create` | `createPayrollAction` |

A confirmed payslip is raised as a **draft** payslip. Nobody is paid until it is
approved and marked paid on the payroll page, which is two more deliberate acts
by a person.

## Things it will not do

- **It will not guess between two records.** "Ama" matching two people comes back
  as a question, never a coin toss.
- **It will not state a figure from memory.** Every number in an answer came from
  a tool on this workspace's data in that turn.
- **It sees no identifiers.** No tool takes or returns a database id; the model
  works in names throughout. It cannot invent an id it has never seen, and a
  workspace's identifiers never reach a provider's logs.
- **It knows only this workspace.** No other business on the deployment, and no
  internet.
- **It treats records as data.** A customer note that reads like an instruction is
  ignored and mentioned, not obeyed.

## What to try

- *Who owes me money, and how overdue is it?*
- *Draft an invoice for Adom Fabrics: 3 rolls of the cotton wax print*
- *What am I running low on?*
- *Kofi paid 500 against INV-2026-00014*
- *Mark Ama present today*
- *What does the payroll come to this month?*

## When it goes wrong

**"The assistant is not switched on here"** — no `GEMINI_API_KEY` on that
deployment, or it was added without redeploying.

**"The assistant is not configured correctly"** — the key is there and was
rejected. Check it has not been revoked, and that the Gemini API is enabled for
the project it belongs to.

**"The assistant is busy, or the free allowance for today is used up"** — rate
limited at Google. On the free tier that is a daily quota; on a billed key it
passes in a moment.

**It refuses something the person can clearly do** — check their role. The
assistant is narrower than the person only if the permission is missing; if the
page works and the assistant does not, that is a bug worth reporting.

**A confirmation fails** — the card says why, in the words of the action that
refused it. Usually the world moved between drafting and confirming: the stock
went, the invoice was paid, the role changed. Ask again and it re-drafts against
what is true now.

## How it is put together

```
src/lib/config/assistant.ts     the key, the model, the ceilings
src/lib/assistant-labels.ts     what each tool is called in front of a person
src/server/assistant/
  context.ts                    tool types, name resolution, staging a draft
  tools-read.ts                 the eight that only look
  tools-write.ts                the seven that draft
  tools.ts                      the registry and the permission gate
  run.ts                        the streamed loop — the only file that knows
                                which model provider is behind it
src/app/api/assistant/route.ts  one JSON object per line, to the browser
src/server/actions/assistant.ts confirm, discard, delete — the only door out
```

The split is the point, and it has been paid off once already: moving from one
model provider to another was a rewrite of `run.ts` and two lines of
`tools.ts`, and nothing else in the list changed. `tools-read` and `tools-write`
are the only places that know about the business; `run.ts` knows nothing about
invoices; and `actions/assistant.ts` is the single place a draft can become a
record.

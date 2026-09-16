# Bringing your data across

Adwuma360 imports your existing records from CSV. The importer knows ERPNext's
column headings by name, so an export from ERPNext maps itself: you check what
it worked out and correct anything it got wrong, and nothing is written until
you say so.

**Settings → Import data.**

## What can come across

| In Adwuma360 | In ERPNext | Notes |
| --- | --- | --- |
| Customers | Customer | Contact details, address, payment terms, credit limit |
| Suppliers | Supplier | The same, minus the credit limit |
| Product categories | Item Group | Load before products, or let products create them |
| Products and services | Item | Prices, units, opening stock, category, default supplier |
| Sales invoices | Sales Invoice | With their lines, keeping the numbers you already issued |

Do them in that order. Products look up their category and supplier by name;
invoices look up their customer. Going in order means those are already here to
be found.

## Exporting from ERPNext

For each of the five, open the list view and use **Menu → Export**, then:

- **File type:** CSV
- **Export type:** Export All Records (not just this page)
- **Select fields:** everything is fine — columns we do not recognise are
  listed on screen and ignored, they do not cause a failure

For **Sales Invoice** there is one thing that matters: tick the **Items** child
table in the field picker. ERPNext then writes one row per line, with the
invoice's own fields on the first of its rows and blank on the rest. That is
exactly what the importer expects; without it, your invoices arrive with no
lines and no totals.

The headings ERPNext produces — `Item Code (Items)`, `Rate (Items)`, `Posting
Date`, `Default Unit of Measure`, `Mobile No`, `Email Id` — are all recognised.
So are the raw fieldnames (`item_code`, `posting_date`, `stock_uom`) if you
export with **Export field labels** switched off.

## Not coming from ERPNext

Use the **Download a blank template** link under the file picker. It gives you a
CSV with our own column headings, which the importer matches exactly. Fill it in
and load it.

A worked example, for a products file:

```csv
Code / SKU,Name,Category,Unit,Selling price,Cost price,Tax rate (%),Opening stock,Track stock
FAB-001,Cotton wax print 6 yards,Fabrics,piece,180.00,120.00,15,40,Yes
FAB-002,Kente strip 2 yards,Fabrics,piece,1900.00,1250.00,15,12,Yes
SRV-001,Tailoring service,Services,hour,45.00,0,0,0,No
```

And an invoices file, where a row with no invoice number belongs to the invoice
above it:

```csv
Invoice number,Customer,Invoice date,Due date,Amount already paid,Line: product code,Line: description,Line: quantity,Line: unit price
INV-2026-00042,Ama Boateng,2026-01-15,2026-02-14,0,FAB-001,Cotton wax print 6 yards,3,180.00
,,,,,FAB-002,Kente strip 2 yards,2,1900.00
INV-2026-00043,Kofi Asare,2026-01-18,2026-02-01,540.00,FAB-001,Cotton wax print 6 yards,3,180.00
```

## What the importer reads

**Numbers.** `1,234.56` and `1.234,56` are both read correctly — where a cell
holds a dot and a comma, the last of the two is the decimal point. Currency
symbols and spaces are ignored. `(1,200.00)` in brackets is read as negative,
the way accounting software writes it.

**Dates.** `2026-01-15` is unambiguous and is what ERPNext writes. `15/01/2026`
and `15-01-2026` are read day-first, which is what Ghana and the UK use — unless
the numbers settle it, which they do whenever one of the two is over twelve. The
preview shows every date it has read, so check a few before you import.

**Yes and no.** `1`, `Yes`, `True`, `Y` are yes; `0`, `No`, `False`, blank are no.

**Status.** `Active`, `Inactive`, `Blocked`. ERPNext's `Disabled` column is the
inverse of ours and is read correctly: a `1` there means the record is off.

**Anything separated.** Delimiters are worked out from the file, so a
semicolon-separated export from a comma-decimal locale loads as easily as a
comma-separated one. Quoted fields with commas and line breaks inside them come
through intact.

## Running it twice

Safe, and expected — a first pass usually turns up rows to fix.

Every record is matched on, in order: **their reference** (ERPNext's ID column,
which the importer maps automatically and stores), then email, then name. For
products it is their reference, then the product code. For invoices it is the
invoice number.

Then:

- **Leave it alone** — anything already here is counted as "already there" and
  not touched. This is the default and the one to use for a re-run.
- **Update it from the file** — anything already here is overwritten with what
  the file says. Blank cells clear what is there, so use it with a file you
  trust.

Two rows in the same file claiming the same customer, code or invoice number is
an error on the second one, naming the row the first is on. Nothing is silently
merged.

## Things worth knowing before you start

**Invoices keep your numbers.** `ACC-SINV-2026-00001` arrives as
`ACC-SINV-2026-00001`. New invoices you raise here use this workspace's own
series — set its prefix under **Settings → Invoicing** if you want the two to
match.

**Invoices are never rewritten.** Whichever mode you pick, an invoice already
here is left exactly as it is. It is a statement of what was owed on a day, and
re-running a file must not go back and restate it. To correct one, delete it and
import again.

**Imported invoices do not move stock.** The opening stock on your products file
is what is on the shelf *today*, after all those sales. Taking the invoices off
it again would count them twice.

**The amount already paid is recorded on the invoice, not as a payment.** The
balance owing, the customer's outstanding total and the dashboard figures are
all correct. There is no payment record behind it, because we do not know when
or how it was paid.

**Opening stock arrives with a movement behind it.** Each product's opening
quantity is written as a stock adjustment labelled "Opening balance, imported",
so the stock history reconciles rather than starting from a number with nothing
to explain it.

**Stock is never overwritten by an update.** Re-running a products file to fix
prices leaves the quantities alone — they have moved since the export, and
winding them back would be wrong.

**A product code we do not hold still imports its invoice line.** The line is
kept as text, with its description, quantity and price. You are told which
lines, and on which row.

**Email addresses that are not addresses are dropped**, and the record still
imports. `n/a`, `none` and `-` are common in exported data and are not worth
losing a customer over. The preview says which rows.

**Currency.** The workspace keeps one set of books in one currency. An invoice
marked in another currency imports with its figures exactly as written — they
are not converted — and you are told which ones.

## Limits

- **5 MB and 10,000 rows a file.** Past either, split it and load the parts one
  after another; the matching means the second file cannot duplicate the first.
- **CSV only.** Save an Excel workbook as CSV first — the importer recognises
  one that has not been and says so rather than failing obscurely.
- **One file at a time.**

## When something goes wrong

Everything the importer refuses is listed with the row number it is on in your
file, counting the way your spreadsheet counts: the headings are row 1, so the
first record is row 2. Fix those rows and load the same file again.

If there are more than a handful, **Download the refused rows** gives you the
whole list as a CSV to work through next to the original.

Every run is kept under **What you have imported**, with the file name, what it
loaded and how many rows it would not take. Nothing there is removed by a later
run.

## Who can do it

Importing into an area means creating in it: somebody who can add a customer by
hand can load a file of customers, and somebody who cannot, cannot. Overwriting
existing records additionally needs permission to edit them. The list of things
you are offered to import is already narrowed to what your role allows.

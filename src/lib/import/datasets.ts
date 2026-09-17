import type { PermissionKey, PermissionModule } from '@/lib/permissions';

/**
 * What can be imported, and how to recognise somebody else's column headings.
 *
 * The aliases are the whole point of this file. A business moving off ERPNext
 * exports a CSV whose headers are ERPNext's labels — "Item Code", "Posting
 * Date", "Default Unit of Measure" — and nobody should have to hand-map thirty
 * columns before they can see whether their data is coming across. So every
 * field carries the names other systems give it, and the mapping arrives
 * already done, with every choice visible and changeable before a row is
 * written.
 *
 * Aliases are matched on a normalised form (lower case, letters and digits
 * only), so `Customer Name`, `customer_name` and `customername` are one entry.
 * ERPNext's child-table columns come through as `Rate (Items)`, which
 * normalises to `rateitems` — hence the doubled-up entries on line fields.
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'list';

export type ImportField = {
  key: string;
  label: string;
  /** Shown under the mapping row, for anything the label does not settle. */
  hint?: string;
  type: FieldType;
  required?: boolean;
  /** Normalised header names that mean this field. Order is not significant. */
  aliases: string[];
  /** For `enum`: what we accept, and what each of their words becomes. */
  values?: Record<string, string>;
  /** For `enum`: the value used when the column is absent. */
  fallback?: string;
  /** Belongs to a line of a document rather than the document itself. */
  line?: boolean;
};

export type ImportDatasetKey =
  | 'customers'
  | 'suppliers'
  | 'product-categories'
  | 'products'
  | 'invoices';

export type ImportDataset = {
  key: ImportDatasetKey;
  label: string;
  /** What the same thing is called in ERPNext, so people recognise it. */
  erpnext: string;
  summary: string;
  /** Permission module. Importing needs `.create`, and `.edit` to overwrite. */
  module: PermissionModule;
  /**
   * Which datasets should already be in before this one, because this one
   * points at them by name.
   */
  after: ImportDatasetKey[];
  /** Tried in order to decide whether a row is already here. */
  matchOn: string[];
  /**
   * The field whose value starts a new document. Set only on a file that has
   * one row per line: ERPNext writes the document's own fields on the first of
   * its rows and leaves them blank on the rest.
   */
  groupBy?: string;
  fields: ImportField[];
};

const STATUS_VALUES: Record<string, string> = {
  active: 'ACTIVE',
  enabled: 'ACTIVE',
  yes: 'ACTIVE',
  '0': 'ACTIVE',
  inactive: 'INACTIVE',
  disabled: 'INACTIVE',
  no: 'INACTIVE',
  '1': 'INACTIVE',
  blocked: 'BLOCKED',
  onhold: 'BLOCKED',
};

/**
 * `Disabled` is ERPNext's column and it is the inverse of ours: a 1 there means
 * the record is off. That is why `1` reads as INACTIVE above — and why
 * `Enabled` is deliberately not an alias for the same field, since it would
 * mean the opposite with the same numbers.
 */
const statusField = (label = 'Status'): ImportField => ({
  key: 'status',
  label,
  hint: 'Active, inactive or blocked. ERPNext’s “Disabled” column is read correctly.',
  type: 'enum',
  aliases: ['status', 'disabled', 'isdisabled'],
  values: STATUS_VALUES,
  fallback: 'ACTIVE',
});

const externalIdField = (what: string): ImportField => ({
  key: 'externalId',
  label: 'Their reference',
  hint: `ERPNext’s ID for the ${what}. Keeping it lets you re-run this file without creating everything twice.`,
  type: 'text',
  aliases: ['id', 'docname', 'externalid', 'erpnextid', 'sourceid', 'reference'],
});

const CONTACT_FIELDS: ImportField[] = [
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    aliases: ['emailaddress', 'emailid', 'email', 'primaryemail', 'contactemail'],
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'text',
    aliases: [
      'mobileno',
      'mobile',
      'phone',
      'phoneno',
      'telephone',
      'contactno',
      'primaryphone',
      'mobilenumber',
    ],
  },
  { key: 'website', label: 'Website', type: 'text', aliases: ['website', 'url', 'homepage'] },
  {
    key: 'taxId',
    label: 'Tax number',
    type: 'text',
    aliases: ['taxid', 'gstin', 'tin', 'vatnumber', 'taxnumber', 'taxregistrationnumber'],
  },
];

const ADDRESS_FIELDS: ImportField[] = [
  {
    key: 'addressLine1',
    label: 'Address',
    type: 'text',
    aliases: ['addressline1', 'address1', 'address', 'addressline', 'street'],
  },
  {
    key: 'city',
    label: 'City',
    type: 'text',
    aliases: ['city', 'citytown', 'town'],
  },
  {
    key: 'state',
    label: 'Region',
    type: 'text',
    aliases: ['state', 'province', 'region', 'stateprovince', 'county'],
  },
  {
    key: 'postalCode',
    label: 'Postal code',
    type: 'text',
    aliases: ['postalcode', 'pincode', 'zip', 'zipcode', 'postcode'],
  },
  { key: 'country', label: 'Country', type: 'text', aliases: ['country'] },
];

export const IMPORT_DATASETS: ImportDataset[] = [
  {
    key: 'customers',
    label: 'Customers',
    erpnext: 'Customer',
    summary: 'Who you sell to, with their contact details and payment terms.',
    module: 'customers',
    after: [],
    matchOn: ['externalId', 'email', 'name'],
    fields: [
      {
        key: 'name',
        label: 'Name',
        hint: 'The name you know them by. Required.',
        type: 'text',
        required: true,
        aliases: [
          'customername',
          'name',
          'fullname',
          'contactname',
          'customer',
          'party',
          'partyname',
          'clientname',
        ],
      },
      {
        key: 'companyName',
        label: 'Company',
        type: 'text',
        aliases: ['companyname', 'company', 'organisation', 'organization', 'businessname'],
      },
      ...CONTACT_FIELDS,
      ...ADDRESS_FIELDS,
      {
        key: 'addressLine2',
        label: 'Address line 2',
        type: 'text',
        aliases: ['addressline2', 'address2'],
      },
      {
        key: 'currency',
        label: 'Currency',
        hint: 'Only if they are billed in something other than your own currency.',
        type: 'text',
        aliases: ['defaultcurrency', 'currency', 'billingcurrency'],
      },
      {
        key: 'creditLimit',
        label: 'Credit limit',
        type: 'number',
        aliases: ['creditlimit'],
      },
      {
        key: 'paymentTermDays',
        label: 'Payment terms (days)',
        type: 'integer',
        aliases: ['creditdays', 'paymenttermdays', 'paymentterms', 'netdays', 'termdays'],
      },
      {
        key: 'tags',
        label: 'Tags',
        hint: 'Separated by commas or semicolons.',
        type: 'list',
        aliases: ['tags', 'customergroup', 'territory', 'labels'],
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'text',
        aliases: ['notes', 'remarks', 'customerdetails', 'comments', 'details'],
      },
      statusField(),
      externalIdField('customer'),
    ],
  },

  {
    key: 'suppliers',
    label: 'Suppliers',
    erpnext: 'Supplier',
    summary: 'Who you buy from. Products can point at one of these.',
    module: 'suppliers',
    after: [],
    matchOn: ['externalId', 'email', 'name'],
    fields: [
      {
        key: 'name',
        label: 'Name',
        hint: 'Required.',
        type: 'text',
        required: true,
        aliases: [
          'suppliername',
          'name',
          'supplier',
          'vendorname',
          'vendor',
          'party',
          'partyname',
        ],
      },
      {
        key: 'companyName',
        label: 'Company',
        type: 'text',
        aliases: ['companyname', 'company', 'organisation', 'organization', 'businessname'],
      },
      ...CONTACT_FIELDS,
      ...ADDRESS_FIELDS,
      {
        key: 'paymentTermDays',
        label: 'Payment terms (days)',
        type: 'integer',
        aliases: ['creditdays', 'paymenttermdays', 'paymentterms', 'netdays', 'termdays'],
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'text',
        aliases: ['notes', 'remarks', 'supplierdetails', 'comments', 'details'],
      },
      statusField(),
      externalIdField('supplier'),
    ],
  },

  {
    key: 'product-categories',
    label: 'Product categories',
    erpnext: 'Item Group',
    summary: 'Load these before products, so each product can find its category.',
    module: 'products',
    after: [],
    matchOn: ['externalId', 'name'],
    fields: [
      {
        key: 'name',
        label: 'Name',
        hint: 'Required.',
        type: 'text',
        required: true,
        aliases: ['itemgroupname', 'itemgroup', 'name', 'categoryname', 'category', 'group'],
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        aliases: ['description', 'notes', 'details', 'remarks'],
      },
      externalIdField('category'),
    ],
  },

  {
    key: 'products',
    label: 'Products and services',
    erpnext: 'Item',
    summary:
      'Everything you sell or stock, with prices and opening quantities. Categories and suppliers are matched by name.',
    module: 'products',
    after: ['product-categories', 'suppliers'],
    matchOn: ['externalId', 'sku'],
    fields: [
      {
        key: 'sku',
        label: 'Code / SKU',
        hint: 'Required, and unique. ERPNext calls it the Item Code.',
        type: 'text',
        required: true,
        aliases: ['itemcode', 'sku', 'code', 'itemid', 'productcode', 'partnumber', 'partno'],
      },
      {
        key: 'name',
        label: 'Name',
        hint: 'A row with a code and no name is named after its code.',
        type: 'text',
        aliases: ['itemname', 'name', 'productname', 'title'],
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        aliases: ['description', 'itemdescription', 'details', 'longdescription'],
      },
      {
        key: 'categoryName',
        label: 'Category',
        hint: 'Matched to a category by name. One that does not exist yet is created.',
        type: 'text',
        aliases: ['itemgroup', 'category', 'categoryname', 'productgroup', 'itemgroupname'],
      },
      {
        key: 'supplierName',
        label: 'Default supplier',
        hint: 'Matched to a supplier by name. One that does not exist is left blank.',
        type: 'text',
        aliases: ['defaultsupplier', 'supplier', 'suppliername', 'vendor', 'preferredsupplier'],
      },
      {
        key: 'unit',
        label: 'Unit',
        hint: 'Piece, box, hour, kg. Defaults to “unit”.',
        type: 'text',
        aliases: ['defaultunitofmeasure', 'stockuom', 'uom', 'unitofmeasure', 'unit'],
      },
      {
        key: 'barcode',
        label: 'Barcode',
        type: 'text',
        aliases: ['barcode', 'ean', 'upc', 'barcodes'],
      },
      {
        key: 'sellingPrice',
        label: 'Selling price',
        type: 'number',
        aliases: [
          'standardsellingrate',
          'standardrate',
          'sellingprice',
          'sellingrate',
          'price',
          'rate',
          'listprice',
          'mrp',
        ],
      },
      {
        key: 'purchasePrice',
        label: 'Cost price',
        type: 'number',
        aliases: [
          'valuationrate',
          'purchaserate',
          'costprice',
          'buyingprice',
          'lastpurchaserate',
          'purchaseprice',
          'cost',
        ],
      },
      {
        key: 'taxRate',
        label: 'Tax rate (%)',
        type: 'number',
        aliases: ['taxrate', 'vatrate', 'gstrate', 'taxpercentage'],
      },
      {
        key: 'stockQuantity',
        label: 'Opening stock',
        hint: 'What is on the shelf today. Ignored for anything not tracked.',
        type: 'number',
        aliases: [
          'openingstock',
          'stockqty',
          'actualqty',
          'stockquantity',
          'quantity',
          'qty',
          'balanceqty',
          'closingstock',
        ],
      },
      {
        key: 'minStockLevel',
        label: 'Reorder level',
        type: 'number',
        aliases: ['reorderlevel', 'safetystock', 'minstocklevel', 'minimumstocklevel'],
      },
      {
        key: 'trackInventory',
        label: 'Track stock',
        hint: 'ERPNext’s “Maintain Stock”. A row that does not track stock is treated as a service.',
        type: 'boolean',
        aliases: ['maintainstock', 'isstockitem', 'trackinventory', 'stockitem', 'hasstock'],
      },
      {
        key: 'type',
        label: 'Type',
        hint: 'Good or service. Worked out from “Track stock” when this column is absent.',
        type: 'enum',
        aliases: ['type', 'itemtype', 'producttype'],
        values: {
          good: 'GOOD',
          goods: 'GOOD',
          product: 'GOOD',
          stock: 'GOOD',
          item: 'GOOD',
          service: 'SERVICE',
          services: 'SERVICE',
          labour: 'SERVICE',
          labor: 'SERVICE',
        },
      },
      statusField(),
      externalIdField('item'),
    ],
  },

  {
    key: 'invoices',
    label: 'Sales invoices',
    erpnext: 'Sales Invoice',
    summary:
      'Your invoices with their lines, keeping the numbers you already issued. Export with the Items child table included.',
    module: 'invoices',
    after: ['customers', 'products'],
    matchOn: ['number'],
    groupBy: 'number',
    fields: [
      {
        key: 'number',
        label: 'Invoice number',
        hint: 'Required, and kept exactly as it is. In ERPNext this is the ID column.',
        type: 'text',
        required: true,
        aliases: [
          'id',
          'name',
          'invoiceno',
          'invoicenumber',
          'number',
          'documentno',
          'voucherno',
          'billno',
        ],
      },
      {
        key: 'customerName',
        label: 'Customer',
        hint: 'Matched to a customer by their reference first, then by name. Required.',
        type: 'text',
        required: true,
        aliases: ['customer', 'customername', 'party', 'partyname', 'client', 'billto'],
      },
      {
        key: 'issueDate',
        label: 'Invoice date',
        hint: 'Required.',
        type: 'date',
        required: true,
        aliases: ['postingdate', 'date', 'invoicedate', 'transactiondate', 'issuedate'],
      },
      {
        key: 'dueDate',
        label: 'Due date',
        hint: 'Falls back to the customer’s payment terms when the column is absent.',
        type: 'date',
        aliases: ['paymentduedate', 'duedate', 'dueon', 'paymentdue'],
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'text',
        aliases: ['currency'],
      },
      {
        key: 'status',
        label: 'Status',
        hint: 'Unpaid, paid, overdue, cancelled or draft.',
        type: 'enum',
        aliases: ['status', 'docstatus'],
        values: {
          draft: 'DRAFT',
          '0': 'DRAFT',
          submitted: 'SENT',
          '1': 'SENT',
          unpaid: 'SENT',
          sent: 'SENT',
          open: 'SENT',
          viewed: 'VIEWED',
          partlypaid: 'PARTIALLY_PAID',
          partiallypaid: 'PARTIALLY_PAID',
          paid: 'PAID',
          closed: 'PAID',
          overdue: 'OVERDUE',
          cancelled: 'CANCELLED',
          canceled: 'CANCELLED',
          '2': 'CANCELLED',
          return: 'CANCELLED',
          creditnoteissued: 'CANCELLED',
        },
        fallback: 'SENT',
      },
      {
        key: 'amountPaid',
        label: 'Amount already paid',
        hint: 'What has been received against it. The balance owing is worked out from this.',
        type: 'number',
        aliases: ['paidamount', 'amountpaid', 'advancepaid', 'received', 'amountreceived'],
      },
      {
        key: 'discountValue',
        label: 'Invoice discount',
        hint: 'A cash amount off the whole invoice, not a percentage.',
        type: 'number',
        aliases: ['additionaldiscountamount', 'discountamount', 'invoicediscount'],
      },
      {
        key: 'reference',
        label: 'Their order number',
        type: 'text',
        aliases: ['pono', 'ponumber', 'purchaseorder', 'customerpo', 'reference', 'yourreference'],
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'text',
        aliases: ['remarks', 'notes', 'comments'],
      },
      {
        key: 'terms',
        label: 'Terms',
        type: 'text',
        aliases: ['termsandconditions', 'terms', 'tc', 'termsanddetails'],
      },

      {
        key: 'lineSku',
        label: 'Line: product code',
        hint: 'Matched to a product by code. A code we do not hold still imports, as a line without a product behind it.',
        type: 'text',
        line: true,
        aliases: ['itemcodeitems', 'itemcode', 'sku', 'productcode', 'codeitems'],
      },
      {
        key: 'lineName',
        label: 'Line: description',
        hint: 'Required. Falls back to the product code when blank.',
        type: 'text',
        line: true,
        aliases: [
          'itemnameitems',
          'itemname',
          'descriptionitems',
          'description',
          'item',
          'particulars',
        ],
      },
      {
        key: 'lineQuantity',
        label: 'Line: quantity',
        hint: 'Required.',
        type: 'number',
        line: true,
        required: true,
        aliases: ['quantityitems', 'qtyitems', 'quantity', 'qty'],
      },
      {
        key: 'lineUnit',
        label: 'Line: unit',
        type: 'text',
        line: true,
        aliases: ['uomitems', 'uom', 'unititems', 'unit', 'unitofmeasure'],
      },
      {
        key: 'lineUnitPrice',
        label: 'Line: unit price',
        hint: 'Required.',
        type: 'number',
        line: true,
        required: true,
        aliases: ['rateitems', 'rate', 'unitprice', 'priceitems', 'price', 'unitrate'],
      },
      {
        key: 'lineDiscountRate',
        label: 'Line: discount (%)',
        type: 'number',
        line: true,
        aliases: ['discountpercentageitems', 'discountpercentage', 'discountitems', 'discount'],
      },
      {
        key: 'lineTaxRate',
        label: 'Line: tax rate (%)',
        type: 'number',
        line: true,
        aliases: ['taxrateitems', 'taxrate', 'vatrateitems'],
      },
    ],
  },
];

/**
 * The permission that lets somebody import anything at all.
 *
 * Derived from the datasets rather than written out, so adding a sixth thing to
 * import cannot leave the person who may import it unable to find the page.
 */
export function importPermissionKeys(): PermissionKey[] {
  return Array.from(
    new Set(IMPORT_DATASETS.map((dataset) => `${dataset.module}.create` as PermissionKey)),
  );
}

export function findDataset(key: string): ImportDataset | undefined {
  return IMPORT_DATASETS.find((dataset) => dataset.key === key);
}

/** Header text reduced to what two spellings of the same thing have in common. */
export function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

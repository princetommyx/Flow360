/**
 * Realistic demo content for the seeded workspace.
 *
 * Northwind Supply Co. is a fictional commercial interiors supplier: it sells
 * physical goods (so inventory is meaningful) alongside installation services
 * (so services and projects are too).
 */

export const CATEGORIES = [
  { name: 'Workstations', description: 'Desks, benches and height-adjustable frames' },
  { name: 'Seating', description: 'Task chairs, stools and soft seating' },
  { name: 'Storage', description: 'Pedestals, lockers and shelving' },
  { name: 'Acoustics', description: 'Panels, screens and sound treatment' },
  { name: 'Power & data', description: 'Cable management, sockets and modules' },
  { name: 'Services', description: 'Design, delivery and installation labour' },
];

export const SUPPLIERS = [
  {
    name: 'Kestrel Timber Works',
    companyName: 'Kestrel Timber Works Ltd.',
    email: 'orders@kestreltimber.example',
    phone: '+1 (503) 555-0118',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    taxId: 'US-771-204-338',
    paymentTermDays: 30,
  },
  {
    name: 'Vertex Seating',
    companyName: 'Vertex Seating Inc.',
    email: 'supply@vertexseating.example',
    phone: '+1 (312) 555-0143',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    taxId: 'US-660-918-224',
    paymentTermDays: 45,
  },
  {
    name: 'Halcyon Acoustics',
    companyName: 'Halcyon Acoustics LLC',
    email: 'hello@halcyonacoustics.example',
    phone: '+1 (206) 555-0177',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    paymentTermDays: 30,
  },
  {
    name: 'Meridian Electrical Supply',
    companyName: 'Meridian Electrical Supply Co.',
    email: 'accounts@meridianelec.example',
    phone: '+1 (415) 555-0192',
    city: 'Oakland',
    state: 'CA',
    country: 'United States',
    paymentTermDays: 21,
  },
  {
    name: 'Cobalt Metal Fabrication',
    companyName: 'Cobalt Metal Fabrication',
    email: 'sales@cobaltfab.example',
    phone: '+1 (602) 555-0164',
    city: 'Phoenix',
    state: 'AZ',
    country: 'United States',
    paymentTermDays: 30,
  },
];

export const CUSTOMERS = [
  {
    name: 'Priya Raghavan',
    companyName: 'Lumen Health Group',
    email: 'priya.raghavan@lumenhealth.example',
    phone: '+1 (415) 555-0121',
    addressLine1: '2100 Folsom Street',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94110',
    taxId: 'US-338-221-904',
    paymentTermDays: 30,
    notes: 'Rolling refit across four clinics. Purchase orders required on every invoice.',
    tags: ['healthcare', 'key account'],
  },
  {
    name: 'Daniel Okonkwo',
    companyName: 'Fairview Legal Partners',
    email: 'd.okonkwo@fairviewlegal.example',
    phone: '+1 (212) 555-0187',
    addressLine1: '48 Wall Street, Floor 11',
    city: 'New York',
    state: 'NY',
    postalCode: '10005',
    paymentTermDays: 14,
    notes: 'Prefers quotations valid for 30 days. Pays reliably within terms.',
    tags: ['professional services'],
  },
  {
    name: 'Marta Delgado',
    companyName: 'Cobre Coffee Roasters',
    email: 'marta@cobrecoffee.example',
    phone: '+1 (512) 555-0139',
    addressLine1: '910 East 6th Street',
    city: 'Austin',
    state: 'TX',
    postalCode: '78702',
    paymentTermDays: 14,
    notes: 'Opening two new sites this year. Interested in acoustic panelling.',
    tags: ['hospitality', 'growth'],
  },
  {
    name: 'Tom Whitfield',
    companyName: 'Northside Academy Trust',
    email: 'procurement@northsideacademy.example',
    phone: '+1 (617) 555-0155',
    addressLine1: '300 Huntington Avenue',
    city: 'Boston',
    state: 'MA',
    postalCode: '02115',
    taxId: 'US-119-887-455',
    paymentTermDays: 45,
    notes: 'Public sector terms. Invoices must quote the framework reference.',
    tags: ['education', 'public sector'],
  },
  {
    name: 'Alice Chen',
    companyName: 'Bright Harbour Studios',
    email: 'alice.chen@brightharbour.example',
    phone: '+1 (206) 555-0148',
    addressLine1: '77 Yesler Way',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98104',
    paymentTermDays: 14,
    notes: 'Design-led fitout. Signs off quickly but wants samples first.',
    tags: ['creative'],
  },
  {
    name: 'Samuel Boateng',
    companyName: 'Ridgeline Logistics',
    email: 's.boateng@ridgelinelogistics.example',
    phone: '+1 (303) 555-0176',
    addressLine1: '4500 Havana Street',
    city: 'Denver',
    state: 'CO',
    postalCode: '80239',
    paymentTermDays: 30,
    notes: 'Warehouse offices. Volume pricing agreed on storage lines.',
    tags: ['logistics'],
  },
  {
    name: 'Hannah Lindqvist',
    companyName: 'Aster Biotech',
    email: 'hannah.l@asterbiotech.example',
    phone: '+1 (858) 555-0193',
    addressLine1: '11255 Torrey Pines Road',
    city: 'San Diego',
    state: 'CA',
    postalCode: '92121',
    taxId: 'US-502-663-118',
    paymentTermDays: 30,
    notes: 'Lab-adjacent office space. Strict delivery windows.',
    tags: ['life sciences', 'key account'],
  },
  {
    name: 'Owen Pritchard',
    companyName: 'Grainger & Mills Accountants',
    email: 'owen@graingermills.example',
    phone: '+1 (704) 555-0129',
    addressLine1: '620 South Tryon Street',
    city: 'Charlotte',
    state: 'NC',
    postalCode: '28202',
    paymentTermDays: 14,
    notes: 'Small but repeat orders every quarter.',
    tags: ['professional services'],
  },
  {
    name: 'Yara Haddad',
    companyName: 'Solstice Fitness Collective',
    email: 'yara@solsticefitness.example',
    phone: '+1 (305) 555-0161',
    addressLine1: '1801 Biscayne Boulevard',
    city: 'Miami',
    state: 'FL',
    postalCode: '33132',
    paymentTermDays: 21,
    notes: 'Reception and staff areas only. Budget sensitive.',
    tags: ['leisure'],
  },
  {
    name: 'Greg Salter',
    companyName: 'Mercer Property Group',
    email: 'g.salter@mercerproperty.example',
    phone: '+1 (503) 555-0184',
    addressLine1: '1220 SW Morrison Street',
    city: 'Portland',
    state: 'OR',
    postalCode: '97205',
    taxId: 'US-410-775-236',
    paymentTermDays: 30,
    notes: 'Fits out serviced offices. Slow payer, so chase at day 35.',
    tags: ['real estate'],
  },
];

type SeedProduct = {
  name: string;
  sku: string;
  category: string;
  supplier?: string;
  description: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  type?: 'GOOD' | 'SERVICE';
};

export const PRODUCTS: SeedProduct[] = [
  { name: 'Meridian Sit-Stand Desk 1600', sku: 'WS-1600-OAK', category: 'Workstations', supplier: 'Kestrel Timber Works', description: 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', unit: 'unit', purchasePrice: 412, sellingPrice: 749, stockQuantity: 136, minStockLevel: 10 },
  { name: 'Meridian Sit-Stand Desk 1400', sku: 'WS-1400-OAK', category: 'Workstations', supplier: 'Kestrel Timber Works', description: 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', unit: 'unit', purchasePrice: 378, sellingPrice: 689, stockQuantity: 164, minStockLevel: 10 },
  { name: 'Halden Bench Desk 4-Person', sku: 'WS-BEN-4P', category: 'Workstations', supplier: 'Kestrel Timber Works', description: 'Four-person back-to-back bench with shared cable tray.', unit: 'unit', purchasePrice: 960, sellingPrice: 1685, stockQuantity: 32, minStockLevel: 4 },
  { name: 'Corner Workstation 1800', sku: 'WS-CNR-1800', category: 'Workstations', description: 'Fixed-height corner desk with modesty panel.', unit: 'unit', purchasePrice: 246, sellingPrice: 445, stockQuantity: 24, minStockLevel: 8 },
  { name: 'Vertex Ergo Task Chair', sku: 'ST-ERGO-BLK', category: 'Seating', supplier: 'Vertex Seating', description: 'Mesh-back task chair, 4D arms, 10-year frame warranty.', unit: 'unit', purchasePrice: 218, sellingPrice: 399, stockQuantity: 248, minStockLevel: 20 },
  { name: 'Vertex Ergo Task Chair (Headrest)', sku: 'ST-ERGO-HR', category: 'Seating', supplier: 'Vertex Seating', description: 'Ergo task chair with adjustable headrest.', unit: 'unit', purchasePrice: 254, sellingPrice: 459, stockQuantity: 112, minStockLevel: 12 },
  { name: 'Draughtsman Stool', sku: 'ST-DRFT-GRY', category: 'Seating', supplier: 'Vertex Seating', description: 'Height-adjustable stool with footring, grey fabric.', unit: 'unit', purchasePrice: 132, sellingPrice: 249, stockQuantity: 12, minStockLevel: 6 },
  { name: 'Alcove Soft Seating Two-Seat', sku: 'ST-SOFT-2S', category: 'Seating', description: 'High-back two-seat booth in wool-blend upholstery.', unit: 'unit', purchasePrice: 640, sellingPrice: 1150, stockQuantity: 20, minStockLevel: 3 },
  { name: 'Mobile Pedestal 3-Drawer', sku: 'SG-PED-3D', category: 'Storage', supplier: 'Cobalt Metal Fabrication', description: 'Lockable steel pedestal on castors.', unit: 'unit', purchasePrice: 88, sellingPrice: 165, stockQuantity: 296, minStockLevel: 25 },
  { name: 'Personal Locker Bank of 6', sku: 'SG-LOCK-6', category: 'Storage', supplier: 'Cobalt Metal Fabrication', description: 'Six-door locker bank with digital locks.', unit: 'unit', purchasePrice: 470, sellingPrice: 845, stockQuantity: 44, minStockLevel: 5 },
  { name: 'Open Shelving Unit 1800', sku: 'SG-SHLF-1800', category: 'Storage', description: 'Five-tier open shelving, powder-coated steel.', unit: 'unit', purchasePrice: 156, sellingPrice: 289, stockQuantity: 76, minStockLevel: 8 },
  { name: 'Acoustic Desk Screen 1400', sku: 'AC-SCR-1400', category: 'Acoustics', supplier: 'Halcyon Acoustics', description: 'PET felt desk-mounted screen, 1400×400mm.', unit: 'unit', purchasePrice: 62, sellingPrice: 119, stockQuantity: 352, minStockLevel: 30 },
  { name: 'Acoustic Wall Panel 600×600', sku: 'AC-PNL-600', category: 'Acoustics', supplier: 'Halcyon Acoustics', description: 'Class A absorber panel, 40mm, concealed fixings.', unit: 'unit', purchasePrice: 44, sellingPrice: 84, stockQuantity: 840, minStockLevel: 60 },
  { name: 'Acoustic Ceiling Baffle', sku: 'AC-BAF-1200', category: 'Acoustics', supplier: 'Halcyon Acoustics', description: 'Suspended vertical baffle, 1200×300mm.', unit: 'unit', purchasePrice: 58, sellingPrice: 108, stockQuantity: 96, minStockLevel: 30 },
  { name: 'Phone Booth Single', sku: 'AC-BOOTH-1P', category: 'Acoustics', description: 'Single-occupancy acoustic pod with ventilation and lighting.', unit: 'unit', purchasePrice: 3150, sellingPrice: 5290, stockQuantity: 8, minStockLevel: 2 },
  { name: 'Desktop Power Module 2×Socket', sku: 'PD-PWR-2S', category: 'Power & data', supplier: 'Meridian Electrical Supply', description: 'Clamp-on module with two sockets and two USB-C.', unit: 'unit', purchasePrice: 41, sellingPrice: 79, stockQuantity: 520, minStockLevel: 40 },
  { name: 'Vertical Cable Spine', sku: 'PD-CBL-SPN', category: 'Power & data', supplier: 'Meridian Electrical Supply', description: 'Flexible spine routing cables from desk to floor box.', unit: 'unit', purchasePrice: 22, sellingPrice: 45, stockQuantity: 384, minStockLevel: 30 },
  { name: 'Under-Desk Cable Tray 1200', sku: 'PD-TRY-1200', category: 'Power & data', description: 'Perforated steel cable tray with fixings.', unit: 'unit', purchasePrice: 17, sellingPrice: 34, stockQuantity: 580, minStockLevel: 50 },
  { name: 'Space Planning & Design', sku: 'SV-DESIGN', category: 'Services', description: 'CAD space planning, furniture specification and 3D visuals.', unit: 'hour', purchasePrice: 0, sellingPrice: 125, stockQuantity: 0, minStockLevel: 0, type: 'SERVICE' },
  { name: 'Delivery & Installation', sku: 'SV-INSTALL', category: 'Services', description: 'Two-person install team, build, placement and waste removal.', unit: 'hour', purchasePrice: 0, sellingPrice: 88, stockQuantity: 0, minStockLevel: 0, type: 'SERVICE' },
];

export const EMPLOYEES = [
  { firstName: 'Nadia', lastName: 'Osei', email: 'nadia.osei@northwindsupply.example', department: 'Sales', position: 'Head of Sales', baseSalary: 7400, hiredMonthsAgo: 41, phone: '+1 (415) 555-0210' },
  { firstName: 'Ben', lastName: 'Ferraro', email: 'ben.ferraro@northwindsupply.example', department: 'Operations', position: 'Operations Manager', baseSalary: 6600, hiredMonthsAgo: 33, phone: '+1 (415) 555-0211' },
  { firstName: 'Clara', lastName: 'Nkemelu', email: 'clara.nkemelu@northwindsupply.example', department: 'Finance', position: 'Management Accountant', baseSalary: 6100, hiredMonthsAgo: 22, phone: '+1 (415) 555-0212' },
  { firstName: 'Diego', lastName: 'Marín', email: 'diego.marin@northwindsupply.example', department: 'Projects', position: 'Senior Project Manager', baseSalary: 6850, hiredMonthsAgo: 17, phone: '+1 (415) 555-0213' },
  { firstName: 'Sophie', lastName: 'Lang', email: 'sophie.lang@northwindsupply.example', department: 'Design', position: 'Interior Designer', baseSalary: 5400, hiredMonthsAgo: 9, phone: '+1 (415) 555-0214' },
];

/**
 * Recurring monthly costs, replayed across the seeded six-month window so the
 * expense trend has a believable baseline rather than one spike.
 */
export const RECURRING_EXPENSES = [
  { title: 'Warehouse rent', category: 'Rent & facilities', amount: 2800, vendorName: 'Bayfront Industrial Estates', method: 'BANK_TRANSFER' },
  { title: 'Design software licences (5 seats)', category: 'Software & subscriptions', amount: 745, vendorName: 'Formline CAD', method: 'CARD' },
  { title: 'Warehouse electricity', category: 'Utilities', amount: 486.15, vendorName: 'Pacific Grid Energy', method: 'BANK_TRANSFER' },
  { title: 'Accountancy retainer', category: 'Professional services', amount: 1450, vendorName: 'Grainger & Mills Accountants', method: 'BANK_TRANSFER' },
  { title: 'Delivery van fuel and tolls', category: 'Travel', amount: 612.4, vendorName: 'Fleet Fuel Card', method: 'CARD' },
] as const;

export const EXPENSE_ROWS = [
  { title: 'Warehouse rent, quarterly', category: 'Rent & facilities', amount: 8400, vendorName: 'Bayfront Industrial Estates', method: 'BANK_TRANSFER', daysAgo: 12 },
  { title: 'Delivery van fuel and tolls', category: 'Travel', amount: 612.4, vendorName: 'Fleet Fuel Card', method: 'CARD', daysAgo: 5 },
  { title: 'Design software licences (5 seats)', category: 'Software & subscriptions', amount: 745, vendorName: 'Formline CAD', method: 'CARD', daysAgo: 19 },
  { title: 'Trade show stand at Workspace Expo', category: 'Marketing', amount: 3250, vendorName: 'Workspace Expo Ltd.', method: 'BANK_TRANSFER', daysAgo: 27 },
  { title: 'Warehouse electricity', category: 'Utilities', amount: 486.15, vendorName: 'Pacific Grid Energy', method: 'BANK_TRANSFER', daysAgo: 8 },
  { title: 'Forklift annual service', category: 'Equipment', amount: 1180, vendorName: 'Halton Materials Handling', method: 'BANK_TRANSFER', daysAgo: 34 },
  { title: 'Accountancy retainer', category: 'Professional services', amount: 1450, vendorName: 'Grainger & Mills Accountants', method: 'BANK_TRANSFER', daysAgo: 15 },
  { title: 'Packing materials and pallets', category: 'Office supplies', amount: 398.7, vendorName: 'Crate & Wrap Supplies', method: 'CARD', daysAgo: 3 },
  { title: 'Installer team overnight accommodation', category: 'Travel', amount: 864, vendorName: 'Riverside Inn', method: 'CARD', daysAgo: 21 },
  { title: 'Liability insurance premium', category: 'Professional services', amount: 2240, vendorName: 'Ashworth Commercial Insurance', method: 'BANK_TRANSFER', daysAgo: 45 },
];

export const PROJECTS = [
  {
    code: 'PRJ-LUMEN-01',
    name: 'Lumen Health, Mission Bay clinic refit',
    customer: 'Lumen Health Group',
    description: 'Full furniture package for a 42-desk clinical admin floor, phased over two weekends.',
    budget: 96000,
    status: 'ACTIVE',
    progress: 62,
    startMonthsAgo: 3,
    endMonthsAhead: 2,
  },
  {
    code: 'PRJ-ASTER-01',
    name: 'Aster Biotech, Torrey Pines office expansion',
    customer: 'Aster Biotech',
    description: 'New 28-person office adjacent to the lab, including acoustic treatment and two phone booths.',
    budget: 64000,
    status: 'ACTIVE',
    progress: 34,
    startMonthsAgo: 1,
    endMonthsAhead: 4,
  },
  {
    code: 'PRJ-COBRE-01',
    name: 'Cobre Coffee, East 6th flagship',
    customer: 'Cobre Coffee Roasters',
    description: 'Back-of-house office and staff room fitout alongside the new roastery build.',
    budget: 28500,
    status: 'COMPLETED',
    progress: 100,
    startMonthsAgo: 7,
    endMonthsAhead: -2,
  },
];

export const TASKS = [
  { project: 'PRJ-LUMEN-01', title: 'Confirm final desk layout with facilities team', status: 'DONE', priority: 'HIGH', dueInDays: -9, hours: 3 },
  { project: 'PRJ-LUMEN-01', title: 'Place order for 42 sit-stand frames', status: 'DONE', priority: 'URGENT', dueInDays: -4, hours: 2 },
  { project: 'PRJ-LUMEN-01', title: 'Schedule phase two install weekend', status: 'IN_PROGRESS', priority: 'HIGH', dueInDays: 6, hours: 4 },
  { project: 'PRJ-LUMEN-01', title: 'Snag list walkthrough with client', status: 'TODO', priority: 'MEDIUM', dueInDays: 18, hours: 5 },
  { project: 'PRJ-ASTER-01', title: 'Acoustic survey of the open-plan bay', status: 'DONE', priority: 'MEDIUM', dueInDays: -12, hours: 6 },
  { project: 'PRJ-ASTER-01', title: 'Present two-option furniture scheme', status: 'IN_REVIEW', priority: 'HIGH', dueInDays: 3, hours: 9 },
  { project: 'PRJ-ASTER-01', title: 'Confirm lead time on phone booths', status: 'BLOCKED', priority: 'URGENT', dueInDays: 1, hours: 1.5 },
  { project: 'PRJ-ASTER-01', title: 'Issue revised quotation after value engineering', status: 'TODO', priority: 'MEDIUM', dueInDays: 11, hours: 3 },
  { project: 'PRJ-COBRE-01', title: 'Final handover pack and warranties', status: 'DONE', priority: 'LOW', dueInDays: -46, hours: 2 },
  { project: null, title: 'Refresh the 2026 price list', status: 'IN_PROGRESS', priority: 'MEDIUM', dueInDays: 14, hours: 8 },
  { project: null, title: 'Chase overdue balances above 30 days', status: 'TODO', priority: 'HIGH', dueInDays: 2, hours: 2 },
  { project: null, title: 'Stock count in the acoustics aisle', status: 'TODO', priority: 'LOW', dueInDays: 21, hours: 4 },
];

export const PAYMENT_NOTES = [
  'Bank transfer received, reference matched automatically.',
  'Part payment on account ahead of the second delivery.',
  'Settled in full within terms.',
  'Card payment taken over the phone.',
  'Cleared after statement chase.',
];

-- Adwuma360: one-file database setup
--
-- Paste this whole file into your database provider's SQL editor and run it:
--   Supabase  ->  SQL Editor -> New query
--   Neon      ->  SQL Editor
--   Any psql  ->  \i flow360-setup.sql
--
-- It creates the schema, records the migrations as applied (so future
-- `prisma migrate deploy` runs pick up from here), and loads the demo
-- dataset so the dashboard has something to show.
--
-- Safe to run on an EMPTY database only. It will fail loudly rather than
-- half-apply: everything runs in one transaction.
--
-- Demo sign-in after running this:
--   owner@northwindsupply.example  /  Flow360Demo!
--   rosa@harbourfitouts.example    /  Flow360Demo!   (second company)

BEGIN;

-- ===== migration: 20260912231858_init =====
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'INVITATION');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PartyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('GOOD', 'SERVICE');

-- CreateEnum
CREATE TYPE "InventoryMovement" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE', 'PURCHASE', 'RETURN_IN', 'RETURN_OUT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'CHECK', 'MOBILE_MONEY', 'ONLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'BILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REIMBURSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('BANK', 'CASH', 'CREDIT_CARD', 'MOBILE_MONEY', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'PROBATION', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVOICE_PAID', 'INVOICE_OVERDUE', 'QUOTE_ACCEPTED', 'LOW_STOCK', 'PAYMENT_RECEIVED', 'TASK_ASSIGNED', 'PAYROLL_PROCESSED', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "emailVerified" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "identifier" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "industry" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "branchId" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "quotationPrefix" TEXT NOT NULL DEFAULT 'QTE',
    "paymentPrefix" TEXT NOT NULL DEFAULT 'PAY',
    "purchaseOrderPrefix" TEXT NOT NULL DEFAULT 'PO',
    "numberPadding" INTEGER NOT NULL DEFAULT 5,
    "numberIncludeYear" BOOLEAN NOT NULL DEFAULT true,
    "defaultPaymentTermDays" INTEGER NOT NULL DEFAULT 14,
    "defaultInvoiceNotes" TEXT,
    "paymentInstructions" TEXT,
    "invoiceFooter" TEXT,
    "taxLabel" TEXT NOT NULL DEFAULT 'Sales Tax',
    "defaultTaxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "pricesIncludeTax" BOOLEAN NOT NULL DEFAULT false,
    "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnInvoicePaid" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnLowStock" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnQuoteAccepted" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnOverdue" BOOLEAN NOT NULL DEFAULT true,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(6,3) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCompound" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "creditLimit" DECIMAL(18,2),
    "paymentTermDays" INTEGER NOT NULL DEFAULT 14,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "status" "PartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'GOOD',
    "categoryId" TEXT,
    "supplierId" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "purchasePrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "stockQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "minStockLevel" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "status" "PartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "InventoryMovement" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "balanceAfter" DECIMAL(18,3) NOT NULL,
    "unitCost" DECIMAL(18,2),
    "reference" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "customerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "reference" TEXT,
    "quotationId" TEXT,
    "projectId" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "discountRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(18,2) NOT NULL,
    "lineDiscount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "discountRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(18,2) NOT NULL,
    "lineDiscount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "invoiceId" TEXT,
    "billId" TEXT,
    "accountId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "receivedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(18,2) NOT NULL,
    "lineTax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "number" TEXT NOT NULL,
    "supplierRef" TEXT,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_items" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "taxRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(18,2) NOT NULL,
    "lineTax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "categoryId" TEXT,
    "supplierId" TEXT,
    "projectId" TEXT,
    "accountId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CARD',
    "status" "ExpenseStatus" NOT NULL DEFAULT 'APPROVED',
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendorName" TEXT,
    "reference" TEXT,
    "receiptUrl" TEXT,
    "receiptName" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL DEFAULT 'BANK',
    "accountNumber" TEXT,
    "bankName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT NOT NULL,
    "category" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "toAccountId" TEXT,
    "invoiceId" TEXT,
    "billId" TEXT,
    "paymentId" TEXT,
    "expenseId" TEXT,
    "customerId" TEXT,
    "projectId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "position" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hiredAt" TIMESTAMP(3) NOT NULL,
    "terminatedAt" TIMESTAMP(3),
    "baseSalary" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "addressLine1" TEXT,
    "city" TEXT,
    "country" TEXT,
    "bankAccount" TEXT,
    "taxNumber" TEXT,
    "notes" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "baseSalary" DECIMAL(18,2) NOT NULL,
    "allowances" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxDeduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "hoursWorked" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "spent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Contributor',
    "hourlyRate" DECIMAL(18,2),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DECIMAL(6,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "employeeId" TEXT,
    "userId" TEXT,
    "date" DATE NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_type_idx" ON "verification_tokens"("identifier", "type");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "branches_organizationId_idx" ON "branches"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organizationId_code_key" ON "branches"("organizationId", "code");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_status_idx" ON "organization_members"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "roles_organizationId_idx" ON "roles"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_key_key" ON "roles"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_organizationId_key" ON "company_settings"("organizationId");

-- CreateIndex
CREATE INDEX "tax_rates_organizationId_idx" ON "tax_rates"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_organizationId_name_key" ON "tax_rates"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_organizationId_docType_year_key" ON "number_sequences"("organizationId", "docType", "year");

-- CreateIndex
CREATE INDEX "customers_organizationId_status_idx" ON "customers"("organizationId", "status");

-- CreateIndex
CREATE INDEX "customers_organizationId_name_idx" ON "customers"("organizationId", "name");

-- CreateIndex
CREATE INDEX "suppliers_organizationId_status_idx" ON "suppliers"("organizationId", "status");

-- CreateIndex
CREATE INDEX "suppliers_organizationId_name_idx" ON "suppliers"("organizationId", "name");

-- CreateIndex
CREATE INDEX "product_categories_organizationId_idx" ON "product_categories"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_organizationId_name_key" ON "product_categories"("organizationId", "name");

-- CreateIndex
CREATE INDEX "products_organizationId_status_idx" ON "products"("organizationId", "status");

-- CreateIndex
CREATE INDEX "products_organizationId_categoryId_idx" ON "products"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "products_organizationId_sku_key" ON "products"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "inventory_transactions_organizationId_productId_occurredAt_idx" ON "inventory_transactions"("organizationId", "productId", "occurredAt");

-- CreateIndex
CREATE INDEX "inventory_transactions_organizationId_type_idx" ON "inventory_transactions"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_quotationId_key" ON "invoices"("quotationId");

-- CreateIndex
CREATE INDEX "invoices_organizationId_status_idx" ON "invoices"("organizationId", "status");

-- CreateIndex
CREATE INDEX "invoices_organizationId_customerId_idx" ON "invoices"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "invoices_organizationId_issueDate_idx" ON "invoices"("organizationId", "issueDate");

-- CreateIndex
CREATE INDEX "invoices_organizationId_dueDate_idx" ON "invoices"("organizationId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_organizationId_number_key" ON "invoices"("organizationId", "number");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "quotations_organizationId_status_idx" ON "quotations"("organizationId", "status");

-- CreateIndex
CREATE INDEX "quotations_organizationId_customerId_idx" ON "quotations"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_organizationId_number_key" ON "quotations"("organizationId", "number");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- CreateIndex
CREATE INDEX "payments_organizationId_direction_paidAt_idx" ON "payments"("organizationId", "direction", "paidAt");

-- CreateIndex
CREATE INDEX "payments_organizationId_invoiceId_idx" ON "payments"("organizationId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_organizationId_number_key" ON "payments"("organizationId", "number");

-- CreateIndex
CREATE INDEX "purchase_orders_organizationId_status_idx" ON "purchase_orders"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_organizationId_number_key" ON "purchase_orders"("organizationId", "number");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "bills_organizationId_status_idx" ON "bills"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bills_organizationId_number_key" ON "bills"("organizationId", "number");

-- CreateIndex
CREATE INDEX "bill_items_billId_idx" ON "bill_items"("billId");

-- CreateIndex
CREATE INDEX "expense_categories_organizationId_idx" ON "expense_categories"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_organizationId_name_key" ON "expense_categories"("organizationId", "name");

-- CreateIndex
CREATE INDEX "expenses_organizationId_spentAt_idx" ON "expenses"("organizationId", "spentAt");

-- CreateIndex
CREATE INDEX "expenses_organizationId_categoryId_idx" ON "expenses"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_organizationId_number_key" ON "expenses"("organizationId", "number");

-- CreateIndex
CREATE INDEX "accounts_organizationId_idx" ON "accounts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_organizationId_name_key" ON "accounts"("organizationId", "name");

-- CreateIndex
CREATE INDEX "transactions_organizationId_occurredAt_idx" ON "transactions"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "transactions_organizationId_accountId_idx" ON "transactions"("organizationId", "accountId");

-- CreateIndex
CREATE INDEX "transactions_organizationId_type_idx" ON "transactions"("organizationId", "type");

-- CreateIndex
CREATE INDEX "employees_organizationId_status_idx" ON "employees"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeNumber_key" ON "employees"("organizationId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_email_key" ON "employees"("organizationId", "email");

-- CreateIndex
CREATE INDEX "payrolls_organizationId_status_idx" ON "payrolls"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_organizationId_number_key" ON "payrolls"("organizationId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_employeeId_periodStart_periodEnd_key" ON "payrolls"("employeeId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "attendances_organizationId_date_idx" ON "attendances"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- CreateIndex
CREATE INDEX "projects_organizationId_status_idx" ON "projects"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organizationId_code_key" ON "projects"("organizationId", "code");

-- CreateIndex
CREATE INDEX "project_members_employeeId_idx" ON "project_members"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_employeeId_key" ON "project_members"("projectId", "employeeId");

-- CreateIndex
CREATE INDEX "tasks_organizationId_status_idx" ON "tasks"("organizationId", "status");

-- CreateIndex
CREATE INDEX "tasks_organizationId_projectId_idx" ON "tasks"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "timesheets_organizationId_date_idx" ON "timesheets"("organizationId", "date");

-- CreateIndex
CREATE INDEX "timesheets_projectId_idx" ON "timesheets"("projectId");

-- CreateIndex
CREATE INDEX "notifications_organizationId_userId_readAt_idx" ON "notifications"("organizationId", "userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_organizationId_createdAt_idx" ON "activity_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_organizationId_entityType_entityId_idx" ON "activity_logs"("organizationId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== migration: 20260913230103_add_trial_and_subscription =====
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "requestedPlan" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- ===== migration: 20260914203514_verification_codes =====
-- AlterTable
ALTER TABLE "verification_tokens" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "codeHash" TEXT;

-- ===== migration: 20260914203552_requested_billing_period =====
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "requestedBilling" TEXT;

-- ===== migration: 20260915020536_ghana_defaults =====
-- AlterTable
ALTER TABLE "company_settings" ALTER COLUMN "taxLabel" SET DEFAULT 'VAT';

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "country" SET DEFAULT 'Ghana',
ALTER COLUMN "currency" SET DEFAULT 'GHS',
ALTER COLUMN "timezone" SET DEFAULT 'Africa/Accra';

-- ===== migration: 20260915112928_platform_admin =====
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_audit_logs_createdAt_idx" ON "platform_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "platform_audit_logs_targetType_targetId_idx" ON "platform_audit_logs"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== migration history =====
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id                      VARCHAR(36) PRIMARY KEY NOT NULL,
    checksum                VARCHAR(64) NOT NULL,
    finished_at             TIMESTAMPTZ,
    migration_name          VARCHAR(255) NOT NULL,
    logs                    TEXT,
    rolled_back_at          TIMESTAMPTZ,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, 'a2b779a1a1709d6ce46833e4de94e3fdf4141877ab8fc4740535e9772f327450', now(), '20260912231858_init', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '502c661c3ff28ba12a62d2d0e47ff9c701aee8e8279cdac51cf0c424963d678e', now(), '20260913230103_add_trial_and_subscription', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, 'b37c9fd0ded3213b306118ad5b24b18dc712dc0a8d5f6da20d725e66a5f7b6e4', now(), '20260914203514_verification_codes', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, 'fe1cf463d627d8e7193c2d3e585a3db9e0b65aa700dfed34eeb263c1089de5f3', now(), '20260914203552_requested_billing_period', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '6582b5b3a17f2c15c17aa5b26edf7e58f4f6c6201f94176619c43fab1ee37e8b', now(), '20260915020536_ghana_defaults', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, 'f3c124c9589ca4dc8b46ff6825fa796f5c239cfe9b1cb6a5d0708278684d4c29', now(), '20260915112928_platform_admin', now(), 1);

-- ===== demo dataset =====
--
-- PostgreSQL database dump
--

\restrict LbJM1sqwZLhZxYWXwNMuue4uSZ46p92iAgrUv6Ia8jyrE91JKl8drs7wsX6edGd

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organizations (id, name, slug, "legalName", email, phone, website, "taxId", "logoUrl", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, timezone, industry, plan, "isActive", "createdAt", "updatedAt", "deletedAt", "requestedPlan", "subscriptionStatus", "trialEndsAt", "requestedBilling") VALUES ('cmu2m5q7v0037re7dsgqq4eos', 'Northwind Supply Co.', 'northwind-supply-co', 'Northwind Supply Company LLC', 'accounts@northwindsupply.example', '+1 (415) 555-0200', 'https://northwindsupply.example', 'US-884-120-663', NULL, '1400 Cesar Chavez Street', 'Unit 22', 'San Francisco', 'CA', '94107', 'Ghana', 'GHS', 'Africa/Accra', 'Commercial interiors', 'business', true, '2026-09-15 11:53:51.355', '2026-09-15 11:53:51.457', NULL, NULL, 'trialing', '2026-10-03 11:53:50.552', NULL);
INSERT INTO public.organizations (id, name, slug, "legalName", email, phone, website, "taxId", "logoUrl", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, timezone, industry, plan, "isActive", "createdAt", "updatedAt", "deletedAt", "requestedPlan", "subscriptionStatus", "trialEndsAt", "requestedBilling") VALUES ('cmu2m5qaw003xre7dcpy0qz9q', 'Harbour Fitouts Ltd.', 'harbour-fitouts', NULL, 'hello@harbourfitouts.example', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Ghana', 'GHS', 'Africa/Accra', NULL, 'business', true, '2026-09-15 11:53:51.464', '2026-09-15 11:53:51.526', NULL, NULL, 'trialing', '2026-09-19 11:53:50.552', NULL);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcg0048re7dj9zg7lg0', 'cmu2m5qaw003xre7dcpy0qz9q', 'Main business account', 'BANK', NULL, NULL, 'GHS', 0.00, 0.00, NULL, true, true, '2026-09-15 11:53:51.52', '2026-09-15 11:53:51.52', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcg0049re7ddq39x22h', 'cmu2m5qaw003xre7dcpy0qz9q', 'Petty cash', 'CASH', NULL, NULL, 'GHS', 0.00, 0.00, NULL, false, true, '2026-09-15 11:53:51.52', '2026-09-15 11:53:51.52', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa3003ire7drzf97vel', 'cmu2m5q7v0037re7dsgqq4eos', 'Main business account', 'BANK', NULL, NULL, 'GHS', 0.00, 288710.62, NULL, true, true, '2026-09-15 11:53:51.435', '2026-09-15 11:53:53.035', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa3003jre7dzso0skva', 'cmu2m5q7v0037re7dsgqq4eos', 'Petty cash', 'CASH', NULL, NULL, 'GHS', 0.00, -11840.95, NULL, false, true, '2026-09-15 11:53:51.435', '2026-09-15 11:53:53.042', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu2m5q5g0000re7ds30hqedv', 'owner@northwindsupply.example', 'Alex Moreno', '$2b$12$cwiDbsCvw7gJTJaBufZ.3.9/08jL21kKX9VKBkYqs9blbi6BJiOke', NULL, '+1 (415) 555-0201', 'Managing Director', '2026-09-15 11:53:50.552', NULL, true, '2026-09-15 11:53:51.268', '2026-09-15 11:53:51.268', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu2m5q5o0001re7dxg2h1r3n', 'nadia@northwindsupply.example', 'Nadia Osei', '$2b$12$cwiDbsCvw7gJTJaBufZ.3.9/08jL21kKX9VKBkYqs9blbi6BJiOke', NULL, NULL, 'Head of Sales', '2026-09-15 11:53:50.552', NULL, true, '2026-09-15 11:53:51.276', '2026-09-15 11:53:51.276', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu2m5q5o0002re7dmvjckt3y', 'clara@northwindsupply.example', 'Clara Nkemelu', '$2b$12$cwiDbsCvw7gJTJaBufZ.3.9/08jL21kKX9VKBkYqs9blbi6BJiOke', NULL, NULL, 'Management Accountant', '2026-09-15 11:53:50.552', NULL, true, '2026-09-15 11:53:51.276', '2026-09-15 11:53:51.276', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu2m5q5o0003re7dlw07mjgu', 'sophie@northwindsupply.example', 'Sophie Lang', '$2b$12$cwiDbsCvw7gJTJaBufZ.3.9/08jL21kKX9VKBkYqs9blbi6BJiOke', NULL, NULL, 'Interior Designer', '2026-09-15 11:53:50.552', NULL, true, '2026-09-15 11:53:51.276', '2026-09-15 11:53:51.276', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu2m5q5o0004re7dol5lwuj8', 'ben@northwindsupply.example', 'Ben Ferraro', '$2b$12$cwiDbsCvw7gJTJaBufZ.3.9/08jL21kKX9VKBkYqs9blbi6BJiOke', NULL, NULL, 'Operations Manager', '2026-09-15 11:53:50.552', NULL, true, '2026-09-15 11:53:51.276', '2026-09-15 11:53:51.276', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu2m5qar003wre7dber919ev', 'rosa@harbourfitouts.example', 'Rosa Iglesias', '$2b$12$cwiDbsCvw7gJTJaBufZ.3.9/08jL21kKX9VKBkYqs9blbi6BJiOke', NULL, NULL, 'Founder', '2026-09-15 11:53:50.552', NULL, true, '2026-09-15 11:53:51.459', '2026-09-15 11:53:51.459', false);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhr0066re7d223p036b', 'cmu2m5q7v0037re7dsgqq4eos', 'EMP-0001', 'Nadia', 'Osei', 'nadia.osei@northwindsupply.example', '+1 (415) 555-0210', 'Sales', 'Head of Sales', 'FULL_TIME', 'ACTIVE', '2023-04-15 11:53:50.552', NULL, 7400.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-15 11:53:51.711', '2026-09-15 11:53:51.711', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhv0067re7dyohqyjnb', 'cmu2m5q7v0037re7dsgqq4eos', 'EMP-0002', 'Ben', 'Ferraro', 'ben.ferraro@northwindsupply.example', '+1 (415) 555-0211', 'Operations', 'Operations Manager', 'FULL_TIME', 'ACTIVE', '2023-12-15 11:53:50.552', NULL, 6600.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-15 11:53:51.715', '2026-09-15 11:53:51.715', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhy0068re7dm756psna', 'cmu2m5q7v0037re7dsgqq4eos', 'EMP-0003', 'Clara', 'Nkemelu', 'clara.nkemelu@northwindsupply.example', '+1 (415) 555-0212', 'Finance', 'Management Accountant', 'FULL_TIME', 'ACTIVE', '2024-11-15 11:53:50.552', NULL, 6100.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-15 11:53:51.718', '2026-09-15 11:53:51.718', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qi10069re7dos47diqv', 'cmu2m5q7v0037re7dsgqq4eos', 'EMP-0004', 'Diego', 'Marín', 'diego.marin@northwindsupply.example', '+1 (415) 555-0213', 'Projects', 'Senior Project Manager', 'FULL_TIME', 'ACTIVE', '2025-04-15 11:53:50.552', NULL, 6850.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-15 11:53:51.721', '2026-09-15 11:53:51.721', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qi4006are7dlpp3r968', 'cmu2m5q7v0037re7dsgqq4eos', 'EMP-0005', 'Sophie', 'Lang', 'sophie.lang@northwindsupply.example', '+1 (415) 555-0214', 'Design', 'Interior Designer', 'FULL_TIME', 'ACTIVE', '2025-12-15 11:53:50.552', NULL, 5400.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-15 11:53:51.724', '2026-09-15 11:53:51.724', NULL);


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rl700l0re7dbt9hm5zp', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.131', '2026-09-15 11:53:53.131');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rl900l1re7d7a6kkddy', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', '2026-09-11', 'LATE', NULL, NULL, 7.00, NULL, '2026-09-15 11:53:53.133', '2026-09-15 11:53:53.133');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlb00l2re7d3fi90l7x', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.135', '2026-09-15 11:53:53.135');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlc00l3re7dyeh3r9jj', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.136', '2026-09-15 11:53:53.136');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rld00l4re7dft1yzpos', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.137', '2026-09-15 11:53:53.137');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlf00l5re7dqjrys8kq', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.139', '2026-09-15 11:53:53.139');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlg00l6re7dm7mdom46', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.14', '2026-09-15 11:53:53.14');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlh00l7re7dbdqewt0f', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', '2026-09-11', 'LATE', NULL, NULL, 7.00, NULL, '2026-09-15 11:53:53.141', '2026-09-15 11:53:53.141');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rli00l8re7dv0rwj0v3', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.142', '2026-09-15 11:53:53.142');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlj00l9re7daeg5k9sk', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.143', '2026-09-15 11:53:53.143');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlk00lare7d85hfdyum', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.144', '2026-09-15 11:53:53.144');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlm00lbre7dm1zs5k4v', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.146', '2026-09-15 11:53:53.146');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rln00lcre7dhgqna6oh', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.147', '2026-09-15 11:53:53.147');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlo00ldre7diiww1khc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', '2026-09-11', 'LATE', NULL, NULL, 7.00, NULL, '2026-09-15 11:53:53.148', '2026-09-15 11:53:53.148');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlp00lere7dg6f2wpib', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.149', '2026-09-15 11:53:53.149');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rls00lfre7dxng0x763', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.152', '2026-09-15 11:53:53.152');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlt00lgre7dzjfn7wsh', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.153', '2026-09-15 11:53:53.153');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlv00lhre7dz7p5stz1', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.155', '2026-09-15 11:53:53.155');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlw00lire7dt9tu5kec', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.156', '2026-09-15 11:53:53.156');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlx00ljre7d2a0mt3h7', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', '2026-09-11', 'LATE', NULL, NULL, 7.00, NULL, '2026-09-15 11:53:53.157', '2026-09-15 11:53:53.157');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rly00lkre7d7eut74sd', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.158', '2026-09-15 11:53:53.158');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rlz00llre7dnpcpcyo9', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.159', '2026-09-15 11:53:53.159');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm000lmre7d81hlizts', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.16', '2026-09-15 11:53:53.16');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm100lnre7dyotnqq6o', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.161', '2026-09-15 11:53:53.161');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm300lore7d4s5ff3ms', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.163', '2026-09-15 11:53:53.163');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm400lpre7d97cqri91', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', '2026-09-11', 'LATE', NULL, NULL, 7.00, NULL, '2026-09-15 11:53:53.164', '2026-09-15 11:53:53.164');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm500lqre7dx5xaijw0', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.165', '2026-09-15 11:53:53.165');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm600lrre7djup8ps0z', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.166', '2026-09-15 11:53:53.166');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm700lsre7dnbxxo1we', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.167', '2026-09-15 11:53:53.167');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu2m5rm800ltre7dwak160ax', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-15 11:53:53.168', '2026-09-15 11:53:53.168');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qd5004pre7djmw9lqkq', 'cmu2m5q7v0037re7dsgqq4eos', 'Kestrel Timber Works', 'Kestrel Timber Works Ltd.', 'orders@kestreltimber.example', '+1 (503) 555-0118', NULL, 'US-771-204-338', NULL, 'Portland', 'OR', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-15 11:53:51.545', '2026-09-15 11:53:51.545', NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qd8004qre7dca56ydwm', 'cmu2m5q7v0037re7dsgqq4eos', 'Vertex Seating', 'Vertex Seating Inc.', 'supply@vertexseating.example', '+1 (312) 555-0143', NULL, 'US-660-918-224', NULL, 'Chicago', 'IL', NULL, 'United States', 45, NULL, 'ACTIVE', '2026-09-15 11:53:51.548', '2026-09-15 11:53:51.548', NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qda004rre7dwmqk304c', 'cmu2m5q7v0037re7dsgqq4eos', 'Halcyon Acoustics', 'Halcyon Acoustics LLC', 'hello@halcyonacoustics.example', '+1 (206) 555-0177', NULL, NULL, NULL, 'Seattle', 'WA', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-15 11:53:51.55', '2026-09-15 11:53:51.55', NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qdc004sre7d1g4zdtg8', 'cmu2m5q7v0037re7dsgqq4eos', 'Meridian Electrical Supply', 'Meridian Electrical Supply Co.', 'accounts@meridianelec.example', '+1 (415) 555-0192', NULL, NULL, NULL, 'Oakland', 'CA', NULL, 'United States', 21, NULL, 'ACTIVE', '2026-09-15 11:53:51.552', '2026-09-15 11:53:51.552', NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qde004tre7d8kg0nnof', 'cmu2m5q7v0037re7dsgqq4eos', 'Cobalt Metal Fabrication', 'Cobalt Metal Fabrication', 'sales@cobaltfab.example', '+1 (602) 555-0164', NULL, NULL, NULL, 'Phoenix', 'AZ', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-15 11:53:51.554', '2026-09-15 11:53:51.554', NULL);


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qct004jre7dy9y5uh2z', 'cmu2m5q7v0037re7dsgqq4eos', 'Workstations', 'Desks, benches and height-adjustable frames', NULL, NULL, '2026-09-15 11:53:51.533', '2026-09-15 11:53:51.533', NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcw004kre7dhp4zimj4', 'cmu2m5q7v0037re7dsgqq4eos', 'Seating', 'Task chairs, stools and soft seating', NULL, NULL, '2026-09-15 11:53:51.536', '2026-09-15 11:53:51.536', NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcy004lre7d2wbm3v1t', 'cmu2m5q7v0037re7dsgqq4eos', 'Storage', 'Pedestals, lockers and shelving', NULL, NULL, '2026-09-15 11:53:51.538', '2026-09-15 11:53:51.538', NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcz004mre7db09utrag', 'cmu2m5q7v0037re7dsgqq4eos', 'Acoustics', 'Panels, screens and sound treatment', NULL, NULL, '2026-09-15 11:53:51.539', '2026-09-15 11:53:51.539', NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qd1004nre7do9zjdr8b', 'cmu2m5q7v0037re7dsgqq4eos', 'Power & data', 'Cable management, sockets and modules', NULL, NULL, '2026-09-15 11:53:51.541', '2026-09-15 11:53:51.541', NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qd2004ore7d9asve4ys', 'cmu2m5q7v0037re7dsgqq4eos', 'Services', 'Design, delivery and installation labour', NULL, NULL, '2026-09-15 11:53:51.542', '2026-09-15 11:53:51.542', NULL);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qfo005kre7dxnn0e9pb', 'cmu2m5q7v0037re7dsgqq4eos', 'Acoustic Ceiling Baffle', 'AC-BAF-1200', NULL, 'Suspended vertical baffle, 1200×300mm.', 'GOOD', 'cmu2m5qcz004mre7db09utrag', 'cmu2m5qda004rre7dwmqk304c', 'unit', 58.00, 108.00, 10.000, 96.000, 30.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.636', '2026-09-15 11:53:51.636', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qgl005ure7d3lputw46', 'cmu2m5q7v0037re7dsgqq4eos', 'Space Planning & Design', 'SV-DESIGN', NULL, 'CAD space planning, furniture specification and 3D visuals.', 'SERVICE', 'cmu2m5qd2004ore7d9asve4ys', NULL, 'hour', 0.00, 125.00, 10.000, 0.000, 0.000, false, NULL, 'ACTIVE', '2026-09-15 11:53:51.669', '2026-09-15 11:53:51.669', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qgp005vre7dew97hs2b', 'cmu2m5q7v0037re7dsgqq4eos', 'Delivery & Installation', 'SV-INSTALL', NULL, 'Two-person install team, build, placement and waste removal.', 'SERVICE', 'cmu2m5qd2004ore7d9asve4ys', NULL, 'hour', 0.00, 88.00, 10.000, 0.000, 0.000, false, NULL, 'ACTIVE', '2026-09-15 11:53:51.673', '2026-09-15 11:53:51.673', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qeh0056re7dfkc2xab5', 'cmu2m5q7v0037re7dsgqq4eos', 'Draughtsman Stool', 'ST-DRFT-GRY', NULL, 'Height-adjustable stool with footring, grey fabric.', 'GOOD', 'cmu2m5qcw004kre7dhp4zimj4', 'cmu2m5qd8004qre7dca56ydwm', 'unit', 132.00, 249.00, 10.000, 0.000, 6.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.593', '2026-09-15 11:53:52.145', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qdh004ure7dm4fh6v7v', 'cmu2m5q7v0037re7dsgqq4eos', 'Meridian Sit-Stand Desk 1600', 'WS-1600-OAK', NULL, 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 'GOOD', 'cmu2m5qct004jre7dy9y5uh2z', 'cmu2m5qd5004pre7djmw9lqkq', 'unit', 412.00, 749.00, 10.000, 79.000, 10.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.557', '2026-09-15 11:53:52.61', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qgf005sre7dktoo4yni', 'cmu2m5q7v0037re7dsgqq4eos', 'Under-Desk Cable Tray 1200', 'PD-TRY-1200', NULL, 'Perforated steel cable tray with fixings.', 'GOOD', 'cmu2m5qd1004nre7do9zjdr8b', NULL, 'unit', 17.00, 34.00, 10.000, 517.000, 50.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.663', '2026-09-15 11:53:52.634', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qeo0058re7d1shc6du1', 'cmu2m5q7v0037re7dsgqq4eos', 'Alcove Soft Seating Two-Seat', 'ST-SOFT-2S', NULL, 'High-back two-seat booth in wool-blend upholstery.', 'GOOD', 'cmu2m5qcw004kre7dhp4zimj4', NULL, 'unit', 640.00, 1150.00, 10.000, 0.000, 3.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.6', '2026-09-15 11:53:52.219', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qe50052re7dc6c2dp86', 'cmu2m5q7v0037re7dsgqq4eos', 'Vertex Ergo Task Chair', 'ST-ERGO-BLK', NULL, 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 'GOOD', 'cmu2m5qcw004kre7dhp4zimj4', 'cmu2m5qd8004qre7dca56ydwm', 'unit', 218.00, 399.00, 10.000, 193.000, 20.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.581', '2026-09-15 11:53:52.702', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qeb0054re7df88mzqk6', 'cmu2m5q7v0037re7dsgqq4eos', 'Vertex Ergo Task Chair (Headrest)', 'ST-ERGO-HR', NULL, 'Ergo task chair with adjustable headrest.', 'GOOD', 'cmu2m5qcw004kre7dhp4zimj4', 'cmu2m5qd8004qre7dca56ydwm', 'unit', 254.00, 459.00, 10.000, 59.000, 12.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.587', '2026-09-15 11:53:52.658', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qfe005gre7d9may8zcq', 'cmu2m5q7v0037re7dsgqq4eos', 'Acoustic Desk Screen 1400', 'AC-SCR-1400', NULL, 'PET felt desk-mounted screen, 1400×400mm.', 'GOOD', 'cmu2m5qcz004mre7db09utrag', 'cmu2m5qda004rre7dwmqk304c', 'unit', 62.00, 119.00, 10.000, 330.000, 30.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.626', '2026-09-15 11:53:52.706', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qf0005cre7dq6e4smnu', 'cmu2m5q7v0037re7dsgqq4eos', 'Personal Locker Bank of 6', 'SG-LOCK-6', NULL, 'Six-door locker bank with digital locks.', 'GOOD', 'cmu2m5qcy004lre7d2wbm3v1t', 'cmu2m5qde004tre7d8kg0nnof', 'unit', 470.00, 845.00, 10.000, 0.000, 5.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.612', '2026-09-15 11:53:52.315', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qg8005qre7dbxebklod', 'cmu2m5q7v0037re7dsgqq4eos', 'Vertical Cable Spine', 'PD-CBL-SPN', NULL, 'Flexible spine routing cables from desk to floor box.', 'GOOD', 'cmu2m5qd1004nre7do9zjdr8b', 'cmu2m5qdc004sre7d1g4zdtg8', 'unit', 22.00, 45.00, 10.000, 333.000, 30.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.656', '2026-09-15 11:53:52.547', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qf8005ere7dkqaqh8xp', 'cmu2m5q7v0037re7dsgqq4eos', 'Open Shelving Unit 1800', 'SG-SHLF-1800', NULL, 'Five-tier open shelving, powder-coated steel.', 'GOOD', 'cmu2m5qcy004lre7d2wbm3v1t', NULL, 'unit', 156.00, 289.00, 10.000, 46.000, 8.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.62', '2026-09-15 11:53:52.71', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qfu005mre7dku4pb497', 'cmu2m5q7v0037re7dsgqq4eos', 'Phone Booth Single', 'AC-BOOTH-1P', NULL, 'Single-occupancy acoustic pod with ventilation and lighting.', 'GOOD', 'cmu2m5qcz004mre7db09utrag', NULL, 'unit', 3150.00, 5290.00, 10.000, 0.000, 2.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.642', '2026-09-15 11:53:52.466', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qdt004yre7dimm5gfej', 'cmu2m5q7v0037re7dsgqq4eos', 'Halden Bench Desk 4-Person', 'WS-BEN-4P', NULL, 'Four-person back-to-back bench with shared cable tray.', 'GOOD', 'cmu2m5qct004jre7dy9y5uh2z', 'cmu2m5qd5004pre7djmw9lqkq', 'unit', 960.00, 1685.00, 10.000, 0.000, 4.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.569', '2026-09-15 11:53:52.336', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qfz005ore7dkinlmvna', 'cmu2m5q7v0037re7dsgqq4eos', 'Desktop Power Module 2×Socket', 'PD-PWR-2S', NULL, 'Clamp-on module with two sockets and two USB-C.', 'GOOD', 'cmu2m5qd1004nre7do9zjdr8b', 'cmu2m5qdc004sre7d1g4zdtg8', 'unit', 41.00, 79.00, 10.000, 466.000, 40.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.647', '2026-09-15 11:53:52.731', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qet005are7dgov0muq3', 'cmu2m5q7v0037re7dsgqq4eos', 'Mobile Pedestal 3-Drawer', 'SG-PED-3D', NULL, 'Lockable steel pedestal on castors.', 'GOOD', 'cmu2m5qcy004lre7d2wbm3v1t', 'cmu2m5qde004tre7d8kg0nnof', 'unit', 88.00, 165.00, 10.000, 280.000, 25.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.605', '2026-09-15 11:53:52.574', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qdo004wre7dbdx2m7tp', 'cmu2m5q7v0037re7dsgqq4eos', 'Meridian Sit-Stand Desk 1400', 'WS-1400-OAK', NULL, 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 'GOOD', 'cmu2m5qct004jre7dy9y5uh2z', 'cmu2m5qd5004pre7djmw9lqkq', 'unit', 378.00, 689.00, 10.000, 132.000, 10.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.564', '2026-09-15 11:53:52.578', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qdz0050re7dvznnyfwb', 'cmu2m5q7v0037re7dsgqq4eos', 'Corner Workstation 1800', 'WS-CNR-1800', NULL, 'Fixed-height corner desk with modesty panel.', 'GOOD', 'cmu2m5qct004jre7dy9y5uh2z', NULL, 'unit', 246.00, 445.00, 10.000, 0.000, 8.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.575', '2026-09-15 11:53:52.686', NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qfj005ire7d0j1oslen', 'cmu2m5q7v0037re7dsgqq4eos', 'Acoustic Wall Panel 600×600', 'AC-PNL-600', NULL, 'Class A absorber panel, 40mm, concealed fixings.', 'GOOD', 'cmu2m5qcz004mre7db09utrag', 'cmu2m5qda004rre7dwmqk304c', 'unit', 44.00, 84.00, 10.000, 810.000, 60.000, true, NULL, 'ACTIVE', '2026-09-15 11:53:51.631', '2026-09-15 11:53:52.69', NULL);


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.branches (id, "organizationId", name, code, "addressLine1", city, state, "postalCode", country, phone, email, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5q9w003gre7dxklyr07b', 'cmu2m5q7v0037re7dsgqq4eos', 'Head office', 'HQ', NULL, NULL, NULL, NULL, 'Ghana', NULL, NULL, true, true, '2026-09-15 11:53:51.428', '2026-09-15 11:53:51.428', NULL);
INSERT INTO public.branches (id, "organizationId", name, code, "addressLine1", city, state, "postalCode", country, phone, email, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qce0046re7dq3iddliq', 'cmu2m5qaw003xre7dcpy0qz9q', 'Head office', 'HQ', NULL, NULL, NULL, NULL, 'Ghana', NULL, NULL, true, true, '2026-09-15 11:53:51.518', '2026-09-15 11:53:51.518', NULL);


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.company_settings (id, "organizationId", "invoicePrefix", "quotationPrefix", "paymentPrefix", "purchaseOrderPrefix", "numberPadding", "numberIncludeYear", "defaultPaymentTermDays", "defaultInvoiceNotes", "paymentInstructions", "invoiceFooter", "taxLabel", "defaultTaxRate", "pricesIncludeTax", "lowStockAlerts", "notifyOnInvoicePaid", "notifyOnLowStock", "notifyOnQuoteAccepted", "notifyOnOverdue", "primaryColor", "secondaryColor", "createdAt", "updatedAt") VALUES ('cmu2m5q7x0038re7d0iybj4uv', 'cmu2m5q7v0037re7dsgqq4eos', 'INV', 'QTE', 'PAY', 'PO', 5, true, 14, NULL, 'Please reference the invoice number with your payment so we can match it automatically.', 'Thank you for your business.', 'VAT', 10.000, false, true, true, true, true, true, NULL, NULL, '2026-09-15 11:53:51.355', '2026-09-15 11:53:51.355');
INSERT INTO public.company_settings (id, "organizationId", "invoicePrefix", "quotationPrefix", "paymentPrefix", "purchaseOrderPrefix", "numberPadding", "numberIncludeYear", "defaultPaymentTermDays", "defaultInvoiceNotes", "paymentInstructions", "invoiceFooter", "taxLabel", "defaultTaxRate", "pricesIncludeTax", "lowStockAlerts", "notifyOnInvoicePaid", "notifyOnLowStock", "notifyOnQuoteAccepted", "notifyOnOverdue", "primaryColor", "secondaryColor", "createdAt", "updatedAt") VALUES ('cmu2m5qax003yre7dqxr5dcm3', 'cmu2m5qaw003xre7dcpy0qz9q', 'INV', 'QTE', 'PAY', 'PO', 5, true, 14, NULL, 'Please reference the invoice number with your payment so we can match it automatically.', 'Thank you for your business.', 'VAT', 10.000, false, true, true, true, true, true, NULL, NULL, '2026-09-15 11:53:51.464', '2026-09-15 11:53:51.464');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcp004ire7d7trcr8uk', 'cmu2m5qaw003xre7dcpy0qz9q', 'Bay Marina Offices', 'Bay Marina Offices LLC', 'admin@baymarina.example', NULL, NULL, NULL, NULL, NULL, 'Sausalito', NULL, NULL, 'United States', NULL, NULL, 14, NULL, '{}', 'ACTIVE', '2026-09-15 11:53:51.529', '2026-09-15 11:53:51.529', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qgs005wre7d9ri8rsrs', 'cmu2m5q7v0037re7dsgqq4eos', 'Priya Raghavan', 'Lumen Health Group', 'priya.raghavan@lumenhealth.example', '+1 (415) 555-0121', NULL, 'US-338-221-904', '2100 Folsom Street', NULL, 'San Francisco', 'CA', '94110', 'United States', NULL, NULL, 30, 'Rolling refit across four clinics. Purchase orders required on every invoice.', '{healthcare,"key account"}', 'ACTIVE', '2025-05-15 11:53:50.552', '2026-09-15 11:53:51.676', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qgw005xre7dqqd7l1ko', 'cmu2m5q7v0037re7dsgqq4eos', 'Daniel Okonkwo', 'Fairview Legal Partners', 'd.okonkwo@fairviewlegal.example', '+1 (212) 555-0187', NULL, NULL, '48 Wall Street, Floor 11', NULL, 'New York', 'NY', '10005', 'United States', NULL, NULL, 14, 'Prefers quotations valid for 30 days. Pays reliably within terms.', '{"professional services"}', 'ACTIVE', '2025-02-15 11:53:50.552', '2026-09-15 11:53:51.68', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qh0005yre7daipt8vxa', 'cmu2m5q7v0037re7dsgqq4eos', 'Marta Delgado', 'Cobre Coffee Roasters', 'marta@cobrecoffee.example', '+1 (512) 555-0139', NULL, NULL, '910 East 6th Street', NULL, 'Austin', 'TX', '78702', 'United States', NULL, NULL, 14, 'Opening two new sites this year. Interested in acoustic panelling.', '{hospitality,growth}', 'ACTIVE', '2025-02-15 11:53:50.552', '2026-09-15 11:53:51.684', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qh3005zre7dr7tm42fb', 'cmu2m5q7v0037re7dsgqq4eos', 'Tom Whitfield', 'Northside Academy Trust', 'procurement@northsideacademy.example', '+1 (617) 555-0155', NULL, 'US-119-887-455', '300 Huntington Avenue', NULL, 'Boston', 'MA', '02115', 'United States', NULL, NULL, 45, 'Public sector terms. Invoices must quote the framework reference.', '{education,"public sector"}', 'ACTIVE', '2026-04-15 11:53:50.552', '2026-09-15 11:53:51.687', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qh90060re7dlc2x2rhs', 'cmu2m5q7v0037re7dsgqq4eos', 'Alice Chen', 'Bright Harbour Studios', 'alice.chen@brightharbour.example', '+1 (206) 555-0148', NULL, NULL, '77 Yesler Way', NULL, 'Seattle', 'WA', '98104', 'United States', NULL, NULL, 14, 'Design-led fitout. Signs off quickly but wants samples first.', '{creative}', 'ACTIVE', '2026-07-15 11:53:50.552', '2026-09-15 11:53:51.693', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhc0061re7dbvxmy9ds', 'cmu2m5q7v0037re7dsgqq4eos', 'Samuel Boateng', 'Ridgeline Logistics', 's.boateng@ridgelinelogistics.example', '+1 (303) 555-0176', NULL, NULL, '4500 Havana Street', NULL, 'Denver', 'CO', '80239', 'United States', NULL, NULL, 30, 'Warehouse offices. Volume pricing agreed on storage lines.', '{logistics}', 'ACTIVE', '2025-09-15 11:53:50.552', '2026-09-15 11:53:51.696', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhg0062re7dwhqjf5gz', 'cmu2m5q7v0037re7dsgqq4eos', 'Hannah Lindqvist', 'Aster Biotech', 'hannah.l@asterbiotech.example', '+1 (858) 555-0193', NULL, 'US-502-663-118', '11255 Torrey Pines Road', NULL, 'San Diego', 'CA', '92121', 'United States', NULL, NULL, 30, 'Lab-adjacent office space. Strict delivery windows.', '{"life sciences","key account"}', 'ACTIVE', '2026-03-15 11:53:50.552', '2026-09-15 11:53:51.7', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhi0063re7drcubbbam', 'cmu2m5q7v0037re7dsgqq4eos', 'Owen Pritchard', 'Grainger & Mills Accountants', 'owen@graingermills.example', '+1 (704) 555-0129', NULL, NULL, '620 South Tryon Street', NULL, 'Charlotte', 'NC', '28202', 'United States', NULL, NULL, 14, 'Small but repeat orders every quarter.', '{"professional services"}', 'ACTIVE', '2024-11-15 11:53:50.552', '2026-09-15 11:53:51.702', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qhl0064re7d1vp4egez', 'cmu2m5q7v0037re7dsgqq4eos', 'Yara Haddad', 'Solstice Fitness Collective', 'yara@solsticefitness.example', '+1 (305) 555-0161', NULL, NULL, '1801 Biscayne Boulevard', NULL, 'Miami', 'FL', '33132', 'United States', NULL, NULL, 21, 'Reception and staff areas only. Budget sensitive.', '{leisure}', 'ACTIVE', '2026-04-15 11:53:50.552', '2026-09-15 11:53:51.705', NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qho0065re7d4hn7mtvt', 'cmu2m5q7v0037re7dsgqq4eos', 'Greg Salter', 'Mercer Property Group', 'g.salter@mercerproperty.example', '+1 (503) 555-0184', NULL, 'US-410-775-236', '1220 SW Morrison Street', NULL, 'Portland', 'OR', '97205', 'United States', NULL, NULL, 30, 'Fits out serviced offices. Slow payer, so chase at day 35.', '{"real estate"}', 'ACTIVE', '2024-07-15 11:53:50.552', '2026-09-15 11:53:51.708', NULL);


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003kre7d4y0efocz', 'cmu2m5q7v0037re7dsgqq4eos', 'Rent & facilities', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003lre7dqbuh3pnd', 'cmu2m5q7v0037re7dsgqq4eos', 'Software & subscriptions', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003mre7dlslgjcqs', 'cmu2m5q7v0037re7dsgqq4eos', 'Travel', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003nre7d5y66d823', 'cmu2m5q7v0037re7dsgqq4eos', 'Marketing', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003ore7dknrf3sh9', 'cmu2m5q7v0037re7dsgqq4eos', 'Professional services', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003pre7dpbsp1xla', 'cmu2m5q7v0037re7dsgqq4eos', 'Utilities', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003qre7dr2gaoa4s', 'cmu2m5q7v0037re7dsgqq4eos', 'Equipment', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qa6003rre7d8qdd9kal', 'cmu2m5q7v0037re7dsgqq4eos', 'Office supplies', NULL, NULL, '2026-09-15 11:53:51.438', '2026-09-15 11:53:51.438', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qci004are7dpq51rv44', 'cmu2m5qaw003xre7dcpy0qz9q', 'Rent & facilities', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qci004bre7dq5edsnjy', 'cmu2m5qaw003xre7dcpy0qz9q', 'Software & subscriptions', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qci004cre7df3nu2vg7', 'cmu2m5qaw003xre7dcpy0qz9q', 'Travel', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qci004dre7drv0z05et', 'cmu2m5qaw003xre7dcpy0qz9q', 'Marketing', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcj004ere7dvz9dxqbe', 'cmu2m5qaw003xre7dcpy0qz9q', 'Professional services', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcj004fre7dpelhi65u', 'cmu2m5qaw003xre7dcpy0qz9q', 'Utilities', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcj004gre7dgk1u6du1', 'cmu2m5qaw003xre7dcpy0qz9q', 'Equipment', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcj004hre7duizu5pz0', 'cmu2m5qaw003xre7dcpy0qz9q', 'Office supplies', NULL, NULL, '2026-09-15 11:53:51.522', '2026-09-15 11:53:51.522', NULL);


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rix00jqre7ds8v3fiyp', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgs005wre7d9ri8rsrs', 'PRJ-LUMEN-01', 'Lumen Health, Mission Bay clinic refit', 'Full furniture package for a 42-desk clinical admin floor, phased over two weekends.', 'ACTIVE', '2026-06-15 11:53:50.552', '2026-11-15 11:53:50.552', 96000.00, 48806.40, 'GHS', 62, NULL, '2026-09-15 11:53:53.049', '2026-09-15 11:53:53.049', NULL);
INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rj300jure7di73dwhsx', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhg0062re7dwhqjf5gz', 'PRJ-ASTER-01', 'Aster Biotech, Torrey Pines office expansion', 'New 28-person office adjacent to the lab, including acoustic treatment and two phone booths.', 'ACTIVE', '2026-08-15 11:53:50.552', '2027-01-15 11:53:50.552', 64000.00, 17843.20, 'GHS', 34, NULL, '2026-09-15 11:53:53.055', '2026-09-15 11:53:53.055', NULL);
INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rj700jyre7dn0amq247', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qh0005yre7daipt8vxa', 'PRJ-COBRE-01', 'Cobre Coffee, East 6th flagship', 'Back-of-house office and staff room fitout alongside the new roastery build.', 'COMPLETED', '2026-02-15 11:53:50.552', '2026-07-15 11:53:50.552', 28500.00, 23370.00, 'GHS', 100, NULL, '2026-09-15 11:53:53.059', '2026-09-15 11:53:53.059', NULL);


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ram00gfre7d0quwisqm', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00001', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, quarterly', 'Warehouse rent, quarterly, recorded from supplier documentation.', 8400.00, 840.00, 9240.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-03 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-03 00:00:00', '2026-09-15 11:53:52.75', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5raw00gire7d9xha6w8c', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00002', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls', 'Delivery van fuel and tolls, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-09-10 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-10 00:00:00', '2026-09-15 11:53:52.76', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rb400glre7dfjoq2or0', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00003', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats)', 'Design software licences (5 seats), recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-27 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-27 00:00:00', '2026-09-15 11:53:52.768', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rbf00gore7dnq2lgtcu', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00004', 'cmu2m5qa6003nre7d5y66d823', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Trade show stand at Workspace Expo', 'Trade show stand at Workspace Expo, recorded from supplier documentation.', 3250.00, 325.00, 3575.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-19 00:00:00', 'Workspace Expo Ltd.', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-19 00:00:00', '2026-09-15 11:53:52.779', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rbn00grre7ddsihz6ek', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00005', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity', 'Warehouse electricity, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-07 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-07 00:00:00', '2026-09-15 11:53:52.787', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rby00gure7da0sowjzz', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00006', 'cmu2m5qa6003qre7dr2gaoa4s', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Forklift annual service', 'Forklift annual service, recorded from supplier documentation.', 1180.00, 118.00, 1298.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-12 00:00:00', 'Halton Materials Handling', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-12 00:00:00', '2026-09-15 11:53:52.798', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rc700gxre7d1ldyyy49', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00007', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer', 'Accountancy retainer, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-31 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-31 00:00:00', '2026-09-15 11:53:52.807', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rch00h0re7dl9f5jyp0', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00008', 'cmu2m5qa6003rre7d8qdd9kal', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Packing materials and pallets', 'Packing materials and pallets, recorded from supplier documentation.', 398.70, 39.87, 438.57, 'GHS', 'CARD', 'APPROVED', '2026-09-12 00:00:00', 'Crate & Wrap Supplies', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-12 00:00:00', '2026-09-15 11:53:52.817', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rcp00h3re7dnhw0z7f0', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00009', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Installer team overnight accommodation', 'Installer team overnight accommodation, recorded from supplier documentation.', 864.00, 86.40, 950.40, 'GHS', 'CARD', 'APPROVED', '2026-08-25 00:00:00', 'Riverside Inn', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-25 00:00:00', '2026-09-15 11:53:52.825', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rcx00h6re7d6oq5qagt', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00010', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Liability insurance premium', 'Liability insurance premium, recorded from supplier documentation.', 2240.00, 224.00, 2464.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-01 00:00:00', 'Ashworth Commercial Insurance', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-01 00:00:00', '2026-09-15 11:53:52.833', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rd500h9re7di675wfe5', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00011', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, current month', 'Warehouse rent, current month, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-29 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-29 00:00:00', '2026-09-15 11:53:52.841', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rde00hcre7dp8tvauld', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00012', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats), current month', 'Design software licences (5 seats), current month, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-31 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-31 00:00:00', '2026-09-15 11:53:52.85', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rdk00hfre7ddpxa0xsw', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00013', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity, current month', 'Warehouse electricity, current month, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-04 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-04 00:00:00', '2026-09-15 11:53:52.856', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rdq00hire7d4hu5idx2', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00014', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer, current month', 'Accountancy retainer, current month, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-02 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-02 00:00:00', '2026-09-15 11:53:52.863', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5re000hlre7d65shu7a1', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00015', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls, current month', 'Delivery van fuel and tolls, current month, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-08-31 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-31 00:00:00', '2026-09-15 11:53:52.872', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5re700hore7dj6qs2d0k', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00016', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, 1 month ago', 'Warehouse rent, 1 month ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-08 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-08 00:00:00', '2026-09-15 11:53:52.879', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ree00hrre7dali25lr9', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00017', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats), 1 month ago', 'Design software licences (5 seats), 1 month ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-05 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-05 00:00:00', '2026-09-15 11:53:52.886', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rel00hure7ddnor9zbi', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00018', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity, 1 month ago', 'Warehouse electricity, 1 month ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-31 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-31 00:00:00', '2026-09-15 11:53:52.893', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rer00hxre7dypxkoz0q', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00019', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer, 1 month ago', 'Accountancy retainer, 1 month ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-30 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-30 00:00:00', '2026-09-15 11:53:52.899', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rex00i0re7d7ss1j95v', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00020', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls, 1 month ago', 'Delivery van fuel and tolls, 1 month ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-08-14 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-14 00:00:00', '2026-09-15 11:53:52.905', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rf400i3re7dtoqq1ilu', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00021', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, 2 months ago', 'Warehouse rent, 2 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-04 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-04 00:00:00', '2026-09-15 11:53:52.912', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfb00i6re7dcmo8ke97', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00022', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats), 2 months ago', 'Design software licences (5 seats), 2 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-07-02 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-02 00:00:00', '2026-09-15 11:53:52.919', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfh00i9re7dl4w3l6oq', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00023', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity, 2 months ago', 'Warehouse electricity, 2 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-11 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-11 00:00:00', '2026-09-15 11:53:52.925', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfo00icre7d5srcvabm', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00024', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer, 2 months ago', 'Accountancy retainer, 2 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-01 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-01 00:00:00', '2026-09-15 11:53:52.932', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfu00ifre7days8z7fo', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00025', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls, 2 months ago', 'Delivery van fuel and tolls, 2 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-07-05 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-05 00:00:00', '2026-09-15 11:53:52.938', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rg100iire7d5mpx8saq', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00026', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, 3 months ago', 'Warehouse rent, 3 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-01 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-01 00:00:00', '2026-09-15 11:53:52.945', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rg700ilre7d4t2pyede', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00027', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats), 3 months ago', 'Design software licences (5 seats), 3 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-05-29 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-29 00:00:00', '2026-09-15 11:53:52.951', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rgd00iore7d8j425sjk', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00028', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity, 3 months ago', 'Warehouse electricity, 3 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-09 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-09 00:00:00', '2026-09-15 11:53:52.957', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rgk00irre7dsgfo3gvq', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00029', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer, 3 months ago', 'Accountancy retainer, 3 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-05 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-05 00:00:00', '2026-09-15 11:53:52.964', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rgt00iure7dg7hulk2d', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00030', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls, 3 months ago', 'Delivery van fuel and tolls, 3 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-05-31 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-31 00:00:00', '2026-09-15 11:53:52.973', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rgz00ixre7d9zfp5coa', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00031', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, 4 months ago', 'Warehouse rent, 4 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-11 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-11 00:00:00', '2026-09-15 11:53:52.979', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rh500j0re7dus35zrsd', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00032', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats), 4 months ago', 'Design software licences (5 seats), 4 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-05-05 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-05 00:00:00', '2026-09-15 11:53:52.985', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhb00j3re7dr4ybbizu', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00033', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity, 4 months ago', 'Warehouse electricity, 4 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-08 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-08 00:00:00', '2026-09-15 11:53:52.991', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhh00j6re7dq8o87m1w', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00034', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer, 4 months ago', 'Accountancy retainer, 4 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-14 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-14 00:00:00', '2026-09-15 11:53:52.997', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rho00j9re7dbz42pgko', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00035', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls, 4 months ago', 'Delivery van fuel and tolls, 4 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-05-01 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-01 00:00:00', '2026-09-15 11:53:53.004', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhu00jcre7ddaxdzdap', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00036', 'cmu2m5qa6003kre7d4y0efocz', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse rent, 5 months ago', 'Warehouse rent, 5 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-16 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-16 00:00:00', '2026-09-15 11:53:53.01', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ri200jfre7dwxnu7wnv', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00037', 'cmu2m5qa6003lre7dqbuh3pnd', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Design software licences (5 seats), 5 months ago', 'Design software licences (5 seats), 5 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-04-14 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-14 00:00:00', '2026-09-15 11:53:53.018', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ri900jire7d31v545aq', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00038', 'cmu2m5qa6003pre7dpbsp1xla', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Warehouse electricity, 5 months ago', 'Warehouse electricity, 5 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-14 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-14 00:00:00', '2026-09-15 11:53:53.025', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rig00jlre7dhe2wy0w6', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00039', 'cmu2m5qa6003ore7dknrf3sh9', NULL, NULL, 'cmu2m5qa3003ire7drzf97vel', 'Accountancy retainer, 5 months ago', 'Accountancy retainer, 5 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-09 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-09 00:00:00', '2026-09-15 11:53:53.032', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rin00jore7doyghvg3n', 'cmu2m5q7v0037re7dsgqq4eos', 'EXP-2026-00040', 'cmu2m5qa6003mre7dlslgjcqs', NULL, NULL, 'cmu2m5qa3003jre7dzso0skva', 'Delivery van fuel and tolls, 5 months ago', 'Delivery van fuel and tolls, 5 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-04-09 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-09 00:00:00', '2026-09-15 11:53:53.039', NULL);


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qdl004vre7dh963s4wo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'STOCK_IN', 136.000, 136.000, 412.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.561');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qdq004xre7dxejcp6kw', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdo004wre7dbdx2m7tp', 'STOCK_IN', 164.000, 164.000, 378.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.566');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qdw004zre7d2ni763gw', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdt004yre7dimm5gfej', 'STOCK_IN', 32.000, 32.000, 960.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.572');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qe20051re7dpq2pswuz', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdz0050re7dvznnyfwb', 'STOCK_IN', 24.000, 24.000, 246.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.578');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qe80053re7d45j0w63d', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'STOCK_IN', 248.000, 248.000, 218.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.584');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qee0055re7dixxigmsc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'STOCK_IN', 112.000, 112.000, 254.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.59');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qek0057re7dndf0wr5k', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeh0056re7dfkc2xab5', 'STOCK_IN', 12.000, 12.000, 132.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.596');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qeq0059re7debopqyi0', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeo0058re7d1shc6du1', 'STOCK_IN', 20.000, 20.000, 640.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.602');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qev005bre7dv3wnmb82', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qet005are7dgov0muq3', 'STOCK_IN', 296.000, 296.000, 88.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.607');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qf5005dre7dv6gsximb', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf0005cre7dq6e4smnu', 'STOCK_IN', 44.000, 44.000, 470.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.617');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qfb005fre7djohbj1bo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf8005ere7dkqaqh8xp', 'STOCK_IN', 76.000, 76.000, 156.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.623');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qfg005hre7drxwzw3n4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfe005gre7d9may8zcq', 'STOCK_IN', 352.000, 352.000, 62.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.628');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qfl005jre7dc24niroq', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfj005ire7d0j1oslen', 'STOCK_IN', 840.000, 840.000, 44.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.633');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qfr005lre7desmg57ge', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfo005kre7dxnn0e9pb', 'STOCK_IN', 96.000, 96.000, 58.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.639');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qfw005nre7d3dgrpt47', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfu005mre7dku4pb497', 'STOCK_IN', 8.000, 8.000, 3150.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.644');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qg2005pre7d3gdai08o', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfz005ore7dkinlmvna', 'STOCK_IN', 520.000, 520.000, 41.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.65');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qgc005rre7dcg5e0p5j', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'STOCK_IN', 384.000, 384.000, 22.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.66');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qgi005tre7d8iwnmbun', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'STOCK_IN', 580.000, 580.000, 17.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-15 11:53:50.552', NULL, '2026-09-15 11:53:51.666');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qlo007vre7dw1vpw076', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -5.000, 575.000, NULL, 'INV-2026-00001', 'invoice', 'cmu2m5qlb007pre7db09ezknv', 'Sold on INV-2026-00001', '2026-03-23 00:00:00', NULL, '2026-09-15 11:53:51.852');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qlu007wre7dwqqz6pex', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -11.000, 237.000, NULL, 'INV-2026-00001', 'invoice', 'cmu2m5qlb007pre7db09ezknv', 'Sold on INV-2026-00001', '2026-03-23 00:00:00', NULL, '2026-09-15 11:53:51.858');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qm1007xre7d4l97fkt4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdt004yre7dimm5gfej', 'SALE', -13.000, 19.000, NULL, 'INV-2026-00001', 'invoice', 'cmu2m5qlb007pre7db09ezknv', 'Sold on INV-2026-00001', '2026-03-23 00:00:00', NULL, '2026-09-15 11:53:51.865');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qm7007yre7d6r08p8iw', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeh0056re7dfkc2xab5', 'SALE', -2.000, 10.000, NULL, 'INV-2026-00001', 'invoice', 'cmu2m5qlb007pre7db09ezknv', 'Sold on INV-2026-00001', '2026-03-23 00:00:00', NULL, '2026-09-15 11:53:51.871');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qn80087re7ddiavdbq0', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdo004wre7dbdx2m7tp', 'SALE', -13.000, 151.000, NULL, 'INV-2026-00002', 'invoice', 'cmu2m5qn10083re7d27fd8jh1', 'Sold on INV-2026-00002', '2026-04-02 00:00:00', NULL, '2026-09-15 11:53:51.908');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qnd0088re7dbuw2iaw0', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfj005ire7d0j1oslen', 'SALE', -5.000, 835.000, NULL, 'INV-2026-00002', 'invoice', 'cmu2m5qn10083re7d27fd8jh1', 'Sold on INV-2026-00002', '2026-04-02 00:00:00', NULL, '2026-09-15 11:53:51.913');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qo7008hre7dnnn3gdud', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf0005cre7dq6e4smnu', 'SALE', -9.000, 35.000, NULL, 'INV-2026-00003', 'invoice', 'cmu2m5qnw008dre7dtiadnwde', 'Sold on INV-2026-00003', '2026-04-18 00:00:00', NULL, '2026-09-15 11:53:51.943');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qod008ire7dgg029sws', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -6.000, 231.000, NULL, 'INV-2026-00003', 'invoice', 'cmu2m5qnw008dre7dtiadnwde', 'Sold on INV-2026-00003', '2026-04-18 00:00:00', NULL, '2026-09-15 11:53:51.949');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qp7008tre7duqjqr5nb', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdo004wre7dbdx2m7tp', 'SALE', -2.000, 149.000, NULL, 'INV-2026-00004', 'invoice', 'cmu2m5qox008nre7duwayrr4c', 'Sold on INV-2026-00004', '2026-05-03 00:00:00', NULL, '2026-09-15 11:53:51.979');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qpc008ure7d9bubu4bj', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf0005cre7dq6e4smnu', 'SALE', -12.000, 23.000, NULL, 'INV-2026-00004', 'invoice', 'cmu2m5qox008nre7duwayrr4c', 'Sold on INV-2026-00004', '2026-05-03 00:00:00', NULL, '2026-09-15 11:53:51.984');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qpl008vre7dres3j0rx', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeh0056re7dfkc2xab5', 'SALE', -2.000, 8.000, NULL, 'INV-2026-00004', 'invoice', 'cmu2m5qox008nre7duwayrr4c', 'Sold on INV-2026-00004', '2026-05-03 00:00:00', NULL, '2026-09-15 11:53:51.993');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qpr008wre7dy2mlsfk6', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'SALE', -14.000, 122.000, NULL, 'INV-2026-00004', 'invoice', 'cmu2m5qox008nre7duwayrr4c', 'Sold on INV-2026-00004', '2026-05-03 00:00:00', NULL, '2026-09-15 11:53:51.999');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qqj0097re7dduw2r59z', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdo004wre7dbdx2m7tp', 'SALE', -3.000, 146.000, NULL, 'INV-2026-00005', 'invoice', 'cmu2m5qqb0091re7ddhbz29px', 'Sold on INV-2026-00005', '2026-05-10 00:00:00', NULL, '2026-09-15 11:53:52.027');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qqo0098re7dkbu04ab4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeo0058re7d1shc6du1', 'SALE', -9.000, 11.000, NULL, 'INV-2026-00005', 'invoice', 'cmu2m5qqb0091re7ddhbz29px', 'Sold on INV-2026-00005', '2026-05-10 00:00:00', NULL, '2026-09-15 11:53:52.032');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qqr0099re7dqco214th', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf0005cre7dq6e4smnu', 'SALE', -12.000, 11.000, NULL, 'INV-2026-00005', 'invoice', 'cmu2m5qqb0091re7ddhbz29px', 'Sold on INV-2026-00005', '2026-05-10 00:00:00', NULL, '2026-09-15 11:53:52.035');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qqz009are7dka240qge', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -4.000, 380.000, NULL, 'INV-2026-00005', 'invoice', 'cmu2m5qqb0091re7ddhbz29px', 'Sold on INV-2026-00005', '2026-05-10 00:00:00', NULL, '2026-09-15 11:53:52.043');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qrt009jre7d454n3gru', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfz005ore7dkinlmvna', 'SALE', -14.000, 506.000, NULL, 'INV-2026-00006', 'invoice', 'cmu2m5qrn009fre7dj7wo1eap', 'Sold on INV-2026-00006', '2026-05-10 00:00:00', NULL, '2026-09-15 11:53:52.073');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qrw009kre7dyo7m1ftn', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -14.000, 217.000, NULL, 'INV-2026-00006', 'invoice', 'cmu2m5qrn009fre7dj7wo1eap', 'Sold on INV-2026-00006', '2026-05-10 00:00:00', NULL, '2026-09-15 11:53:52.076');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qsq009tre7dxwib0jrd', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -8.000, 372.000, NULL, 'INV-2026-00007', 'invoice', 'cmu2m5qsh009pre7dh78fzcq2', 'Sold on INV-2026-00007', '2026-06-01 00:00:00', NULL, '2026-09-15 11:53:52.106');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qsx009ure7d3mae9aop', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'SALE', -7.000, 105.000, NULL, 'INV-2026-00007', 'invoice', 'cmu2m5qsh009pre7dh78fzcq2', 'Sold on INV-2026-00007', '2026-06-01 00:00:00', NULL, '2026-09-15 11:53:52.113');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qtr00a4re7db6y5jkz1', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -12.000, 563.000, NULL, 'INV-2026-00008', 'invoice', 'cmu2m5qti009zre7d6mj846xr', 'Sold on INV-2026-00008', '2026-06-03 00:00:00', NULL, '2026-09-15 11:53:52.143');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qtv00a5re7dy78rz863', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeh0056re7dfkc2xab5', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00008', 'invoice', 'cmu2m5qti009zre7d6mj846xr', 'Sold on INV-2026-00008', '2026-06-03 00:00:00', NULL, '2026-09-15 11:53:52.147');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qtz00a6re7dpa2nwlj6', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -4.000, 368.000, NULL, 'INV-2026-00008', 'invoice', 'cmu2m5qti009zre7d6mj846xr', 'Sold on INV-2026-00008', '2026-06-03 00:00:00', NULL, '2026-09-15 11:53:52.151');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qup00agre7dwf0jlllf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -12.000, 356.000, NULL, 'INV-2026-00009', 'invoice', 'cmu2m5qui00abre7de3op5olx', 'Sold on INV-2026-00009', '2026-06-03 00:00:00', NULL, '2026-09-15 11:53:52.177');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5quv00ahre7dyl8h790p', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -10.000, 553.000, NULL, 'INV-2026-00009', 'invoice', 'cmu2m5qui00abre7de3op5olx', 'Sold on INV-2026-00009', '2026-06-03 00:00:00', NULL, '2026-09-15 11:53:52.183');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5quz00aire7dz1bd85mw', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'SALE', -13.000, 109.000, NULL, 'INV-2026-00009', 'invoice', 'cmu2m5qui00abre7de3op5olx', 'Sold on INV-2026-00009', '2026-06-03 00:00:00', NULL, '2026-09-15 11:53:52.187');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qvq00asre7dkxsi5y7b', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -10.000, 207.000, NULL, 'INV-2026-00010', 'invoice', 'cmu2m5qvi00anre7dw0u2uop0', 'Sold on INV-2026-00010', '2026-06-13 00:00:00', NULL, '2026-09-15 11:53:52.214');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qvu00atre7di2k18fer', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfe005gre7d9may8zcq', 'SALE', -6.000, 346.000, NULL, 'INV-2026-00010', 'invoice', 'cmu2m5qvi00anre7dw0u2uop0', 'Sold on INV-2026-00010', '2026-06-13 00:00:00', NULL, '2026-09-15 11:53:52.218');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qvx00aure7d90b9cryy', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeo0058re7d1shc6du1', 'SALE', -11.000, 0.000, NULL, 'INV-2026-00010', 'invoice', 'cmu2m5qvi00anre7dw0u2uop0', 'Sold on INV-2026-00010', '2026-06-13 00:00:00', NULL, '2026-09-15 11:53:52.221');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qwk00b5re7dtdoft6d2', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -7.000, 546.000, NULL, 'INV-2026-00011', 'invoice', 'cmu2m5qwe00azre7d5d3jtv01', 'Sold on INV-2026-00011', '2026-06-22 00:00:00', NULL, '2026-09-15 11:53:52.244');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qwn00b6re7d912xutft', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -12.000, 344.000, NULL, 'INV-2026-00011', 'invoice', 'cmu2m5qwe00azre7d5d3jtv01', 'Sold on INV-2026-00011', '2026-06-22 00:00:00', NULL, '2026-09-15 11:53:52.247');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qwr00b7re7dxn89b5u4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf8005ere7dkqaqh8xp', 'SALE', -5.000, 71.000, NULL, 'INV-2026-00011', 'invoice', 'cmu2m5qwe00azre7d5d3jtv01', 'Sold on INV-2026-00011', '2026-06-22 00:00:00', NULL, '2026-09-15 11:53:52.251');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qwx00b8re7d90quz757', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfe005gre7d9may8zcq', 'SALE', -5.000, 341.000, NULL, 'INV-2026-00011', 'invoice', 'cmu2m5qwe00azre7d5d3jtv01', 'Sold on INV-2026-00011', '2026-06-22 00:00:00', NULL, '2026-09-15 11:53:52.257');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qxl00bjre7d97taeyfx', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfz005ore7dkinlmvna', 'SALE', -14.000, 492.000, NULL, 'INV-2026-00012', 'invoice', 'cmu2m5qxf00bdre7dnbkh7xqi', 'Sold on INV-2026-00012', '2026-07-01 00:00:00', NULL, '2026-09-15 11:53:52.281');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qxp00bkre7des6ew3us', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdt004yre7dimm5gfej', 'SALE', -11.000, 8.000, NULL, 'INV-2026-00012', 'invoice', 'cmu2m5qxf00bdre7dnbkh7xqi', 'Sold on INV-2026-00012', '2026-07-01 00:00:00', NULL, '2026-09-15 11:53:52.285');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qxt00blre7dyj907w0f', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'SALE', -11.000, 94.000, NULL, 'INV-2026-00012', 'invoice', 'cmu2m5qxf00bdre7dnbkh7xqi', 'Sold on INV-2026-00012', '2026-07-01 00:00:00', NULL, '2026-09-15 11:53:52.289');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qxw00bmre7deypvxdp1', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -11.000, 535.000, NULL, 'INV-2026-00012', 'invoice', 'cmu2m5qxf00bdre7dnbkh7xqi', 'Sold on INV-2026-00012', '2026-07-01 00:00:00', NULL, '2026-09-15 11:53:52.292');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qyi00bvre7djcoonj3o', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfz005ore7dkinlmvna', 'SALE', -8.000, 484.000, NULL, 'INV-2026-00013', 'invoice', 'cmu2m5qyd00brre7dfla32z0w', 'Sold on INV-2026-00013', '2026-07-02 00:00:00', NULL, '2026-09-15 11:53:52.314');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qyl00bwre7dknp0penj', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf0005cre7dq6e4smnu', 'SALE', -11.000, 0.000, NULL, 'INV-2026-00013', 'invoice', 'cmu2m5qyd00brre7dfla32z0w', 'Sold on INV-2026-00013', '2026-07-02 00:00:00', NULL, '2026-09-15 11:53:52.317');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qz600c5re7doa7l7snf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdt004yre7dimm5gfej', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00014', 'invoice', 'cmu2m5qz100c1re7dzqe5qp5x', 'Sold on INV-2026-00014', '2026-07-04 00:00:00', NULL, '2026-09-15 11:53:52.338');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qz900c6re7d4fwptam6', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'SALE', -13.000, 81.000, NULL, 'INV-2026-00014', 'invoice', 'cmu2m5qz100c1re7dzqe5qp5x', 'Sold on INV-2026-00014', '2026-07-04 00:00:00', NULL, '2026-09-15 11:53:52.341');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5qzw00cgre7ddrsr4i3s', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf8005ere7dkqaqh8xp', 'SALE', -9.000, 62.000, NULL, 'INV-2026-00015', 'invoice', 'cmu2m5qzp00cbre7dis0i45gx', 'Sold on INV-2026-00015', '2026-07-12 00:00:00', NULL, '2026-09-15 11:53:52.364');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r0000chre7duk3m8j7d', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qet005are7dgov0muq3', 'SALE', -9.000, 287.000, NULL, 'INV-2026-00015', 'invoice', 'cmu2m5qzp00cbre7dis0i45gx', 'Sold on INV-2026-00015', '2026-07-12 00:00:00', NULL, '2026-09-15 11:53:52.368');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r0300cire7dyul0jaez', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdo004wre7dbdx2m7tp', 'SALE', -10.000, 136.000, NULL, 'INV-2026-00015', 'invoice', 'cmu2m5qzp00cbre7dis0i45gx', 'Sold on INV-2026-00015', '2026-07-12 00:00:00', NULL, '2026-09-15 11:53:52.371');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r0r00csre7dycssedvj', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -8.000, 336.000, NULL, 'INV-2026-00016', 'invoice', 'cmu2m5r0l00cnre7dhwwlpurr', 'Sold on INV-2026-00016', '2026-07-28 00:00:00', NULL, '2026-09-15 11:53:52.395');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r0v00ctre7dyuci7c8o', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfj005ire7d0j1oslen', 'SALE', -4.000, 831.000, NULL, 'INV-2026-00016', 'invoice', 'cmu2m5r0l00cnre7dhwwlpurr', 'Sold on INV-2026-00016', '2026-07-28 00:00:00', NULL, '2026-09-15 11:53:52.399');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r0y00cure7dlvrdkmbp', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'SALE', -12.000, 97.000, NULL, 'INV-2026-00016', 'invoice', 'cmu2m5r0l00cnre7dhwwlpurr', 'Sold on INV-2026-00016', '2026-07-28 00:00:00', NULL, '2026-09-15 11:53:52.402');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r1p00d3re7d9omzzxjy', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'SALE', -11.000, 86.000, NULL, 'INV-2026-00017', 'invoice', 'cmu2m5r1h00czre7dg6eypjys', 'Sold on INV-2026-00017', '2026-07-31 00:00:00', NULL, '2026-09-15 11:53:52.429');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r1w00d4re7d3vlj3u0i', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -2.000, 205.000, NULL, 'INV-2026-00017', 'invoice', 'cmu2m5r1h00czre7dg6eypjys', 'Sold on INV-2026-00017', '2026-07-31 00:00:00', NULL, '2026-09-15 11:53:52.436');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r2p00dere7dxgex5y2p', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfe005gre7d9may8zcq', 'SALE', -2.000, 339.000, NULL, 'INV-2026-00018', 'invoice', 'cmu2m5r2i00d9re7dufebeckx', 'Sold on INV-2026-00018', '2026-08-07 00:00:00', NULL, '2026-09-15 11:53:52.465');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r2t00dfre7d3w3f899h', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfu005mre7dku4pb497', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00018', 'invoice', 'cmu2m5r2i00d9re7dufebeckx', 'Sold on INV-2026-00018', '2026-08-07 00:00:00', NULL, '2026-09-15 11:53:52.469');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r2x00dgre7dzg21lozs', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'SALE', -2.000, 84.000, NULL, 'INV-2026-00018', 'invoice', 'cmu2m5r2i00d9re7dufebeckx', 'Sold on INV-2026-00018', '2026-08-07 00:00:00', NULL, '2026-09-15 11:53:52.473');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r3k00dore7d1gx5sqts', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdz0050re7dvznnyfwb', 'SALE', -5.000, 19.000, NULL, 'INV-2026-00019', 'invoice', 'cmu2m5r3f00dlre7db72s1kyj', 'Sold on INV-2026-00019', '2026-08-16 00:00:00', NULL, '2026-09-15 11:53:52.496');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r4g00e2re7d97cckwnf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfj005ire7d0j1oslen', 'SALE', -10.000, 821.000, NULL, 'INV-2026-00021', 'invoice', 'cmu2m5r4a00dxre7dzw6zvy0r', 'Sold on INV-2026-00021', '2026-09-02 00:00:00', NULL, '2026-09-15 11:53:52.528');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r4k00e3re7d7aj72nz2', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfz005ore7dkinlmvna', 'SALE', -4.000, 480.000, NULL, 'INV-2026-00021', 'invoice', 'cmu2m5r4a00dxre7dzw6zvy0r', 'Sold on INV-2026-00021', '2026-09-02 00:00:00', NULL, '2026-09-15 11:53:52.532');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r4n00e4re7dcs58izyo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'SALE', -7.000, 74.000, NULL, 'INV-2026-00021', 'invoice', 'cmu2m5r4a00dxre7dzw6zvy0r', 'Sold on INV-2026-00021', '2026-09-02 00:00:00', NULL, '2026-09-15 11:53:52.535');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r5100eare7dd71wyraf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qg8005qre7dbxebklod', 'SALE', -3.000, 333.000, NULL, 'INV-2026-00022', 'invoice', 'cmu2m5r4w00e6re7d17jpkana', 'Sold on INV-2026-00022', '2026-09-04 00:00:00', NULL, '2026-09-15 11:53:52.549');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r5500ebre7daii9kxop', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'SALE', -6.000, 68.000, NULL, 'INV-2026-00022', 'invoice', 'cmu2m5r4w00e6re7d17jpkana', 'Sold on INV-2026-00022', '2026-09-04 00:00:00', NULL, '2026-09-15 11:53:52.553');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r5s00elre7d2o9wexfq', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qet005are7dgov0muq3', 'SALE', -7.000, 280.000, NULL, 'INV-2026-00023', 'invoice', 'cmu2m5r5m00egre7dqctxblxc', 'Sold on INV-2026-00023', '2026-09-05 00:00:00', NULL, '2026-09-15 11:53:52.576');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r5x00emre7djiq4qpwx', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdo004wre7dbdx2m7tp', 'SALE', -4.000, 132.000, NULL, 'INV-2026-00023', 'invoice', 'cmu2m5r5m00egre7dqctxblxc', 'Sold on INV-2026-00023', '2026-09-05 00:00:00', NULL, '2026-09-15 11:53:52.581');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r6000enre7dcghfg17s', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -5.000, 530.000, NULL, 'INV-2026-00023', 'invoice', 'cmu2m5r5m00egre7dqctxblxc', 'Sold on INV-2026-00023', '2026-09-05 00:00:00', NULL, '2026-09-15 11:53:52.585');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r6o00eyre7dohj0gpda', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf8005ere7dkqaqh8xp', 'SALE', -5.000, 57.000, NULL, 'INV-2026-00025', 'invoice', 'cmu2m5r6i00eure7d6bq30cog', 'Sold on INV-2026-00025', '2026-09-08 00:00:00', NULL, '2026-09-15 11:53:52.608');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r6s00ezre7dt9ghhzsr', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdh004ure7dm4fh6v7v', 'SALE', -5.000, 79.000, NULL, 'INV-2026-00025', 'invoice', 'cmu2m5r6i00eure7d6bq30cog', 'Sold on INV-2026-00025', '2026-09-08 00:00:00', NULL, '2026-09-15 11:53:52.612');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r7g00f8re7dirpb0wr1', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgf005sre7dktoo4yni', 'SALE', -13.000, 517.000, NULL, 'INV-2026-00026', 'invoice', 'cmu2m5r7b00f4re7d6i1qise6', 'Sold on INV-2026-00026', '2026-09-09 00:00:00', NULL, '2026-09-15 11:53:52.636');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r7j00f9re7d5m3uvr9n', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -2.000, 203.000, NULL, 'INV-2026-00026', 'invoice', 'cmu2m5r7b00f4re7d6i1qise6', 'Sold on INV-2026-00026', '2026-09-09 00:00:00', NULL, '2026-09-15 11:53:52.639');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r8500fire7dn4he64oa', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qeb0054re7df88mzqk6', 'SALE', -9.000, 59.000, NULL, 'INV-2026-00027', 'invoice', 'cmu2m5r7z00fere7dbwvdrted', 'Sold on INV-2026-00027', '2026-09-11 00:00:00', NULL, '2026-09-15 11:53:52.661');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r8900fjre7d47s85f5d', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdz0050re7dvznnyfwb', 'SALE', -11.000, 8.000, NULL, 'INV-2026-00027', 'invoice', 'cmu2m5r7z00fere7dbwvdrted', 'Sold on INV-2026-00027', '2026-09-11 00:00:00', NULL, '2026-09-15 11:53:52.665');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r8w00fsre7dtd0jdbau', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qdz0050re7dvznnyfwb', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00028', 'invoice', 'cmu2m5r8q00fore7dzs55d1jb', 'Sold on INV-2026-00028', '2026-09-12 00:00:00', NULL, '2026-09-15 11:53:52.688');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r9000ftre7drj0xkcjp', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfj005ire7d0j1oslen', 'SALE', -11.000, 810.000, NULL, 'INV-2026-00028', 'invoice', 'cmu2m5r8q00fore7dzs55d1jb', 'Sold on INV-2026-00028', '2026-09-12 00:00:00', NULL, '2026-09-15 11:53:52.692');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r9d00g0re7duu62xexr', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qe50052re7dc6c2dp86', 'SALE', -10.000, 193.000, NULL, 'INV-2026-00029', 'invoice', 'cmu2m5r9600fvre7dy356jx42', 'Sold on INV-2026-00029', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:52.705');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r9g00g1re7dqt9xme52', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfe005gre7d9may8zcq', 'SALE', -9.000, 330.000, NULL, 'INV-2026-00029', 'invoice', 'cmu2m5r9600fvre7dy356jx42', 'Sold on INV-2026-00029', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:52.708');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5r9k00g2re7dh74eu0xz', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qf8005ere7dkqaqh8xp', 'SALE', -11.000, 46.000, NULL, 'INV-2026-00029', 'invoice', 'cmu2m5r9600fvre7dy356jx42', 'Sold on INV-2026-00029', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:52.712');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu2m5ra500gare7dtoh9o8q1', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qfz005ore7dkinlmvna', 'SALE', -14.000, 466.000, NULL, 'INV-2026-00030', 'invoice', 'cmu2m5r9z00g7re7dhj28yo6z', 'Sold on INV-2026-00030', '2026-09-15 00:00:00', NULL, '2026-09-15 11:53:52.733');


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qip006cre7dq3v2wla6', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgs005wre7d9ri8rsrs', 'QTE-2026-00001', 'ACCEPTED', '2026-07-07 11:53:50.552', '2026-08-06 11:53:50.552', 'GHS', 4896.00, 'PERCENTAGE', 5.00, 242.23, 460.24, 5062.66, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-08 11:53:50.552', '2026-07-12 11:53:50.552', NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-07 11:53:50.552', '2026-09-15 11:53:51.745', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qj2006jre7dksewxdz1', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qgw005xre7dqqd7l1ko', 'QTE-2026-00002', 'SENT', '2026-07-30 11:53:50.552', '2026-08-29 11:53:50.552', 'GHS', 6230.00, 'PERCENTAGE', 0.00, 0.00, 606.09, 6667.04, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-31 11:53:50.552', NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-30 11:53:50.552', '2026-09-15 11:53:51.758', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qjd006pre7d0brn314d', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qh0005yre7daipt8vxa', 'QTE-2026-00003', 'DRAFT', '2026-08-20 11:53:50.552', '2026-09-19 11:53:50.552', 'GHS', 3890.00, 'PERCENTAGE', 0.00, 0.00, 389.00, 4279.00, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', NULL, NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-20 11:53:50.552', '2026-09-15 11:53:51.769', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qjo006vre7d3uo9dj45', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qh3005zre7dr7tm42fb', 'QTE-2026-00004', 'REJECTED', '2026-07-13 11:53:50.552', '2026-08-12 11:53:50.552', 'GHS', 17225.00, 'PERCENTAGE', 5.00, 856.26, 1626.90, 17895.89, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-14 11:53:50.552', NULL, '2026-07-19 11:53:50.552', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-13 11:53:50.552', '2026-09-15 11:53:51.78', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qjy0070re7d3rg2yqio', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qh90060re7dlc2x2rhs', 'QTE-2026-00005', 'SENT', '2026-09-07 11:53:50.552', '2026-10-07 11:53:50.552', 'GHS', 18096.00, 'PERCENTAGE', 0.00, 0.00, 1769.49, 19464.39, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-09-08 11:53:50.552', NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-07 11:53:50.552', '2026-09-15 11:53:51.79', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qk90077re7d4vff9uqs', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhc0061re7dbvxmy9ds', 'QTE-2026-00006', 'EXPIRED', '2026-07-29 11:53:50.552', '2026-08-28 11:53:50.552', 'GHS', 26842.00, 'PERCENTAGE', 0.00, 0.00, 2684.20, 29526.20, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-30 11:53:50.552', NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-29 11:53:50.552', '2026-09-15 11:53:51.801', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qkj007cre7d7a468wkb', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhg0062re7dwhqjf5gz', 'QTE-2026-00007', 'ACCEPTED', '2026-06-23 11:53:50.552', '2026-07-23 11:53:50.552', 'GHS', 35884.00, 'PERCENTAGE', 5.00, 1792.85, 3406.42, 37470.57, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-06-24 11:53:50.552', '2026-07-02 11:53:50.552', NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-23 11:53:50.552', '2026-09-15 11:53:51.812', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qku007jre7dg4g02dgb', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhi0063re7drcubbbam', 'QTE-2026-00008', 'SENT', '2026-08-07 11:53:50.552', '2026-09-06 11:53:50.552', 'GHS', 26465.00, 'PERCENTAGE', 0.00, 0.00, 2646.50, 29111.50, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-08 11:53:50.552', NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-07 11:53:50.552', '2026-09-15 11:53:51.822', NULL);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qlb007pre7db09ezknv', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qgs005wre7d9ri8rsrs', 'INV-2026-00001', 'PAID', '2026-03-23 00:00:00', '2026-04-06 00:00:00', 'GHS', 27587.00, 'PERCENTAGE', 3.00, 788.17, 2548.41, 0.00, 28032.54, 28032.54, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-03-24 00:00:00', '2026-03-25 00:00:00', '2026-04-01 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-03-23 00:00:00', '2026-09-15 11:53:51.84', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qn10083re7d27fd8jh1', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qgw005xre7dqqd7l1ko', 'INV-2026-00002', 'PAID', '2026-04-02 00:00:00', '2026-05-02 00:00:00', 'GHS', 10877.00, 'PERCENTAGE', 0.00, 0.00, 1087.70, 0.00, 11964.70, 11964.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-04-03 00:00:00', '2026-04-04 00:00:00', '2026-04-30 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-02 00:00:00', '2026-09-15 11:53:51.901', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qnw008dre7dtiadnwde', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh0005yre7daipt8vxa', 'INV-2026-00003', 'PAID', '2026-04-18 00:00:00', '2026-05-02 00:00:00', 'GHS', 10874.00, 'PERCENTAGE', 0.00, 0.00, 1075.43, 0.00, 11829.73, 11829.73, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-04-19 00:00:00', '2026-04-20 00:00:00', '2026-05-02 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-04-18 00:00:00', '2026-09-15 11:53:51.932', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qox008nre7duwayrr4c', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh3005zre7dr7tm42fb', 'INV-2026-00004', 'PAID', '2026-05-03 00:00:00', '2026-06-02 00:00:00', 'GHS', 22942.00, 'PERCENTAGE', 0.00, 0.00, 2291.71, 0.00, 25208.81, 25208.81, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-05-04 00:00:00', '2026-05-05 00:00:00', '2026-05-14 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-03 00:00:00', '2026-09-15 11:53:51.969', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qqb0091re7ddhbz29px', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh90060re7dlc2x2rhs', 'INV-2026-00005', 'PAID', '2026-05-10 00:00:00', '2026-05-24 00:00:00', 'GHS', 23881.00, 'PERCENTAGE', 3.00, 698.12, 2257.25, 0.00, 24829.78, 24829.78, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-05-11 00:00:00', '2026-05-12 00:00:00', '2026-05-20 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-10 00:00:00', '2026-09-15 11:53:52.019', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qrn009fre7dj7wo1eap', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhc0061re7dbvxmy9ds', 'INV-2026-00006', 'PAID', '2026-05-10 00:00:00', '2026-05-24 00:00:00', 'GHS', 8067.00, 'PERCENTAGE', 0.00, 0.00, 773.24, 0.00, 8505.64, 8505.64, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-05-11 00:00:00', '2026-05-12 00:00:00', '2026-05-23 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-05-10 00:00:00', '2026-09-15 11:53:52.067', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qsh009pre7dh78fzcq2', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhg0062re7dwhqjf5gz', 'INV-2026-00007', 'PAID', '2026-06-01 00:00:00', '2026-07-01 00:00:00', 'GHS', 4717.00, 'PERCENTAGE', 0.00, 0.00, 471.70, 0.00, 5188.70, 5188.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-02 00:00:00', '2026-06-03 00:00:00', '2026-06-05 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-01 00:00:00', '2026-09-15 11:53:52.097', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qti009zre7d6mj846xr', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhi0063re7drcubbbam', 'INV-2026-00008', 'PAID', '2026-06-03 00:00:00', '2026-07-03 00:00:00', 'GHS', 3284.00, 'PERCENTAGE', 0.00, 0.00, 317.54, 0.00, 3492.94, 3492.94, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-04 00:00:00', '2026-06-05 00:00:00', '2026-06-27 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-03 00:00:00', '2026-09-15 11:53:52.134', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qui00abre7de3op5olx', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhl0064re7d1vp4egez', 'INV-2026-00009', 'PAID', '2026-06-03 00:00:00', '2026-06-17 00:00:00', 'GHS', 11742.00, 'PERCENTAGE', 3.00, 351.45, 1136.36, 0.00, 12499.91, 12499.91, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-06-04 00:00:00', '2026-06-05 00:00:00', '2026-06-13 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-03 00:00:00', '2026-09-15 11:53:52.17', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qvi00anre7dw0u2uop0', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qho0065re7d4hn7mtvt', 'INV-2026-00010', 'PAID', '2026-06-13 00:00:00', '2026-07-13 00:00:00', 'GHS', 18104.00, 'PERCENTAGE', 0.00, 0.00, 1747.15, 0.00, 19218.65, 19218.65, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-14 00:00:00', '2026-06-15 00:00:00', '2026-06-27 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-13 00:00:00', '2026-09-15 11:53:52.206', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qwe00azre7d5d3jtv01', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qgs005wre7d9ri8rsrs', 'INV-2026-00011', 'PAID', '2026-06-22 00:00:00', '2026-07-22 00:00:00', 'GHS', 3693.00, 'PERCENTAGE', 0.00, 0.00, 368.11, 0.00, 4049.21, 4049.21, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-23 00:00:00', '2026-06-24 00:00:00', '2026-07-02 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-06-22 00:00:00', '2026-09-15 11:53:52.239', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qxf00bdre7dnbkh7xqi', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qgw005xre7dqqd7l1ko', 'INV-2026-00012', 'PAID', '2026-07-01 00:00:00', '2026-07-15 00:00:00', 'GHS', 25416.00, 'PERCENTAGE', 0.00, 0.00, 2423.68, 0.00, 26660.48, 26660.48, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-02 00:00:00', '2026-07-03 00:00:00', '2026-07-04 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-01 00:00:00', '2026-09-15 11:53:52.275', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qyd00brre7dfla32z0w', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh0005yre7daipt8vxa', 'INV-2026-00013', 'PAID', '2026-07-02 00:00:00', '2026-07-16 00:00:00', 'GHS', 10807.00, 'PERCENTAGE', 3.00, 324.21, 1048.28, 0.00, 11531.07, 11531.07, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-03 00:00:00', '2026-07-04 00:00:00', '2026-07-08 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-02 00:00:00', '2026-09-15 11:53:52.309', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qz100c1re7dzqe5qp5x', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh3005zre7dr7tm42fb', 'INV-2026-00014', 'PAID', '2026-07-04 00:00:00', '2026-07-18 00:00:00', 'GHS', 20327.00, 'PERCENTAGE', 0.00, 0.00, 2032.70, 0.00, 22359.70, 22359.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-05 00:00:00', '2026-07-06 00:00:00', '2026-07-15 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-04 00:00:00', '2026-09-15 11:53:52.333', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qzp00cbre7dis0i45gx', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh90060re7dlc2x2rhs', 'INV-2026-00015', 'PAID', '2026-07-12 00:00:00', '2026-07-26 00:00:00', 'GHS', 12296.00, 'PERCENTAGE', 0.00, 0.00, 1229.60, 0.00, 13525.60, 13525.60, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-13 00:00:00', '2026-07-14 00:00:00', '2026-07-21 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-12 00:00:00', '2026-09-15 11:53:52.357', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r0l00cnre7dhwwlpurr', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhc0061re7dbvxmy9ds', 'INV-2026-00016', 'PAID', '2026-07-28 00:00:00', '2026-08-27 00:00:00', 'GHS', 10809.00, 'PERCENTAGE', 0.00, 0.00, 1080.90, 0.00, 11889.90, 11889.90, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-07-29 00:00:00', '2026-07-30 00:00:00', '2026-08-05 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-28 00:00:00', '2026-09-15 11:53:52.389', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r1h00czre7dg6eypjys', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhg0062re7dwhqjf5gz', 'INV-2026-00017', 'PAID', '2026-07-31 00:00:00', '2026-08-30 00:00:00', 'GHS', 11037.00, 'PERCENTAGE', 3.00, 318.75, 1030.63, 0.00, 11336.93, 11336.93, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-08-01 00:00:00', '2026-08-02 00:00:00', '2026-08-29 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-07-31 00:00:00', '2026-09-15 11:53:52.421', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r2i00d9re7dufebeckx', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhi0063re7drcubbbam', 'INV-2026-00018', 'PAID', '2026-08-07 00:00:00', '2026-09-06 00:00:00', 'GHS', 44848.00, 'PERCENTAGE', 0.00, 0.00, 4477.31, 0.00, 49250.41, 49250.41, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-08-08 00:00:00', '2026-08-09 00:00:00', '2026-08-10 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-07 00:00:00', '2026-09-15 11:53:52.458', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r3f00dlre7db72s1kyj', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhl0064re7d1vp4egez', 'INV-2026-00019', 'PAID', '2026-08-16 00:00:00', '2026-08-30 00:00:00', 'GHS', 2841.00, 'PERCENTAGE', 0.00, 0.00, 284.10, 0.00, 3125.10, 3125.10, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-08-17 00:00:00', '2026-08-18 00:00:00', '2026-08-29 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-08-16 00:00:00', '2026-09-15 11:53:52.491', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r4000dtre7dw8sz198v', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qho0065re7d4hn7mtvt', 'INV-2026-00020', 'DRAFT', '2026-09-01 00:00:00', '2026-09-15 00:00:00', 'GHS', 1484.00, 'PERCENTAGE', 0.00, 0.00, 148.40, 0.00, 1632.40, 0.00, 1632.40, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-01 00:00:00', '2026-09-15 11:53:52.512', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r4a00dxre7dzw6zvy0r', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qgs005wre7d9ri8rsrs', 'INV-2026-00021', 'SENT', '2026-09-02 00:00:00', '2026-09-23 00:00:00', 'GHS', 4985.00, 'PERCENTAGE', 3.00, 149.55, 483.55, 0.00, 5319.00, 0.00, 5319.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 21 days of the invoice date.', NULL, NULL, NULL, '2026-09-03 00:00:00', NULL, NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-02 00:00:00', '2026-09-15 11:53:52.522', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r4w00e6re7d17jpkana', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qgw005xre7dqqd7l1ko', 'INV-2026-00022', 'PAID', '2026-09-04 00:00:00', '2026-09-18 00:00:00', 'GHS', 3241.00, 'PERCENTAGE', 0.00, 0.00, 324.10, 0.00, 3565.10, 3565.10, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-05 00:00:00', '2026-09-06 00:00:00', '2026-09-07 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-04 00:00:00', '2026-09-15 11:53:52.544', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r5m00egre7dqctxblxc', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh0005yre7daipt8vxa', 'INV-2026-00023', 'VIEWED', '2026-09-05 00:00:00', '2026-10-05 00:00:00', 'GHS', 5401.00, 'PERCENTAGE', 0.00, 0.00, 534.33, 0.00, 5877.58, 0.00, 5877.58, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-06 00:00:00', '2026-09-07 00:00:00', NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-05 00:00:00', '2026-09-15 11:53:52.57', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r6900epre7d5cd15ikl', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh3005zre7dr7tm42fb', 'INV-2026-00024', 'CANCELLED', '2026-09-07 00:00:00', '2026-10-07 00:00:00', 'GHS', 8428.00, 'PERCENTAGE', 0.00, 0.00, 810.67, 0.00, 8917.37, 0.00, 8917.37, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-08 00:00:00', NULL, NULL, '2026-09-11 00:00:00', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-07 00:00:00', '2026-09-15 11:53:52.593', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r6i00eure7d6bq30cog', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qh90060re7dlc2x2rhs', 'INV-2026-00025', 'PAID', '2026-09-08 00:00:00', '2026-09-22 00:00:00', 'GHS', 5542.00, 'PERCENTAGE', 3.00, 166.26, 537.57, 0.00, 5913.31, 5913.31, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-09 00:00:00', '2026-09-10 00:00:00', '2026-09-12 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-08 00:00:00', '2026-09-15 11:53:52.602', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r7b00f4re7d6i1qise6', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhc0061re7dbvxmy9ds', 'INV-2026-00026', 'PARTIALLY_PAID', '2026-09-09 00:00:00', '2026-10-09 00:00:00', 'GHS', 3115.00, 'PERCENTAGE', 0.00, 0.00, 311.50, 0.00, 3426.50, 1370.60, 2055.90, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-10 00:00:00', '2026-09-11 00:00:00', NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-09 00:00:00', '2026-09-15 11:53:52.631', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r7z00fere7dbwvdrted', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhg0062re7dwhqjf5gz', 'INV-2026-00027', 'PAID', '2026-09-11 00:00:00', '2026-10-11 00:00:00', 'GHS', 9906.00, 'PERCENTAGE', 0.00, 0.00, 969.95, 0.00, 10669.40, 10669.40, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-12 00:00:00', '2026-09-13 00:00:00', '2026-09-15 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-11 00:00:00', '2026-09-15 11:53:52.655', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r8q00fore7dzs55d1jb', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhi0063re7drcubbbam', 'INV-2026-00028', 'OVERDUE', '2026-09-12 00:00:00', '2026-09-26 00:00:00', 'GHS', 5984.00, 'PERCENTAGE', 0.00, 0.00, 598.40, 0.00, 6582.40, 0.00, 6582.40, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-13 00:00:00', '2026-09-14 00:00:00', NULL, NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-12 00:00:00', '2026-09-15 11:53:52.682', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r9600fvre7dy356jx42', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qhl0064re7d1vp4egez', 'INV-2026-00029', 'PAID', '2026-09-14 00:00:00', '2026-09-28 00:00:00', 'GHS', 9615.00, 'PERCENTAGE', 3.00, 280.86, 908.11, 0.00, 9989.20, 9989.20, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-15 00:00:00', '2026-09-16 00:00:00', '2026-09-17 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-14 00:00:00', '2026-09-15 11:53:52.699', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r9z00g7re7dhj28yo6z', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'cmu2m5qho0065re7d4hn7mtvt', 'INV-2026-00030', 'PAID', '2026-09-15 00:00:00', '2026-10-15 00:00:00', 'GHS', 2426.00, 'PERCENTAGE', 0.00, 0.00, 242.60, 0.00, 2668.60, 2668.60, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-16 00:00:00', '2026-09-17 00:00:00', '2026-10-13 00:00:00', NULL, 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 00:00:00', '2026-09-15 11:53:52.728', NULL);


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qle007qre7d8cwet7oc', 'cmu2m5qlb007pre7db09ezknv', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 5.000, 'unit', 34.00, 0.000, 10.000, 170.00, 0.00, 17.00, 187.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qle007rre7dzi06y6xb', 'cmu2m5qlb007pre7db09ezknv', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 11.000, 'unit', 399.00, 5.000, 10.000, 4389.00, 219.45, 416.96, 4586.51, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qle007sre7d4ua7aod5', 'cmu2m5qlb007pre7db09ezknv', 'cmu2m5qdt004yre7dimm5gfej', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 13.000, 'unit', 1685.00, 5.000, 10.000, 21905.00, 1095.25, 2080.98, 22890.73, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qle007tre7dwwth8a0l', 'cmu2m5qlb007pre7db09ezknv', 'cmu2m5qeh0056re7dfkc2xab5', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 2.000, 'unit', 249.00, 0.000, 10.000, 498.00, 0.00, 49.80, 547.80, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qle007ure7dts6wl9np', 'cmu2m5qlb007pre7db09ezknv', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 5.000, 'hour', 125.00, 0.000, 10.000, 625.00, 0.00, 62.50, 687.50, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qn20084re7dl0hvqc7w', 'cmu2m5qn10083re7d27fd8jh1', 'cmu2m5qdo004wre7dbdx2m7tp', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 13.000, 'unit', 689.00, 0.000, 10.000, 8957.00, 0.00, 895.70, 9852.70, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qn20085re7dxflwp7vv', 'cmu2m5qn10083re7d27fd8jh1', 'cmu2m5qfj005ire7d0j1oslen', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 5.000, 'unit', 84.00, 0.000, 10.000, 420.00, 0.00, 42.00, 462.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qn20086re7ddoz38tjw', 'cmu2m5qn10083re7d27fd8jh1', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qnx008ere7dam1a39kt', 'cmu2m5qnw008dre7dtiadnwde', 'cmu2m5qf0005cre7dq6e4smnu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 9.000, 'unit', 845.00, 0.000, 10.000, 7605.00, 0.00, 760.50, 8365.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qnx008fre7djrxhka1h', 'cmu2m5qnw008dre7dtiadnwde', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 6.000, 'unit', 399.00, 5.000, 10.000, 2394.00, 119.70, 227.43, 2501.73, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qnx008gre7dcgznpr5l', 'cmu2m5qnw008dre7dtiadnwde', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qoy008ore7da2zpoc8w', 'cmu2m5qox008nre7duwayrr4c', 'cmu2m5qdo004wre7dbdx2m7tp', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 2.000, 'unit', 689.00, 0.000, 10.000, 1378.00, 0.00, 137.80, 1515.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qoy008pre7deo9p1orx', 'cmu2m5qox008nre7duwayrr4c', 'cmu2m5qf0005cre7dq6e4smnu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 12.000, 'unit', 845.00, 0.000, 10.000, 10140.00, 0.00, 1014.00, 11154.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qoy008qre7dqz4sq06d', 'cmu2m5qox008nre7duwayrr4c', 'cmu2m5qeh0056re7dfkc2xab5', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 2.000, 'unit', 249.00, 5.000, 10.000, 498.00, 24.90, 47.31, 520.41, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qoy008rre7dbogtziky', 'cmu2m5qox008nre7duwayrr4c', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 14.000, 'unit', 749.00, 0.000, 10.000, 10486.00, 0.00, 1048.60, 11534.60, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qoy008sre7dormui6qj', 'cmu2m5qox008nre7duwayrr4c', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 5.000, 'hour', 88.00, 0.000, 10.000, 440.00, 0.00, 44.00, 484.00, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qqc0092re7d8mcoegd1', 'cmu2m5qqb0091re7ddhbz29px', 'cmu2m5qdo004wre7dbdx2m7tp', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 3.000, 'unit', 689.00, 5.000, 10.000, 2067.00, 103.35, 196.37, 2160.02, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qqd0093re7dofedhvmi', 'cmu2m5qqb0091re7ddhbz29px', 'cmu2m5qeo0058re7d1shc6du1', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 9.000, 'unit', 1150.00, 0.000, 10.000, 10350.00, 0.00, 1035.00, 11385.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qqd0094re7dk9074eby', 'cmu2m5qqb0091re7ddhbz29px', 'cmu2m5qf0005cre7dq6e4smnu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 12.000, 'unit', 845.00, 5.000, 10.000, 10140.00, 507.00, 963.30, 10596.30, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qqd0095re7dnrrbntld', 'cmu2m5qqb0091re7ddhbz29px', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 4.000, 'unit', 45.00, 0.000, 10.000, 180.00, 0.00, 18.00, 198.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qqd0096re7dh9ijjrwz', 'cmu2m5qqb0091re7ddhbz29px', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 13.000, 'hour', 88.00, 0.000, 10.000, 1144.00, 0.00, 114.40, 1258.40, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qro009gre7d1o9tc3r7', 'cmu2m5qrn009fre7dj7wo1eap', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 5.000, 10.000, 1106.00, 55.30, 105.07, 1155.77, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qro009hre7d8sli5bky', 'cmu2m5qrn009fre7dj7wo1eap', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 14.000, 'unit', 399.00, 5.000, 10.000, 5586.00, 279.30, 530.67, 5837.37, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qro009ire7dpyqtza3w', 'cmu2m5qrn009fre7dj7wo1eap', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 11.000, 'hour', 125.00, 0.000, 10.000, 1375.00, 0.00, 137.50, 1512.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qsi009qre7d7gerk8j1', 'cmu2m5qsh009pre7dh78fzcq2', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qsi009rre7d2zcwvk7g', 'cmu2m5qsh009pre7dh78fzcq2', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 7.000, 'unit', 459.00, 0.000, 10.000, 3213.00, 0.00, 321.30, 3534.30, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qsi009sre7dyguom8vj', 'cmu2m5qsh009pre7dh78fzcq2', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 13.000, 'hour', 88.00, 0.000, 10.000, 1144.00, 0.00, 114.40, 1258.40, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qtj00a0re7dx9fk1rk9', 'cmu2m5qti009zre7d6mj846xr', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 12.000, 'unit', 34.00, 0.000, 10.000, 408.00, 0.00, 40.80, 448.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qtj00a1re7dghe95gj1', 'cmu2m5qti009zre7d6mj846xr', 'cmu2m5qeh0056re7dfkc2xab5', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 8.000, 'unit', 249.00, 5.000, 10.000, 1992.00, 99.60, 189.24, 2081.64, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qtj00a2re7di42pneg8', 'cmu2m5qti009zre7d6mj846xr', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 4.000, 'unit', 45.00, 5.000, 10.000, 180.00, 9.00, 17.10, 188.10, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qtj00a3re7dlyc9343b', 'cmu2m5qti009zre7d6mj846xr', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 8.000, 'hour', 88.00, 0.000, 10.000, 704.00, 0.00, 70.40, 774.40, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5quj00acre7db1yst484', 'cmu2m5qui00abre7de3op5olx', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 5.000, 10.000, 540.00, 27.00, 51.30, 564.30, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5quj00adre7doawxapvg', 'cmu2m5qui00abre7de3op5olx', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 10.000, 'unit', 34.00, 0.000, 10.000, 340.00, 0.00, 34.00, 374.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5quj00aere7d6bziffd7', 'cmu2m5qui00abre7de3op5olx', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 13.000, 'unit', 749.00, 0.000, 10.000, 9737.00, 0.00, 973.70, 10710.70, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5quj00afre7dz0906gez', 'cmu2m5qui00abre7de3op5olx', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 9.000, 'hour', 125.00, 0.000, 10.000, 1125.00, 0.00, 112.50, 1237.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qvj00aore7dm28t7aj3', 'cmu2m5qvi00anre7dw0u2uop0', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 10.000, 'unit', 399.00, 0.000, 10.000, 3990.00, 0.00, 399.00, 4389.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qvj00apre7d40mn4qko', 'cmu2m5qvi00anre7dw0u2uop0', 'cmu2m5qfe005gre7d9may8zcq', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 6.000, 'unit', 119.00, 0.000, 10.000, 714.00, 0.00, 71.40, 785.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qvj00aqre7dfl35jbhi', 'cmu2m5qvi00anre7dw0u2uop0', 'cmu2m5qeo0058re7d1shc6du1', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 11.000, 'unit', 1150.00, 5.000, 10.000, 12650.00, 632.50, 1201.75, 13219.25, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qvj00arre7dk84c42jm', 'cmu2m5qvi00anre7dw0u2uop0', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 6.000, 'hour', 125.00, 0.000, 10.000, 750.00, 0.00, 75.00, 825.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qwf00b0re7dsfxymyv7', 'cmu2m5qwe00azre7d5d3jtv01', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 7.000, 'unit', 34.00, 5.000, 10.000, 238.00, 11.90, 22.61, 248.71, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qwf00b1re7dpcn198vu', 'cmu2m5qwe00azre7d5d3jtv01', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 0.000, 10.000, 540.00, 0.00, 54.00, 594.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qwf00b2re7d5ur6t3hl', 'cmu2m5qwe00azre7d5d3jtv01', 'cmu2m5qf8005ere7dkqaqh8xp', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 5.000, 'unit', 289.00, 0.000, 10.000, 1445.00, 0.00, 144.50, 1589.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qwf00b3re7du1gfd1ax', 'cmu2m5qwe00azre7d5d3jtv01', 'cmu2m5qfe005gre7d9may8zcq', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 5.000, 'unit', 119.00, 0.000, 10.000, 595.00, 0.00, 59.50, 654.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qwf00b4re7d2k82hrj7', 'cmu2m5qwe00azre7d5d3jtv01', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qxg00bere7dxjvt02d6', 'cmu2m5qxf00bdre7dnbkh7xqi', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 0.000, 10.000, 1106.00, 0.00, 110.60, 1216.60, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qxg00bfre7dwp1fea1f', 'cmu2m5qxf00bdre7dnbkh7xqi', 'cmu2m5qdt004yre7dimm5gfej', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 11.000, 'unit', 1685.00, 5.000, 10.000, 18535.00, 926.75, 1760.83, 19369.08, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qxg00bgre7djdbqejj9', 'cmu2m5qxf00bdre7dnbkh7xqi', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 11.000, 'unit', 459.00, 5.000, 10.000, 5049.00, 252.45, 479.66, 5276.21, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qxg00bhre7dgc119aek', 'cmu2m5qxf00bdre7dnbkh7xqi', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 11.000, 'unit', 34.00, 0.000, 10.000, 374.00, 0.00, 37.40, 411.40, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qxg00bire7d6eq6k3ba', 'cmu2m5qxf00bdre7dnbkh7xqi', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qye00bsre7dpyorahym', 'cmu2m5qyd00brre7dfla32z0w', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 8.000, 'unit', 79.00, 0.000, 10.000, 632.00, 0.00, 63.20, 695.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qye00btre7df2q2dnd5', 'cmu2m5qyd00brre7dfla32z0w', 'cmu2m5qf0005cre7dq6e4smnu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 11.000, 'unit', 845.00, 0.000, 10.000, 9295.00, 0.00, 929.50, 10224.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qye00bure7d5xiopwya', 'cmu2m5qyd00brre7dfla32z0w', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qz200c2re7d7ruhtb2a', 'cmu2m5qz100c1re7dzqe5qp5x', 'cmu2m5qdt004yre7dimm5gfej', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 8.000, 'unit', 1685.00, 0.000, 10.000, 13480.00, 0.00, 1348.00, 14828.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qz200c3re7dr4qxroi5', 'cmu2m5qz100c1re7dzqe5qp5x', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 13.000, 'unit', 459.00, 0.000, 10.000, 5967.00, 0.00, 596.70, 6563.70, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qz200c4re7dr6wmii2r', 'cmu2m5qz100c1re7dzqe5qp5x', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qzq00ccre7dlrjh4s0u', 'cmu2m5qzp00cbre7dis0i45gx', 'cmu2m5qf8005ere7dkqaqh8xp', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 9.000, 'unit', 289.00, 0.000, 10.000, 2601.00, 0.00, 260.10, 2861.10, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qzq00cdre7ddt3vce4d', 'cmu2m5qzp00cbre7dis0i45gx', 'cmu2m5qet005are7dgov0muq3', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 9.000, 'unit', 165.00, 0.000, 10.000, 1485.00, 0.00, 148.50, 1633.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qzq00cere7dxcfwk3pw', 'cmu2m5qzp00cbre7dis0i45gx', 'cmu2m5qdo004wre7dbdx2m7tp', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 10.000, 'unit', 689.00, 0.000, 10.000, 6890.00, 0.00, 689.00, 7579.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qzq00cfre7d1ftf6m7t', 'cmu2m5qzp00cbre7dis0i45gx', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r0m00core7dfm7qn60i', 'cmu2m5r0l00cnre7dhwwlpurr', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r0m00cpre7dfiql7fwy', 'cmu2m5r0l00cnre7dhwwlpurr', 'cmu2m5qfj005ire7d0j1oslen', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 4.000, 'unit', 84.00, 0.000, 10.000, 336.00, 0.00, 33.60, 369.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r0m00cqre7d4irupwrl', 'cmu2m5r0l00cnre7dhwwlpurr', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 12.000, 'unit', 749.00, 0.000, 10.000, 8988.00, 0.00, 898.80, 9886.80, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r0m00crre7d6vtm5jyd', 'cmu2m5r0l00cnre7dhwwlpurr', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 9.000, 'hour', 125.00, 0.000, 10.000, 1125.00, 0.00, 112.50, 1237.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r1i00d0re7dz0z3vh2v', 'cmu2m5r1h00czre7dg6eypjys', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 11.000, 'unit', 749.00, 5.000, 10.000, 8239.00, 411.95, 782.71, 8609.76, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r1i00d1re7dqa7fk763', 'cmu2m5r1h00czre7dg6eypjys', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 2.000, 'unit', 399.00, 0.000, 10.000, 798.00, 0.00, 79.80, 877.80, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r1i00d2re7d5esiks2j', 'cmu2m5r1h00czre7dg6eypjys', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 16.000, 'hour', 125.00, 0.000, 10.000, 2000.00, 0.00, 200.00, 2200.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r2j00dare7d4xeedb1z', 'cmu2m5r2i00d9re7dufebeckx', 'cmu2m5qfe005gre7d9may8zcq', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 2.000, 'unit', 119.00, 0.000, 10.000, 238.00, 0.00, 23.80, 261.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r2j00dbre7dsoyl2phw', 'cmu2m5r2i00d9re7dufebeckx', 'cmu2m5qfu005mre7dku4pb497', 'Phone Booth Single', 'Single-occupancy acoustic pod with ventilation and lighting.', 8.000, 'unit', 5290.00, 0.000, 10.000, 42320.00, 0.00, 4232.00, 46552.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r2j00dcre7dehabg6ql', 'cmu2m5r2i00d9re7dufebeckx', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 2.000, 'unit', 749.00, 5.000, 10.000, 1498.00, 74.90, 142.31, 1565.41, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r2j00ddre7dbogv20w7', 'cmu2m5r2i00d9re7dufebeckx', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 9.000, 'hour', 88.00, 0.000, 10.000, 792.00, 0.00, 79.20, 871.20, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r3g00dmre7dz0uqnqjj', 'cmu2m5r3f00dlre7db72s1kyj', 'cmu2m5qdz0050re7dvznnyfwb', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 5.000, 'unit', 445.00, 0.000, 10.000, 2225.00, 0.00, 222.50, 2447.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r3g00dnre7d7si6pio5', 'cmu2m5r3f00dlre7db72s1kyj', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 7.000, 'hour', 88.00, 0.000, 10.000, 616.00, 0.00, 61.60, 677.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4100dure7dms6712hq', 'cmu2m5r4000dtre7dw8sz198v', 'cmu2m5qfj005ire7d0j1oslen', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 3.000, 'unit', 84.00, 0.000, 10.000, 252.00, 0.00, 25.20, 277.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4100dvre7d3m7imi0i', 'cmu2m5r4000dtre7dw8sz198v', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 14.000, 'hour', 88.00, 0.000, 10.000, 1232.00, 0.00, 123.20, 1355.20, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4b00dyre7dtsiy9qe8', 'cmu2m5r4a00dxre7dzw6zvy0r', 'cmu2m5qfj005ire7d0j1oslen', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 10.000, 'unit', 84.00, 0.000, 10.000, 840.00, 0.00, 84.00, 924.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4b00dzre7dq42candk', 'cmu2m5r4a00dxre7dzw6zvy0r', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 4.000, 'unit', 79.00, 0.000, 10.000, 316.00, 0.00, 31.60, 347.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4b00e0re7dp928qn7v', 'cmu2m5r4a00dxre7dzw6zvy0r', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 7.000, 'unit', 459.00, 0.000, 10.000, 3213.00, 0.00, 321.30, 3534.30, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4b00e1re7d0qf04mhu', 'cmu2m5r4a00dxre7dzw6zvy0r', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 7.000, 'hour', 88.00, 0.000, 10.000, 616.00, 0.00, 61.60, 677.60, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4w00e7re7d6ygm2l9p', 'cmu2m5r4w00e6re7d17jpkana', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 3.000, 'unit', 45.00, 0.000, 10.000, 135.00, 0.00, 13.50, 148.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4w00e8re7dnmxti5iq', 'cmu2m5r4w00e6re7d17jpkana', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 6.000, 'unit', 459.00, 0.000, 10.000, 2754.00, 0.00, 275.40, 3029.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r4w00e9re7de37e8xl4', 'cmu2m5r4w00e6re7d17jpkana', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r5n00ehre7dkde90ato', 'cmu2m5r5m00egre7dqctxblxc', 'cmu2m5qet005are7dgov0muq3', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 7.000, 'unit', 165.00, 5.000, 10.000, 1155.00, 57.75, 109.73, 1206.98, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r5n00eire7d0w9pzvnq', 'cmu2m5r5m00egre7dqctxblxc', 'cmu2m5qdo004wre7dbdx2m7tp', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 4.000, 'unit', 689.00, 0.000, 10.000, 2756.00, 0.00, 275.60, 3031.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r5n00ejre7dhw239kjw', 'cmu2m5r5m00egre7dqctxblxc', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 5.000, 'unit', 34.00, 0.000, 10.000, 170.00, 0.00, 17.00, 187.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r5n00ekre7dl56fhtp0', 'cmu2m5r5m00egre7dqctxblxc', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r6a00eqre7dm6x7ntih', 'cmu2m5r6900epre7d5cd15ikl', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 14.000, 'unit', 459.00, 5.000, 10.000, 6426.00, 321.30, 610.47, 6715.17, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r6a00erre7dh82ffnpv', 'cmu2m5r6900epre7d5cd15ikl', 'cmu2m5qet005are7dgov0muq3', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 10.000, 'unit', 165.00, 0.000, 10.000, 1650.00, 0.00, 165.00, 1815.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r6a00esre7dj2hph99s', 'cmu2m5r6900epre7d5cd15ikl', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r6j00evre7didm9k42o', 'cmu2m5r6i00eure7d6bq30cog', 'cmu2m5qf8005ere7dkqaqh8xp', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 5.000, 'unit', 289.00, 0.000, 10.000, 1445.00, 0.00, 144.50, 1589.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r6j00ewre7d010dyufk', 'cmu2m5r6i00eure7d6bq30cog', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 5.000, 'unit', 749.00, 0.000, 10.000, 3745.00, 0.00, 374.50, 4119.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r6j00exre7d49z5219i', 'cmu2m5r6i00eure7d6bq30cog', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r7b00f5re7dvpbx22ej', 'cmu2m5r7b00f4re7d6i1qise6', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 13.000, 'unit', 34.00, 0.000, 10.000, 442.00, 0.00, 44.20, 486.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r7b00f6re7d1b3il8pn', 'cmu2m5r7b00f4re7d6i1qise6', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 2.000, 'unit', 399.00, 0.000, 10.000, 798.00, 0.00, 79.80, 877.80, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r7b00f7re7dadb1w3xb', 'cmu2m5r7b00f4re7d6i1qise6', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 15.000, 'hour', 125.00, 0.000, 10.000, 1875.00, 0.00, 187.50, 2062.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r8000ffre7do8jgswnv', 'cmu2m5r7z00fere7dbwvdrted', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 9.000, 'unit', 459.00, 5.000, 10.000, 4131.00, 206.55, 392.45, 4316.90, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r8000fgre7dggp6nqu1', 'cmu2m5r7z00fere7dbwvdrted', 'cmu2m5qdz0050re7dvznnyfwb', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 11.000, 'unit', 445.00, 0.000, 10.000, 4895.00, 0.00, 489.50, 5384.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r8000fhre7dvhadfasc', 'cmu2m5r7z00fere7dbwvdrted', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r8r00fpre7dotty66ph', 'cmu2m5r8q00fore7dzs55d1jb', 'cmu2m5qdz0050re7dvznnyfwb', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 8.000, 'unit', 445.00, 0.000, 10.000, 3560.00, 0.00, 356.00, 3916.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r8r00fqre7dlfm7l4q8', 'cmu2m5r8q00fore7dzs55d1jb', 'cmu2m5qfj005ire7d0j1oslen', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 11.000, 'unit', 84.00, 0.000, 10.000, 924.00, 0.00, 92.40, 1016.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r8r00frre7d88ttedqu', 'cmu2m5r8q00fore7dzs55d1jb', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r9700fwre7dajoox368', 'cmu2m5r9600fvre7dy356jx42', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 10.000, 'unit', 399.00, 5.000, 10.000, 3990.00, 199.50, 379.05, 4169.55, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r9700fxre7ddovbrtxe', 'cmu2m5r9600fvre7dy356jx42', 'cmu2m5qfe005gre7d9may8zcq', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 9.000, 'unit', 119.00, 5.000, 10.000, 1071.00, 53.55, 101.75, 1119.20, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r9700fyre7dpy9h39jn', 'cmu2m5r9600fvre7dy356jx42', 'cmu2m5qf8005ere7dkqaqh8xp', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 11.000, 'unit', 289.00, 0.000, 10.000, 3179.00, 0.00, 317.90, 3496.90, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5r9700fzre7dyh0n1efd', 'cmu2m5r9600fvre7dy356jx42', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 11.000, 'hour', 125.00, 0.000, 10.000, 1375.00, 0.00, 137.50, 1512.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5ra000g8re7difsbrtbw', 'cmu2m5r9z00g7re7dhj28yo6z', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 0.000, 10.000, 1106.00, 0.00, 110.60, 1216.60, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5ra000g9re7dhg831f9h', 'cmu2m5r9z00g7re7dhj28yo6z', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 1);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu2m5rmg00lure7d18j9cehd', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'INVOICE_OVERDUE', 'INV-2026-00028 is past due', 'Owen Pritchard has not settled this invoice. Consider sending a reminder.', '/invoices/cmu2m5r8q00fore7dzs55d1jb', NULL, '2026-09-15 11:53:53.176');
INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu2m5rmg00lvre7d9omz07fq', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'LOW_STOCK', 'Three products are below their reorder point', 'Draughtsman Stool, Corner Workstation 1800 and Acoustic Ceiling Baffle need restocking.', '/inventory', NULL, '2026-09-15 11:53:53.176');
INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu2m5rmg00lwre7dmj0whrvk', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'PAYMENT_RECEIVED', 'Payment received', 'A bank transfer has been matched to an open invoice.', '/payments', '2026-09-14 11:53:50.552', '2026-09-15 11:53:53.176');


--
-- Data for Name: number_sequences; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu2m5qid006bre7d36fzc8tk', 'cmu2m5q7v0037re7dsgqq4eos', 'quotation', 2026, 8, '2026-09-15 11:53:51.816');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu2m5rai00gere7dk5lqga5r', 'cmu2m5q7v0037re7dsgqq4eos', 'expense', 2026, 40, '2026-09-15 11:53:53.037');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu2m5rki00kqre7dcxvcw0d5', 'cmu2m5q7v0037re7dsgqq4eos', 'payroll', 2026, 5, '2026-09-15 11:53:53.126');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu2m5ql3007ore7dy6up5tvo', 'cmu2m5q7v0037re7dsgqq4eos', 'invoice', 2026, 30, '2026-09-15 11:53:52.723');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu2m5qmb007zre7digihbhtk', 'cmu2m5q7v0037re7dsgqq4eos', 'payment', 2026, 25, '2026-09-15 11:53:52.735');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q7v0037re7dsgqq4eos', 'owner', 'Owner', 'Unrestricted access, including billing and organization deletion.', true, '2026-09-15 11:53:51.363', '2026-09-15 11:53:51.363');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q7v0037re7dsgqq4eos', 'admin', 'Administrator', 'Full access to every module and to user management.', true, '2026-09-15 11:53:51.378', '2026-09-15 11:53:51.378');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q7v0037re7dsgqq4eos', 'manager', 'Manager', 'Runs day-to-day operations across sales, purchasing, inventory and projects.', true, '2026-09-15 11:53:51.393', '2026-09-15 11:53:51.393');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q7v0037re7dsgqq4eos', 'accountant', 'Accountant', 'Owns finance: expenses, payments, accounts, payroll and reporting.', true, '2026-09-15 11:53:51.401', '2026-09-15 11:53:51.401');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q7v0037re7dsgqq4eos', 'sales', 'Sales', 'Works the pipeline: customers, quotations, invoices and payments.', true, '2026-09-15 11:53:51.408', '2026-09-15 11:53:51.408');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q7v0037re7dsgqq4eos', 'employee', 'Employee', 'Self-service access to assigned projects, tasks and timesheets.', true, '2026-09-15 11:53:51.415', '2026-09-15 11:53:51.415');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5qaw003xre7dcpy0qz9q', 'owner', 'Owner', 'Unrestricted access, including billing and organization deletion.', true, '2026-09-15 11:53:51.468', '2026-09-15 11:53:51.468');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5qaw003xre7dcpy0qz9q', 'admin', 'Administrator', 'Full access to every module and to user management.', true, '2026-09-15 11:53:51.478', '2026-09-15 11:53:51.478');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5qaw003xre7dcpy0qz9q', 'manager', 'Manager', 'Runs day-to-day operations across sales, purchasing, inventory and projects.', true, '2026-09-15 11:53:51.489', '2026-09-15 11:53:51.489');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5qaw003xre7dcpy0qz9q', 'accountant', 'Accountant', 'Owns finance: expenses, payments, accounts, payroll and reporting.', true, '2026-09-15 11:53:51.501', '2026-09-15 11:53:51.501');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5qaw003xre7dcpy0qz9q', 'sales', 'Sales', 'Works the pipeline: customers, quotations, invoices and payments.', true, '2026-09-15 11:53:51.508', '2026-09-15 11:53:51.508');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5qaw003xre7dcpy0qz9q', 'employee', 'Employee', 'Self-service access to assigned projects, tasks and timesheets.', true, '2026-09-15 11:53:51.512', '2026-09-15 11:53:51.512');


--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5q9r003fre7dlifki48b', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5q5g0000re7ds30hqedv', 'cmu2m5q830039re7d8hbsnysq', NULL, 'ACTIVE', true, NULL, '2026-09-15 11:53:51.422', '2026-09-15 11:53:51.423', '2026-09-15 11:53:51.423', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qai003sre7d4msd7iwg', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5q5o0001re7dxg2h1r3n', 'cmu2m5q8x003bre7db5rrzrd3', NULL, 'ACTIVE', false, NULL, '2025-07-15 11:53:50.552', '2026-09-15 11:53:51.45', '2026-09-15 11:53:51.45', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qai003tre7dqv44bfsr', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5q5o0002re7dmvjckt3y', 'cmu2m5q95003cre7dcqiwkmwd', NULL, 'ACTIVE', false, NULL, '2025-11-15 11:53:50.552', '2026-09-15 11:53:51.45', '2026-09-15 11:53:51.45', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qai003ure7dr3hjvzaq', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5q5o0003re7dlw07mjgu', 'cmu2m5q9c003dre7dvllysp3h', NULL, 'ACTIVE', false, NULL, '2024-06-15 11:53:50.552', '2026-09-15 11:53:51.45', '2026-09-15 11:53:51.45', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qai003vre7d2vyji5f4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5q5o0004re7dol5lwuj8', 'cmu2m5q9i003ere7dhr8zxeb8', NULL, 'ACTIVE', false, NULL, '2026-06-15 11:53:50.552', '2026-09-15 11:53:51.45', '2026-09-15 11:53:51.45', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qcc0045re7duyn04d14', 'cmu2m5qaw003xre7dcpy0qz9q', 'cmu2m5qar003wre7dber919ev', 'cmu2m5qb0003zre7d2tbymzcm', NULL, 'ACTIVE', true, NULL, '2026-09-15 11:53:51.516', '2026-09-15 11:53:51.516', '2026-09-15 11:53:51.516', NULL);


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qmh0080re7ddhoo8es2', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00001', 'INCOMING', 'CHECK', 28032.54, 'GHS', '2026-03-26 00:00:00', 'INV-2026-00001/REM', 'Part payment on account ahead of the second delivery.', 'cmu2m5qgs005wre7d9ri8rsrs', NULL, 'cmu2m5qlb007pre7db09ezknv', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:51.881', '2026-09-15 11:53:51.881', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qnj008are7dpxy8p0qq', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00002', 'INCOMING', 'CHECK', 11964.70, 'GHS', '2026-04-25 00:00:00', 'INV-2026-00002/REM', 'Part payment on account ahead of the second delivery.', 'cmu2m5qgw005xre7dqqd7l1ko', NULL, 'cmu2m5qn10083re7d27fd8jh1', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:51.919', '2026-09-15 11:53:51.919', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qoi008kre7dhtg85o23', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00003', 'INCOMING', 'BANK_TRANSFER', 11829.73, 'GHS', '2026-04-27 00:00:00', 'INV-2026-00003/REM', 'Card payment taken over the phone.', 'cmu2m5qh0005yre7daipt8vxa', NULL, 'cmu2m5qnw008dre7dtiadnwde', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:51.954', '2026-09-15 11:53:51.954', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qpx008yre7d1p5p5o7k', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00004', 'INCOMING', 'BANK_TRANSFER', 25208.81, 'GHS', '2026-06-01 00:00:00', 'INV-2026-00004/REM', 'Cleared after statement chase.', 'cmu2m5qh3005zre7dr7tm42fb', NULL, 'cmu2m5qox008nre7duwayrr4c', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.005', '2026-09-15 11:53:52.005', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qr6009cre7drhk516e4', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00005', 'INCOMING', 'CARD', 24829.78, 'GHS', '2026-05-13 00:00:00', 'INV-2026-00005/REM', 'Card payment taken over the phone.', 'cmu2m5qh90060re7dlc2x2rhs', NULL, 'cmu2m5qqb0091re7ddhbz29px', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.05', '2026-09-15 11:53:52.05', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qs2009mre7d96wnk5ax', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00006', 'INCOMING', 'CHECK', 8505.64, 'GHS', '2026-05-17 00:00:00', 'INV-2026-00006/REM', 'Part payment on account ahead of the second delivery.', 'cmu2m5qhc0061re7dbvxmy9ds', NULL, 'cmu2m5qrn009fre7dj7wo1eap', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.082', '2026-09-15 11:53:52.082', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qt4009wre7dz174mo4y', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00007', 'INCOMING', 'CHECK', 5188.70, 'GHS', '2026-06-15 00:00:00', 'INV-2026-00007/REM', 'Card payment taken over the phone.', 'cmu2m5qhg0062re7dwhqjf5gz', NULL, 'cmu2m5qsh009pre7dh78fzcq2', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.12', '2026-09-15 11:53:52.12', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qu600a8re7datruhkd1', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00008', 'INCOMING', 'BANK_TRANSFER', 3492.94, 'GHS', '2026-06-13 00:00:00', 'INV-2026-00008/REM', 'Card payment taken over the phone.', 'cmu2m5qhi0063re7drcubbbam', NULL, 'cmu2m5qti009zre7d6mj846xr', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.158', '2026-09-15 11:53:52.158', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qv500akre7dvo87maic', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00009', 'INCOMING', 'BANK_TRANSFER', 12499.91, 'GHS', '2026-06-07 00:00:00', 'INV-2026-00009/REM', 'Card payment taken over the phone.', 'cmu2m5qhl0064re7d1vp4egez', NULL, 'cmu2m5qui00abre7de3op5olx', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.193', '2026-09-15 11:53:52.193', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qw200awre7d53pu4qs1', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00010', 'INCOMING', 'CARD', 19218.65, 'GHS', '2026-07-09 00:00:00', 'INV-2026-00010/REM', 'Cleared after statement chase.', 'cmu2m5qho0065re7d4hn7mtvt', NULL, 'cmu2m5qvi00anre7dw0u2uop0', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.227', '2026-09-15 11:53:52.227', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qx200bare7dm4dodpfu', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00011', 'INCOMING', 'BANK_TRANSFER', 4049.21, 'GHS', '2026-07-11 00:00:00', 'INV-2026-00011/REM', 'Card payment taken over the phone.', 'cmu2m5qgs005wre7d9ri8rsrs', NULL, 'cmu2m5qwe00azre7d5d3jtv01', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.262', '2026-09-15 11:53:52.262', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qy200bore7defzwlwxr', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00012', 'INCOMING', 'BANK_TRANSFER', 26660.48, 'GHS', '2026-07-11 00:00:00', 'INV-2026-00012/REM', 'Settled in full within terms.', 'cmu2m5qgw005xre7dqqd7l1ko', NULL, 'cmu2m5qxf00bdre7dnbkh7xqi', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.298', '2026-09-15 11:53:52.298', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qyq00byre7dlejcwbn5', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00013', 'INCOMING', 'BANK_TRANSFER', 11531.07, 'GHS', '2026-07-07 00:00:00', 'INV-2026-00013/REM', 'Card payment taken over the phone.', 'cmu2m5qh0005yre7daipt8vxa', NULL, 'cmu2m5qyd00brre7dfla32z0w', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.322', '2026-09-15 11:53:52.322', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qze00c8re7dexg40ora', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00014', 'INCOMING', 'CHECK', 22359.70, 'GHS', '2026-07-16 00:00:00', 'INV-2026-00014/REM', 'Settled in full within terms.', 'cmu2m5qh3005zre7dr7tm42fb', NULL, 'cmu2m5qz100c1re7dzqe5qp5x', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.346', '2026-09-15 11:53:52.346', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r0900ckre7dmqg1gv7c', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00015', 'INCOMING', 'BANK_TRANSFER', 13525.60, 'GHS', '2026-07-24 00:00:00', 'INV-2026-00015/REM', 'Cleared after statement chase.', 'cmu2m5qh90060re7dlc2x2rhs', NULL, 'cmu2m5qzp00cbre7dis0i45gx', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.377', '2026-09-15 11:53:52.377', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r1300cwre7d2nngmnis', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00016', 'INCOMING', 'CARD', 11889.90, 'GHS', '2026-08-20 00:00:00', 'INV-2026-00016/REM', 'Bank transfer received, reference matched automatically.', 'cmu2m5qhc0061re7dbvxmy9ds', NULL, 'cmu2m5r0l00cnre7dhwwlpurr', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.407', '2026-09-15 11:53:52.407', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r2200d6re7drpwmmzqo', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00017', 'INCOMING', 'CHECK', 11336.93, 'GHS', '2026-08-10 00:00:00', 'INV-2026-00017/REM', 'Cleared after statement chase.', 'cmu2m5qhg0062re7dwhqjf5gz', NULL, 'cmu2m5r1h00czre7dg6eypjys', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.442', '2026-09-15 11:53:52.442', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r3200dire7d7be3si99', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00018', 'INCOMING', 'CHECK', 49250.41, 'GHS', '2026-08-15 00:00:00', 'INV-2026-00018/REM', 'Bank transfer received, reference matched automatically.', 'cmu2m5qhi0063re7drcubbbam', NULL, 'cmu2m5r2i00d9re7dufebeckx', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.478', '2026-09-15 11:53:52.478', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r3p00dqre7dq6odt81b', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00019', 'INCOMING', 'BANK_TRANSFER', 3125.10, 'GHS', '2026-08-30 00:00:00', 'INV-2026-00019/REM', 'Cleared after statement chase.', 'cmu2m5qhl0064re7d1vp4egez', NULL, 'cmu2m5r3f00dlre7db72s1kyj', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.501', '2026-09-15 11:53:52.501', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r5a00edre7doll809bd', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00020', 'INCOMING', 'CARD', 3565.10, 'GHS', '2026-09-18 00:00:00', 'INV-2026-00022/REM', 'Part payment on account ahead of the second delivery.', 'cmu2m5qgw005xre7dqqd7l1ko', NULL, 'cmu2m5r4w00e6re7d17jpkana', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.558', '2026-09-15 11:53:52.558', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r6x00f1re7d6v07s6oc', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00021', 'INCOMING', 'BANK_TRANSFER', 5913.31, 'GHS', '2026-09-20 00:00:00', 'INV-2026-00025/REM', 'Cleared after statement chase.', 'cmu2m5qh90060re7dlc2x2rhs', NULL, 'cmu2m5r6i00eure7d6bq30cog', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.617', '2026-09-15 11:53:52.617', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r7o00fbre7djfxo15ic', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00022', 'INCOMING', 'BANK_TRANSFER', 1370.60, 'GHS', '2026-09-22 00:00:00', 'INV-2026-00026/REM', 'Settled in full within terms.', 'cmu2m5qhc0061re7dbvxmy9ds', NULL, 'cmu2m5r7b00f4re7d6i1qise6', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.644', '2026-09-15 11:53:52.644', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r8f00flre7d6mga16m3', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00023', 'INCOMING', 'BANK_TRANSFER', 10669.40, 'GHS', '2026-09-14 00:00:00', 'INV-2026-00027/REM', 'Cleared after statement chase.', 'cmu2m5qhg0062re7dwhqjf5gz', NULL, 'cmu2m5r7z00fere7dbwvdrted', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.671', '2026-09-15 11:53:52.671', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r9p00g4re7d64fo2bch', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00024', 'INCOMING', 'CARD', 9989.20, 'GHS', '2026-09-21 00:00:00', 'INV-2026-00029/REM', 'Settled in full within terms.', 'cmu2m5qhl0064re7d1vp4egez', NULL, 'cmu2m5r9600fvre7dy356jx42', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.717', '2026-09-15 11:53:52.717', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5raa00gcre7dflrisivz', 'cmu2m5q7v0037re7dsgqq4eos', 'PAY-2026-00025', 'INCOMING', 'CARD', 2668.60, 'GHS', '2026-10-01 00:00:00', 'INV-2026-00030/REM', 'Settled in full within terms.', 'cmu2m5qho0065re7d4hn7mtvt', NULL, 'cmu2m5r9z00g7re7dhj28yo6z', NULL, 'cmu2m5qa3003ire7drzf97vel', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-15 11:53:52.738', '2026-09-15 11:53:52.738', NULL);


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rkn00krre7d74j7yklm', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhr0066re7d223p036b', 'PR-2026-00001', '2026-08-15 00:00:00', '2026-09-14 00:00:00', 7400.00, 592.00, 0.00, 900.00, 1406.00, 296.00, 7190.00, 'GHS', 'PAID', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:53.111', '2026-09-15 11:53:53.111', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rks00ktre7dfvptcd5o', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhv0067re7dyohqyjnb', 'PR-2026-00002', '2026-08-15 00:00:00', '2026-09-14 00:00:00', 6600.00, 528.00, 0.00, 0.00, 1254.00, 264.00, 5610.00, 'GHS', 'PAID', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:53.116', '2026-09-15 11:53:53.116', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rkw00kvre7dt74mynqp', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qhy0068re7dm756psna', 'PR-2026-00003', '2026-08-15 00:00:00', '2026-09-14 00:00:00', 6100.00, 488.00, 0.00, 0.00, 1159.00, 244.00, 5185.00, 'GHS', 'PAID', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:53.12', '2026-09-15 11:53:53.12', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rl100kxre7dj7oacj0r', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi10069re7dos47diqv', 'PR-2026-00004', '2026-08-15 00:00:00', '2026-09-14 00:00:00', 6850.00, 548.00, 0.00, 0.00, 1301.50, 274.00, 5822.50, 'GHS', 'PAID', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:53.125', '2026-09-15 11:53:53.125', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rl500kzre7djxdjh8l6', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qi4006are7dlpp3r968', 'PR-2026-00005', '2026-08-15 00:00:00', '2026-09-14 00:00:00', 5400.00, 432.00, 0.00, 0.00, 1026.00, 216.00, 4590.00, 'GHS', 'PAID', '2026-09-14 00:00:00', NULL, '2026-09-15 11:53:53.129', '2026-09-15 11:53:53.129', NULL);


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770005re7dpholny06', 'dashboard.view', 'dashboard', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770006re7d9ijk0qd7', 'dashboard.create', 'dashboard', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770007re7dx99bk3lf', 'dashboard.edit', 'dashboard', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770008re7dndwrvrl5', 'dashboard.delete', 'dashboard', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770009re7dpa4vpdub', 'dashboard.export', 'dashboard', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000are7dcw9ruec4', 'invoices.view', 'invoices', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000bre7dujitkx4n', 'invoices.create', 'invoices', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000cre7d53yhp2p9', 'invoices.edit', 'invoices', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000dre7dawfqtr5p', 'invoices.delete', 'invoices', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000ere7dd1l79b4e', 'invoices.export', 'invoices', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000fre7dkjn7ea5t', 'quotations.view', 'quotations', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000gre7d7umwknug', 'quotations.create', 'quotations', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000hre7dbye77l94', 'quotations.edit', 'quotations', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000ire7de07ksgdh', 'quotations.delete', 'quotations', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000jre7ds1ptf553', 'quotations.export', 'quotations', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000kre7drzpfyw5u', 'customers.view', 'customers', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000lre7dty9w6lam', 'customers.create', 'customers', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000mre7d72nab444', 'customers.edit', 'customers', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000nre7d9tc7n0ck', 'customers.delete', 'customers', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000ore7dntwpt83w', 'customers.export', 'customers', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000pre7do5wrdxvv', 'payments.view', 'payments', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000qre7dz2z1m3qf', 'payments.create', 'payments', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000rre7drsba0noo', 'payments.edit', 'payments', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000sre7d2k744zdk', 'payments.delete', 'payments', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000tre7dgo8x7kpw', 'payments.export', 'payments', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000ure7dvtlotcye', 'purchases.view', 'purchases', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000vre7d3i5y15kv', 'purchases.create', 'purchases', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000wre7dcl7ardzs', 'purchases.edit', 'purchases', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000xre7d85ixetbf', 'purchases.delete', 'purchases', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000yre7d4il7z6cz', 'purchases.export', 'purchases', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77000zre7d6sc4nc9f', 'suppliers.view', 'suppliers', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770010re7d818q25px', 'suppliers.create', 'suppliers', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770011re7d6nqopnnq', 'suppliers.edit', 'suppliers', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770012re7dfu9is7xx', 'suppliers.delete', 'suppliers', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770013re7dq5l13to0', 'suppliers.export', 'suppliers', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770014re7dthmg40nh', 'bills.view', 'bills', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770015re7dbasbcmj8', 'bills.create', 'bills', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770016re7di8hoal9u', 'bills.edit', 'bills', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770017re7d7lrb42x3', 'bills.delete', 'bills', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770018re7dc4p1y3eu', 'bills.export', 'bills', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770019re7d0psqko3j', 'products.view', 'products', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001are7d5cqbsi8m', 'products.create', 'products', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001bre7ddsxddx3c', 'products.edit', 'products', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001cre7d73i1rlp9', 'products.delete', 'products', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001dre7dqdyhziao', 'products.export', 'products', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001ere7dnlp6e6f7', 'inventory.view', 'inventory', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001fre7dz2r01k9m', 'inventory.create', 'inventory', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001gre7da85jycyl', 'inventory.edit', 'inventory', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001hre7d4f02udox', 'inventory.delete', 'inventory', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001ire7drs8lfytq', 'inventory.export', 'inventory', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001jre7dpwzu2o8c', 'expenses.view', 'expenses', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001kre7dnh4bsifb', 'expenses.create', 'expenses', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001lre7dw5xhjwmn', 'expenses.edit', 'expenses', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001mre7drsxxinuq', 'expenses.delete', 'expenses', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001nre7dul9fugxn', 'expenses.export', 'expenses', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001ore7dfdaxdexh', 'accounts.view', 'accounts', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001pre7dwgyvssjr', 'accounts.create', 'accounts', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001qre7dxu7zwnbk', 'accounts.edit', 'accounts', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001rre7dmrsffsbm', 'accounts.delete', 'accounts', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001sre7ddaj69hdf', 'accounts.export', 'accounts', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001tre7du96w3blr', 'transactions.view', 'transactions', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001ure7di9ww0nk3', 'transactions.create', 'transactions', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001vre7dk0kimwwy', 'transactions.edit', 'transactions', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001wre7d25cm3tf5', 'transactions.delete', 'transactions', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001xre7drgfj9ujk', 'transactions.export', 'transactions', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001yre7d0hpaokb3', 'employees.view', 'employees', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77001zre7d5mhnrx87', 'employees.create', 'employees', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770020re7d0cr65d6h', 'employees.edit', 'employees', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770021re7d5f74vaum', 'employees.delete', 'employees', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770022re7d4qyvu375', 'employees.export', 'employees', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770023re7dxkhc698w', 'payroll.view', 'payroll', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770024re7d9vwasx01', 'payroll.create', 'payroll', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770025re7dizq3qiu2', 'payroll.edit', 'payroll', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770026re7d8q91calu', 'payroll.delete', 'payroll', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770027re7dgav0a26h', 'payroll.export', 'payroll', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770028re7dq3be42v7', 'attendance.view', 'attendance', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q770029re7dvs3blppg', 'attendance.create', 'attendance', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77002are7dtle7e2ey', 'attendance.edit', 'attendance', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77002bre7du1h2scpk', 'attendance.delete', 'attendance', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77002cre7d30qmm1f8', 'attendance.export', 'attendance', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77002dre7d2yfmdye8', 'projects.view', 'projects', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q77002ere7dsizs20d7', 'projects.create', 'projects', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002fre7dnqne06ga', 'projects.edit', 'projects', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002gre7djsn04rgi', 'projects.delete', 'projects', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002hre7d928wu2yg', 'projects.export', 'projects', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002ire7di8xk7tx6', 'tasks.view', 'tasks', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002jre7dk2vnpnew', 'tasks.create', 'tasks', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002kre7dmekprduf', 'tasks.edit', 'tasks', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002lre7dukl4kpqm', 'tasks.delete', 'tasks', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002mre7dtd9q8ikd', 'tasks.export', 'tasks', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002nre7ds704weyn', 'timesheets.view', 'timesheets', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002ore7dwg7dtiex', 'timesheets.create', 'timesheets', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002pre7dxnq5fo3k', 'timesheets.edit', 'timesheets', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002qre7dr9u60y90', 'timesheets.delete', 'timesheets', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002rre7dwghzdbxl', 'timesheets.export', 'timesheets', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002sre7dkhnbgkrm', 'reports.view', 'reports', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002tre7d55wvc2mf', 'reports.create', 'reports', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002ure7dlkwd4ve8', 'reports.edit', 'reports', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002vre7dptssovr6', 'reports.delete', 'reports', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002wre7drff43hwh', 'reports.export', 'reports', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002xre7d5erq85e7', 'settings.view', 'settings', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002yre7dqteazsz6', 'settings.create', 'settings', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q78002zre7d5byo2c8w', 'settings.edit', 'settings', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780030re7dn6xy7286', 'settings.delete', 'settings', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780031re7dulv1z78g', 'settings.export', 'settings', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780032re7dpkg4payp', 'users.view', 'users', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780033re7dnw5rj1o4', 'users.create', 'users', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780034re7drllu9wp7', 'users.edit', 'users', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780035re7dik0kzzys', 'users.delete', 'users', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu2m5q780036re7d1vwq59pr', 'users.export', 'users', 'export', NULL);


--
-- Data for Name: platform_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5riy00jrre7db3gmr2uh', 'cmu2m5rix00jqre7ds8v3fiyp', 'cmu2m5qhr0066re7d223p036b', 'Project lead', 95.00, '2026-09-15 11:53:53.049');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5riy00jsre7d6brg1jh2', 'cmu2m5rix00jqre7ds8v3fiyp', 'cmu2m5qhv0067re7dyohqyjnb', 'Contributor', 72.00, '2026-09-15 11:53:53.049');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5riy00jtre7d8sah6vj3', 'cmu2m5rix00jqre7ds8v3fiyp', 'cmu2m5qhy0068re7dm756psna', 'Contributor', 72.00, '2026-09-15 11:53:53.049');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5rj300jvre7dnw8b7yvd', 'cmu2m5rj300jure7di73dwhsx', 'cmu2m5qhr0066re7d223p036b', 'Project lead', 95.00, '2026-09-15 11:53:53.055');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5rj300jwre7dh30yesw2', 'cmu2m5rj300jure7di73dwhsx', 'cmu2m5qhv0067re7dyohqyjnb', 'Contributor', 72.00, '2026-09-15 11:53:53.055');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5rj300jxre7d9wvuzz8a', 'cmu2m5rj300jure7di73dwhsx', 'cmu2m5qhy0068re7dm756psna', 'Contributor', 72.00, '2026-09-15 11:53:53.055');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5rj800jzre7d5lmu8j49', 'cmu2m5rj700jyre7dn0amq247', 'cmu2m5qhr0066re7d223p036b', 'Project lead', 95.00, '2026-09-15 11:53:53.059');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5rj800k0re7d3ig5imz9', 'cmu2m5rj700jyre7dn0amq247', 'cmu2m5qhv0067re7dyohqyjnb', 'Contributor', 72.00, '2026-09-15 11:53:53.059');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu2m5rj800k1re7d0yww1lum', 'cmu2m5rj700jyre7dn0amq247', 'cmu2m5qhy0068re7dm756psna', 'Contributor', 72.00, '2026-09-15 11:53:53.059');


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qir006dre7dqsf8sq8b', 'cmu2m5qip006cre7dq3v2wla6', 'cmu2m5qfo005kre7dxnn0e9pb', 'Acoustic Ceiling Baffle', 'Suspended vertical baffle, 1200×300mm.', 3.000, 'unit', 108.00, 0.000, 10.000, 324.00, 0.00, 32.40, 356.40, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qir006ere7ds6g3733k', 'cmu2m5qip006cre7dq3v2wla6', 'cmu2m5qet005are7dgov0muq3', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 14.000, 'unit', 165.00, 0.000, 10.000, 2310.00, 0.00, 231.00, 2541.00, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qir006fre7d22xo4khd', 'cmu2m5qip006cre7dq3v2wla6', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 13.000, 'unit', 79.00, 5.000, 10.000, 1027.00, 51.35, 97.57, 1073.22, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qir006gre7dt85q8h0m', 'cmu2m5qip006cre7dq3v2wla6', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qir006hre7dcra4xrzb', 'cmu2m5qip006cre7dq3v2wla6', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qj3006kre7dhlkozt9q', 'cmu2m5qj2006jre7dksewxdz1', 'cmu2m5qet005are7dgov0muq3', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 13.000, 'unit', 165.00, 0.000, 10.000, 2145.00, 0.00, 214.50, 2359.50, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qj3006lre7d8lzk6f48', 'cmu2m5qj2006jre7dksewxdz1', 'cmu2m5qdz0050re7dvznnyfwb', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 6.000, 'unit', 445.00, 5.000, 10.000, 2670.00, 133.50, 253.65, 2790.15, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qj3006mre7d0qlqebvm', 'cmu2m5qj2006jre7dksewxdz1', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 9.000, 'unit', 79.00, 5.000, 10.000, 711.00, 35.55, 67.55, 743.00, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qj3006nre7dqmk1cq9y', 'cmu2m5qj2006jre7dksewxdz1', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 8.000, 'hour', 88.00, 0.000, 10.000, 704.00, 0.00, 70.40, 774.40, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qje006qre7dq41u6x4n', 'cmu2m5qjd006pre7d0brn314d', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 11.000, 'unit', 45.00, 0.000, 10.000, 495.00, 0.00, 49.50, 544.50, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qje006rre7dyxd5jkxa', 'cmu2m5qjd006pre7d0brn314d', 'cmu2m5qfj005ire7d0j1oslen', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 12.000, 'unit', 84.00, 0.000, 10.000, 1008.00, 0.00, 100.80, 1108.80, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qje006sre7duvlri4el', 'cmu2m5qjd006pre7d0brn314d', 'cmu2m5qet005are7dgov0muq3', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 7.000, 'unit', 165.00, 0.000, 10.000, 1155.00, 0.00, 115.50, 1270.50, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qje006tre7dtsart83g', 'cmu2m5qjd006pre7d0brn314d', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 14.000, 'hour', 88.00, 0.000, 10.000, 1232.00, 0.00, 123.20, 1355.20, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjp006wre7dj6592xtw', 'cmu2m5qjo006vre7d3uo9dj45', 'cmu2m5qdt004yre7dimm5gfej', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 8.000, 'unit', 1685.00, 0.000, 10.000, 13480.00, 0.00, 1348.00, 14828.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjp006xre7dtimtbuk1', 'cmu2m5qjo006vre7d3uo9dj45', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 5.000, 'unit', 399.00, 5.000, 10.000, 1995.00, 99.75, 189.53, 2084.78, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjp006yre7d6qnnr1b0', 'cmu2m5qjo006vre7d3uo9dj45', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 14.000, 'hour', 125.00, 0.000, 10.000, 1750.00, 0.00, 175.00, 1925.00, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjz0071re7dl6ufx3yn', 'cmu2m5qjy0070re7d3rg2yqio', 'cmu2m5qgf005sre7dktoo4yni', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 9.000, 'unit', 34.00, 0.000, 10.000, 306.00, 0.00, 30.60, 336.60, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjz0072re7ds1yk3ss9', 'cmu2m5qjy0070re7d3rg2yqio', 'cmu2m5qdo004wre7dbdx2m7tp', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 12.000, 'unit', 689.00, 0.000, 10.000, 8268.00, 0.00, 826.80, 9094.80, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjz0073re7dpec7efnr', 'cmu2m5qjy0070re7d3rg2yqio', 'cmu2m5qe50052re7dc6c2dp86', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 4.000, 'unit', 399.00, 5.000, 10.000, 1596.00, 79.80, 151.62, 1667.82, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjz0074re7db8h4nbi4', 'cmu2m5qjy0070re7d3rg2yqio', 'cmu2m5qeb0054re7df88mzqk6', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 14.000, 'unit', 459.00, 5.000, 10.000, 6426.00, 321.30, 610.47, 6715.17, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qjz0075re7dyukt7vti', 'cmu2m5qjy0070re7d3rg2yqio', 'cmu2m5qgl005ure7d3lputw46', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qka0078re7do88bzhae', 'cmu2m5qk90077re7d4vff9uqs', 'cmu2m5qeo0058re7d1shc6du1', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 8.000, 'unit', 1150.00, 0.000, 10.000, 9200.00, 0.00, 920.00, 10120.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qka0079re7d6mtn0hrv', 'cmu2m5qk90077re7d4vff9uqs', 'cmu2m5qdt004yre7dimm5gfej', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 10.000, 'unit', 1685.00, 0.000, 10.000, 16850.00, 0.00, 1685.00, 18535.00, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qka007are7d9vi8flrd', 'cmu2m5qk90077re7d4vff9uqs', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 9.000, 'hour', 88.00, 0.000, 10.000, 792.00, 0.00, 79.20, 871.20, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qkl007dre7dshznsni3', 'cmu2m5qkj007cre7d7a468wkb', 'cmu2m5qfu005mre7dku4pb497', 'Phone Booth Single', 'Single-occupancy acoustic pod with ventilation and lighting.', 5.000, 'unit', 5290.00, 0.000, 10.000, 26450.00, 0.00, 2645.00, 29095.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qkl007ere7d5do43wbb', 'cmu2m5qkj007cre7d7a468wkb', 'cmu2m5qfz005ore7dkinlmvna', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 4.000, 'unit', 79.00, 0.000, 10.000, 316.00, 0.00, 31.60, 347.60, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qkl007fre7dr9p1nrry', 'cmu2m5qkj007cre7d7a468wkb', 'cmu2m5qg8005qre7dbxebklod', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 5.000, 10.000, 540.00, 27.00, 51.30, 564.30, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qkl007gre7dp0zbgdwd', 'cmu2m5qkj007cre7d7a468wkb', 'cmu2m5qeo0058re7d1shc6du1', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 7.000, 'unit', 1150.00, 0.000, 10.000, 8050.00, 0.00, 805.00, 8855.00, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qkl007hre7dc868qrd1', 'cmu2m5qkj007cre7d7a468wkb', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 6.000, 'hour', 88.00, 0.000, 10.000, 528.00, 0.00, 52.80, 580.80, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qky007kre7dfr8za7s4', 'cmu2m5qku007jre7dg4g02dgb', 'cmu2m5qdh004ure7dm4fh6v7v', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 13.000, 'unit', 749.00, 0.000, 10.000, 9737.00, 0.00, 973.70, 10710.70, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qky007lre7defdalkmf', 'cmu2m5qku007jre7dg4g02dgb', 'cmu2m5qfe005gre7d9may8zcq', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 5.000, 'unit', 119.00, 0.000, 10.000, 595.00, 0.00, 59.50, 654.50, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qky007mre7df40de3tk', 'cmu2m5qku007jre7dg4g02dgb', 'cmu2m5qdt004yre7dimm5gfej', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 9.000, 'unit', 1685.00, 0.000, 10.000, 15165.00, 0.00, 1516.50, 16681.50, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu2m5qky007nre7d10xxjyhy', 'cmu2m5qku007jre7dg4g02dgb', 'cmu2m5qgp005vre7dew97hs2b', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 11.000, 'hour', 88.00, 0.000, 10.000, 968.00, 0.00, 96.80, 1064.80, 3);


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770006re7d9ijk0qd7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770007re7dx99bk3lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770008re7dndwrvrl5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000vre7d3i5y15kv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000wre7dcl7ardzs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000xre7d85ixetbf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000yre7d4il7z6cz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770010re7d818q25px');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770011re7d6nqopnnq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770012re7dfu9is7xx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001are7d5cqbsi8m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001bre7ddsxddx3c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001cre7d73i1rlp9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001dre7dqdyhziao');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001fre7dz2r01k9m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001gre7da85jycyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001hre7d4f02udox');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001ire7drs8lfytq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001kre7dnh4bsifb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001lre7dw5xhjwmn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001mre7drsxxinuq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001pre7dwgyvssjr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001qre7dxu7zwnbk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001rre7dmrsffsbm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001ure7di9ww0nk3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001vre7dk0kimwwy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001wre7d25cm3tf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001xre7drgfj9ujk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77001zre7d5mhnrx87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770020re7d0cr65d6h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770021re7d5f74vaum');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770023re7dxkhc698w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770024re7d9vwasx01');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770025re7dizq3qiu2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770026re7d8q91calu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770027re7dgav0a26h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q770029re7dvs3blppg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77002are7dtle7e2ey');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77002bre7du1h2scpk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77002cre7d30qmm1f8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q77002ere7dsizs20d7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002fre7dnqne06ga');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002gre7djsn04rgi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002hre7d928wu2yg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002tre7d55wvc2mf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002ure7dlkwd4ve8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002vre7dptssovr6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002xre7d5erq85e7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002yre7dqteazsz6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q78002zre7d5byo2c8w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780030re7dn6xy7286');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780031re7dulv1z78g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780032re7dpkg4payp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780033re7dnw5rj1o4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780034re7drllu9wp7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780035re7dik0kzzys');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q830039re7d8hbsnysq', 'cmu2m5q780036re7d1vwq59pr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770006re7d9ijk0qd7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770007re7dx99bk3lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770008re7dndwrvrl5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000vre7d3i5y15kv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000wre7dcl7ardzs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000xre7d85ixetbf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000yre7d4il7z6cz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770010re7d818q25px');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770011re7d6nqopnnq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770012re7dfu9is7xx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001are7d5cqbsi8m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001bre7ddsxddx3c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001cre7d73i1rlp9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001dre7dqdyhziao');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001fre7dz2r01k9m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001gre7da85jycyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001hre7d4f02udox');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001ire7drs8lfytq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001kre7dnh4bsifb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001lre7dw5xhjwmn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001mre7drsxxinuq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001pre7dwgyvssjr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001qre7dxu7zwnbk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001rre7dmrsffsbm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001ure7di9ww0nk3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001vre7dk0kimwwy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001wre7d25cm3tf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001xre7drgfj9ujk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77001zre7d5mhnrx87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770020re7d0cr65d6h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770021re7d5f74vaum');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770023re7dxkhc698w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770024re7d9vwasx01');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770025re7dizq3qiu2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770026re7d8q91calu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770027re7dgav0a26h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q770029re7dvs3blppg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77002are7dtle7e2ey');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77002bre7du1h2scpk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77002cre7d30qmm1f8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q77002ere7dsizs20d7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002fre7dnqne06ga');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002gre7djsn04rgi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002hre7d928wu2yg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002tre7d55wvc2mf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002ure7dlkwd4ve8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002vre7dptssovr6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002xre7d5erq85e7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002yre7dqteazsz6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q78002zre7d5byo2c8w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780030re7dn6xy7286');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780031re7dulv1z78g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780032re7dpkg4payp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780033re7dnw5rj1o4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780034re7drllu9wp7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780035re7dik0kzzys');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8i003are7d0bui86bo', 'cmu2m5q780036re7d1vwq59pr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000vre7d3i5y15kv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000wre7dcl7ardzs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000xre7d85ixetbf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000yre7d4il7z6cz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770010re7d818q25px');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770011re7d6nqopnnq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770012re7dfu9is7xx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001are7d5cqbsi8m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001bre7ddsxddx3c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001cre7d73i1rlp9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001dre7dqdyhziao');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001fre7dz2r01k9m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001gre7da85jycyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001hre7d4f02udox');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001ire7drs8lfytq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77002ere7dsizs20d7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002fre7dnqne06ga');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002gre7djsn04rgi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002hre7d928wu2yg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q8x003bre7db5rrzrd3', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001kre7dnh4bsifb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001lre7dw5xhjwmn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001mre7drsxxinuq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001pre7dwgyvssjr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001qre7dxu7zwnbk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001rre7dmrsffsbm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001ure7di9ww0nk3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001vre7dk0kimwwy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001wre7d25cm3tf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001xre7drgfj9ujk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770023re7dxkhc698w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770024re7d9vwasx01');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770025re7dizq3qiu2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770026re7d8q91calu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770027re7dgav0a26h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q95003cre7dcqiwkmwd', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9c003dre7dvllysp3h', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5q9i003ere7dhr8zxeb8', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770006re7d9ijk0qd7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770007re7dx99bk3lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770008re7dndwrvrl5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000vre7d3i5y15kv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000wre7dcl7ardzs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000xre7d85ixetbf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000yre7d4il7z6cz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770010re7d818q25px');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770011re7d6nqopnnq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770012re7dfu9is7xx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001are7d5cqbsi8m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001bre7ddsxddx3c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001cre7d73i1rlp9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001dre7dqdyhziao');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001fre7dz2r01k9m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001gre7da85jycyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001hre7d4f02udox');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001ire7drs8lfytq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001kre7dnh4bsifb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001lre7dw5xhjwmn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001mre7drsxxinuq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001pre7dwgyvssjr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001qre7dxu7zwnbk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001rre7dmrsffsbm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001ure7di9ww0nk3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001vre7dk0kimwwy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001wre7d25cm3tf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001xre7drgfj9ujk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77001zre7d5mhnrx87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770020re7d0cr65d6h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770021re7d5f74vaum');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770023re7dxkhc698w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770024re7d9vwasx01');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770025re7dizq3qiu2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770026re7d8q91calu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770027re7dgav0a26h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q770029re7dvs3blppg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77002are7dtle7e2ey');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77002bre7du1h2scpk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77002cre7d30qmm1f8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q77002ere7dsizs20d7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002fre7dnqne06ga');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002gre7djsn04rgi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002hre7d928wu2yg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002tre7d55wvc2mf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002ure7dlkwd4ve8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002vre7dptssovr6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002xre7d5erq85e7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002yre7dqteazsz6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q78002zre7d5byo2c8w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780030re7dn6xy7286');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780031re7dulv1z78g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780032re7dpkg4payp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780033re7dnw5rj1o4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780034re7drllu9wp7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780035re7dik0kzzys');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qb0003zre7d2tbymzcm', 'cmu2m5q780036re7d1vwq59pr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770006re7d9ijk0qd7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770007re7dx99bk3lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770008re7dndwrvrl5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000vre7d3i5y15kv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000wre7dcl7ardzs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000xre7d85ixetbf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000yre7d4il7z6cz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770010re7d818q25px');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770011re7d6nqopnnq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770012re7dfu9is7xx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001are7d5cqbsi8m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001bre7ddsxddx3c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001cre7d73i1rlp9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001dre7dqdyhziao');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001fre7dz2r01k9m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001gre7da85jycyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001hre7d4f02udox');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001ire7drs8lfytq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001kre7dnh4bsifb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001lre7dw5xhjwmn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001mre7drsxxinuq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001pre7dwgyvssjr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001qre7dxu7zwnbk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001rre7dmrsffsbm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001ure7di9ww0nk3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001vre7dk0kimwwy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001wre7d25cm3tf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001xre7drgfj9ujk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77001zre7d5mhnrx87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770020re7d0cr65d6h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770021re7d5f74vaum');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770023re7dxkhc698w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770024re7d9vwasx01');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770025re7dizq3qiu2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770026re7d8q91calu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770027re7dgav0a26h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q770029re7dvs3blppg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77002are7dtle7e2ey');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77002bre7du1h2scpk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77002cre7d30qmm1f8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q77002ere7dsizs20d7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002fre7dnqne06ga');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002gre7djsn04rgi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002hre7d928wu2yg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002tre7d55wvc2mf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002ure7dlkwd4ve8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002vre7dptssovr6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002xre7d5erq85e7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002yre7dqteazsz6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q78002zre7d5byo2c8w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780030re7dn6xy7286');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780031re7dulv1z78g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780032re7dpkg4payp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780033re7dnw5rj1o4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780034re7drllu9wp7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780035re7dik0kzzys');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qba0040re7dtnrz29bz', 'cmu2m5q780036re7d1vwq59pr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000vre7d3i5y15kv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000wre7dcl7ardzs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000xre7d85ixetbf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000yre7d4il7z6cz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770010re7d818q25px');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770011re7d6nqopnnq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770012re7dfu9is7xx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001are7d5cqbsi8m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001bre7ddsxddx3c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001cre7d73i1rlp9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001dre7dqdyhziao');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001fre7dz2r01k9m');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001gre7da85jycyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001hre7d4f02udox');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001ire7drs8lfytq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77002ere7dsizs20d7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002fre7dnqne06ga');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002gre7djsn04rgi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002hre7d928wu2yg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbl0041re7d6goanqdh', 'cmu2m5q770028re7dq3be42v7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001jre7dpwzu2o8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001kre7dnh4bsifb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001lre7dw5xhjwmn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001mre7drsxxinuq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001nre7dul9fugxn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000rre7drsba0noo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000sre7d2k744zdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000tre7dgo8x7kpw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001ore7dfdaxdexh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001pre7dwgyvssjr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001qre7dxu7zwnbk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001rre7dmrsffsbm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001sre7ddaj69hdf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001tre7du96w3blr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001ure7di9ww0nk3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001vre7dk0kimwwy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001wre7d25cm3tf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001xre7drgfj9ujk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770014re7dthmg40nh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770015re7dbasbcmj8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770016re7di8hoal9u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770017re7d7lrb42x3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770018re7dc4p1y3eu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770023re7dxkhc698w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770024re7d9vwasx01');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770025re7dizq3qiu2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770026re7d8q91calu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770027re7dgav0a26h');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000zre7d6sc4nc9f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770013re7dq5l13to0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001yre7d0hpaokb3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770022re7d4qyvu375');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77000ure7dvtlotcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qbx0042re7d1rmj82ea', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000lre7dty9w6lam');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000mre7d72nab444');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000nre7d9tc7n0ck');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000ore7dntwpt83w');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000fre7dkjn7ea5t');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000gre7d7umwknug');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000hre7dbye77l94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000ire7de07ksgdh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000jre7ds1ptf553');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000are7dcw9ruec4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000bre7dujitkx4n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000cre7d53yhp2p9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000dre7dawfqtr5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000ere7dd1l79b4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000pre7do5wrdxvv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77000qre7dz2z1m3qf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q770009re7dpa4vpdub');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q78002sre7dkhnbgkrm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q78002wre7drff43hwh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77001ere7dnlp6e6f7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc40043re7ddxzd5grd', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q770005re7dpholny06');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q77002dre7d2yfmdye8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q77000kre7drzpfyw5u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q770019re7d0psqko3j');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002ire7di8xk7tx6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002jre7dk2vnpnew');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002kre7dmekprduf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002lre7dukl4kpqm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002mre7dtd9q8ikd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002nre7ds704weyn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002ore7dwg7dtiex');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002pre7dxnq5fo3k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002qre7dr9u60y90');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q78002rre7dwghzdbxl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu2m5qc80044re7d370imbpq', 'cmu2m5q770028re7dq3be42v7');


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjb00k2re7d4qt8mjyo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', 'Confirm final desk layout with facilities team', NULL, 'DONE', 'HIGH', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-06 11:53:50.552', '2026-09-06 11:53:50.552', 3.00, 0, '2026-09-15 11:53:53.063', '2026-09-15 11:53:53.063', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rje00k3re7dm5lgao4s', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', 'Place order for 42 sit-stand frames', NULL, 'DONE', 'URGENT', 'cmu2m5q5o0001re7dxg2h1r3n', '2026-09-11 11:53:50.552', '2026-09-11 11:53:50.552', 2.00, 1, '2026-09-15 11:53:53.066', '2026-09-15 11:53:53.066', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjg00k4re7dmdqslbtu', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', 'Schedule phase two install weekend', NULL, 'IN_PROGRESS', 'HIGH', 'cmu2m5q5o0002re7dmvjckt3y', '2026-09-21 11:53:50.552', NULL, 4.00, 2, '2026-09-15 11:53:53.068', '2026-09-15 11:53:53.068', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rji00k5re7dydghkxfs', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', 'Snag list walkthrough with client', NULL, 'TODO', 'MEDIUM', 'cmu2m5q5o0003re7dlw07mjgu', '2026-10-03 11:53:50.552', NULL, 5.00, 3, '2026-09-15 11:53:53.07', '2026-09-15 11:53:53.07', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjj00k6re7dc4nfgocu', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', 'Acoustic survey of the open-plan bay', NULL, 'DONE', 'MEDIUM', 'cmu2m5q5o0004re7dol5lwuj8', '2026-09-03 11:53:50.552', '2026-09-03 11:53:50.552', 6.00, 4, '2026-09-15 11:53:53.071', '2026-09-15 11:53:53.071', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjm00k7re7dlu0ksyiw', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', 'Present two-option furniture scheme', NULL, 'IN_REVIEW', 'HIGH', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-18 11:53:50.552', NULL, 9.00, 5, '2026-09-15 11:53:53.074', '2026-09-15 11:53:53.074', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjn00k8re7d99d86axv', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', 'Confirm lead time on phone booths', NULL, 'BLOCKED', 'URGENT', 'cmu2m5q5o0001re7dxg2h1r3n', '2026-09-16 11:53:50.552', NULL, 1.50, 6, '2026-09-15 11:53:53.075', '2026-09-15 11:53:53.075', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjp00k9re7dr7qdenwc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', 'Issue revised quotation after value engineering', NULL, 'TODO', 'MEDIUM', 'cmu2m5q5o0002re7dmvjckt3y', '2026-09-26 11:53:50.552', NULL, 3.00, 7, '2026-09-15 11:53:53.077', '2026-09-15 11:53:53.077', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjr00kare7dt1ri7ybz', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj700jyre7dn0amq247', 'Final handover pack and warranties', NULL, 'DONE', 'LOW', 'cmu2m5q5o0003re7dlw07mjgu', '2026-07-31 11:53:50.552', '2026-07-31 11:53:50.552', 2.00, 8, '2026-09-15 11:53:53.079', '2026-09-15 11:53:53.079', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjt00kbre7d64dwelux', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'Refresh the 2026 price list', NULL, 'IN_PROGRESS', 'MEDIUM', 'cmu2m5q5o0004re7dol5lwuj8', '2026-09-29 11:53:50.552', NULL, 8.00, 9, '2026-09-15 11:53:53.081', '2026-09-15 11:53:53.081', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjv00kcre7dybm14nwf', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'Chase overdue balances above 30 days', NULL, 'TODO', 'HIGH', 'cmu2m5q5g0000re7ds30hqedv', '2026-09-17 11:53:50.552', NULL, 2.00, 10, '2026-09-15 11:53:53.083', '2026-09-15 11:53:53.083', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rjx00kdre7dqj3jeoq1', 'cmu2m5q7v0037re7dsgqq4eos', NULL, 'Stock count in the acoustics aisle', NULL, 'TODO', 'LOW', 'cmu2m5q5o0001re7dxg2h1r3n', '2026-10-06 11:53:50.552', NULL, 4.00, 11, '2026-09-15 11:53:53.085', '2026-09-15 11:53:53.085', NULL);


--
-- Data for Name: tax_rates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tax_rates (id, "organizationId", name, rate, "isDefault", "isCompound", "isActive", "createdAt", "updatedAt") VALUES ('cmu2m5q9z003hre7dzcvclhql', 'cmu2m5q7v0037re7dsgqq4eos', 'VAT', 10.000, true, false, true, '2026-09-15 11:53:51.431', '2026-09-15 11:53:51.431');
INSERT INTO public.tax_rates (id, "organizationId", name, rate, "isDefault", "isCompound", "isActive", "createdAt", "updatedAt") VALUES ('cmu2m5qcf0047re7d0p657opc', 'cmu2m5qaw003xre7dcpy0qz9q', 'VAT', 10.000, true, false, true, '2026-09-15 11:53:51.519', '2026-09-15 11:53:51.519');


--
-- Data for Name: timesheets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rjz00kere7d71ru9nwx', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', NULL, 'cmu2m5qhv0067re7dyohqyjnb', NULL, '2026-09-08', 7.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-15 11:53:53.087', '2026-09-15 11:53:53.087');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rk200kfre7d5dmvx86w', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', NULL, 'cmu2m5qhy0068re7dm756psna', NULL, '2026-09-01', 9.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-15 11:53:53.09', '2026-09-15 11:53:53.09');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rk400kgre7d0vb57jzc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', NULL, 'cmu2m5qi10069re7dos47diqv', NULL, '2026-08-25', 5.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-15 11:53:53.092', '2026-09-15 11:53:53.092');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rk600khre7dz8g8bdjg', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rix00jqre7ds8v3fiyp', NULL, 'cmu2m5qi4006are7dlpp3r968', NULL, '2026-08-18', 7.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-15 11:53:53.094', '2026-09-15 11:53:53.094');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rk700kire7d69glp88l', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', NULL, 'cmu2m5qhv0067re7dyohqyjnb', NULL, '2026-09-08', 4.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-15 11:53:53.095', '2026-09-15 11:53:53.095');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rk900kjre7de88cpgk2', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', NULL, 'cmu2m5qhy0068re7dm756psna', NULL, '2026-09-01', 9.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-15 11:53:53.097', '2026-09-15 11:53:53.097');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rkb00kkre7ddy01oxpc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', NULL, 'cmu2m5qi10069re7dos47diqv', NULL, '2026-08-25', 8.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-15 11:53:53.099', '2026-09-15 11:53:53.099');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rkc00klre7daiv29sca', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj300jure7di73dwhsx', NULL, 'cmu2m5qi4006are7dlpp3r968', NULL, '2026-08-18', 9.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-15 11:53:53.1', '2026-09-15 11:53:53.1');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rkd00kmre7dmb0g5plc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj700jyre7dn0amq247', NULL, 'cmu2m5qhv0067re7dyohqyjnb', NULL, '2026-09-08', 8.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-15 11:53:53.101', '2026-09-15 11:53:53.101');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rke00knre7dkne17vre', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj700jyre7dn0amq247', NULL, 'cmu2m5qhy0068re7dm756psna', NULL, '2026-09-01', 7.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-15 11:53:53.102', '2026-09-15 11:53:53.102');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rkg00kore7d2q39ort6', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj700jyre7dn0amq247', NULL, 'cmu2m5qi10069re7dos47diqv', NULL, '2026-08-25', 4.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-15 11:53:53.104', '2026-09-15 11:53:53.104');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu2m5rkh00kpre7dpmsv4i1g', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5rj700jyre7dn0amq247', NULL, 'cmu2m5qi4006are7dlpp3r968', NULL, '2026-08-18', 8.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-15 11:53:53.105', '2026-09-15 11:53:53.105');


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qmm0081re7dvz5ok3tc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 28032.54, 'GHS', 'Payment received for INV-2026-00001', 'Sales', '2026-03-26 00:00:00', 'PAY-2026-00001', NULL, 'cmu2m5qlb007pre7db09ezknv', NULL, 'cmu2m5qmh0080re7ddhoo8es2', NULL, 'cmu2m5qgs005wre7d9ri8rsrs', NULL, NULL, '2026-09-15 11:53:51.886', '2026-09-15 11:53:51.886', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qnm008bre7d7ov3dkdl', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 11964.70, 'GHS', 'Payment received for INV-2026-00002', 'Sales', '2026-04-25 00:00:00', 'PAY-2026-00002', NULL, 'cmu2m5qn10083re7d27fd8jh1', NULL, 'cmu2m5qnj008are7dpxy8p0qq', NULL, 'cmu2m5qgw005xre7dqqd7l1ko', NULL, NULL, '2026-09-15 11:53:51.922', '2026-09-15 11:53:51.922', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qom008lre7dm94bhbw9', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 11829.73, 'GHS', 'Payment received for INV-2026-00003', 'Sales', '2026-04-27 00:00:00', 'PAY-2026-00003', NULL, 'cmu2m5qnw008dre7dtiadnwde', NULL, 'cmu2m5qoi008kre7dhtg85o23', NULL, 'cmu2m5qh0005yre7daipt8vxa', NULL, NULL, '2026-09-15 11:53:51.958', '2026-09-15 11:53:51.958', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qpz008zre7dtdsnnn0v', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 25208.81, 'GHS', 'Payment received for INV-2026-00004', 'Sales', '2026-06-01 00:00:00', 'PAY-2026-00004', NULL, 'cmu2m5qox008nre7duwayrr4c', NULL, 'cmu2m5qpx008yre7d1p5p5o7k', NULL, 'cmu2m5qh3005zre7dr7tm42fb', NULL, NULL, '2026-09-15 11:53:52.007', '2026-09-15 11:53:52.007', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qrd009dre7d5gbscw8l', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 24829.78, 'GHS', 'Payment received for INV-2026-00005', 'Sales', '2026-05-13 00:00:00', 'PAY-2026-00005', NULL, 'cmu2m5qqb0091re7ddhbz29px', NULL, 'cmu2m5qr6009cre7drhk516e4', NULL, 'cmu2m5qh90060re7dlc2x2rhs', NULL, NULL, '2026-09-15 11:53:52.057', '2026-09-15 11:53:52.057', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qs5009nre7d2qsjy3zf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 8505.64, 'GHS', 'Payment received for INV-2026-00006', 'Sales', '2026-05-17 00:00:00', 'PAY-2026-00006', NULL, 'cmu2m5qrn009fre7dj7wo1eap', NULL, 'cmu2m5qs2009mre7d96wnk5ax', NULL, 'cmu2m5qhc0061re7dbvxmy9ds', NULL, NULL, '2026-09-15 11:53:52.085', '2026-09-15 11:53:52.085', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qt6009xre7dyf8vpeja', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 5188.70, 'GHS', 'Payment received for INV-2026-00007', 'Sales', '2026-06-15 00:00:00', 'PAY-2026-00007', NULL, 'cmu2m5qsh009pre7dh78fzcq2', NULL, 'cmu2m5qt4009wre7dz174mo4y', NULL, 'cmu2m5qhg0062re7dwhqjf5gz', NULL, NULL, '2026-09-15 11:53:52.122', '2026-09-15 11:53:52.122', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qu900a9re7dr7055whb', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 3492.94, 'GHS', 'Payment received for INV-2026-00008', 'Sales', '2026-06-13 00:00:00', 'PAY-2026-00008', NULL, 'cmu2m5qti009zre7d6mj846xr', NULL, 'cmu2m5qu600a8re7datruhkd1', NULL, 'cmu2m5qhi0063re7drcubbbam', NULL, NULL, '2026-09-15 11:53:52.161', '2026-09-15 11:53:52.161', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qv800alre7d7xfcwus0', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 12499.91, 'GHS', 'Payment received for INV-2026-00009', 'Sales', '2026-06-07 00:00:00', 'PAY-2026-00009', NULL, 'cmu2m5qui00abre7de3op5olx', NULL, 'cmu2m5qv500akre7dvo87maic', NULL, 'cmu2m5qhl0064re7d1vp4egez', NULL, NULL, '2026-09-15 11:53:52.196', '2026-09-15 11:53:52.196', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qw500axre7dcttotbbo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 19218.65, 'GHS', 'Payment received for INV-2026-00010', 'Sales', '2026-07-09 00:00:00', 'PAY-2026-00010', NULL, 'cmu2m5qvi00anre7dw0u2uop0', NULL, 'cmu2m5qw200awre7d53pu4qs1', NULL, 'cmu2m5qho0065re7d4hn7mtvt', NULL, NULL, '2026-09-15 11:53:52.229', '2026-09-15 11:53:52.229', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qx500bbre7dkyufhs7z', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 4049.21, 'GHS', 'Payment received for INV-2026-00011', 'Sales', '2026-07-11 00:00:00', 'PAY-2026-00011', NULL, 'cmu2m5qwe00azre7d5d3jtv01', NULL, 'cmu2m5qx200bare7dm4dodpfu', NULL, 'cmu2m5qgs005wre7d9ri8rsrs', NULL, NULL, '2026-09-15 11:53:52.265', '2026-09-15 11:53:52.265', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qy400bpre7d89r9yw26', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 26660.48, 'GHS', 'Payment received for INV-2026-00012', 'Sales', '2026-07-11 00:00:00', 'PAY-2026-00012', NULL, 'cmu2m5qxf00bdre7dnbkh7xqi', NULL, 'cmu2m5qy200bore7defzwlwxr', NULL, 'cmu2m5qgw005xre7dqqd7l1ko', NULL, NULL, '2026-09-15 11:53:52.3', '2026-09-15 11:53:52.3', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qys00bzre7dokkf0p8k', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 11531.07, 'GHS', 'Payment received for INV-2026-00013', 'Sales', '2026-07-07 00:00:00', 'PAY-2026-00013', NULL, 'cmu2m5qyd00brre7dfla32z0w', NULL, 'cmu2m5qyq00byre7dlejcwbn5', NULL, 'cmu2m5qh0005yre7daipt8vxa', NULL, NULL, '2026-09-15 11:53:52.324', '2026-09-15 11:53:52.324', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5qzg00c9re7dkptb2lt9', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 22359.70, 'GHS', 'Payment received for INV-2026-00014', 'Sales', '2026-07-16 00:00:00', 'PAY-2026-00014', NULL, 'cmu2m5qz100c1re7dzqe5qp5x', NULL, 'cmu2m5qze00c8re7dexg40ora', NULL, 'cmu2m5qh3005zre7dr7tm42fb', NULL, NULL, '2026-09-15 11:53:52.348', '2026-09-15 11:53:52.348', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r0b00clre7dsbsscwkp', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 13525.60, 'GHS', 'Payment received for INV-2026-00015', 'Sales', '2026-07-24 00:00:00', 'PAY-2026-00015', NULL, 'cmu2m5qzp00cbre7dis0i45gx', NULL, 'cmu2m5r0900ckre7dmqg1gv7c', NULL, 'cmu2m5qh90060re7dlc2x2rhs', NULL, NULL, '2026-09-15 11:53:52.379', '2026-09-15 11:53:52.379', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r1500cxre7dcg7ifej3', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 11889.90, 'GHS', 'Payment received for INV-2026-00016', 'Sales', '2026-08-20 00:00:00', 'PAY-2026-00016', NULL, 'cmu2m5r0l00cnre7dhwwlpurr', NULL, 'cmu2m5r1300cwre7d2nngmnis', NULL, 'cmu2m5qhc0061re7dbvxmy9ds', NULL, NULL, '2026-09-15 11:53:52.409', '2026-09-15 11:53:52.409', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r2500d7re7dqqmma6dm', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 11336.93, 'GHS', 'Payment received for INV-2026-00017', 'Sales', '2026-08-10 00:00:00', 'PAY-2026-00017', NULL, 'cmu2m5r1h00czre7dg6eypjys', NULL, 'cmu2m5r2200d6re7drpwmmzqo', NULL, 'cmu2m5qhg0062re7dwhqjf5gz', NULL, NULL, '2026-09-15 11:53:52.445', '2026-09-15 11:53:52.445', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r3500djre7d4ju0a1jt', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 49250.41, 'GHS', 'Payment received for INV-2026-00018', 'Sales', '2026-08-15 00:00:00', 'PAY-2026-00018', NULL, 'cmu2m5r2i00d9re7dufebeckx', NULL, 'cmu2m5r3200dire7d7be3si99', NULL, 'cmu2m5qhi0063re7drcubbbam', NULL, NULL, '2026-09-15 11:53:52.481', '2026-09-15 11:53:52.481', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r3s00drre7d4mt0b5pl', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 3125.10, 'GHS', 'Payment received for INV-2026-00019', 'Sales', '2026-08-30 00:00:00', 'PAY-2026-00019', NULL, 'cmu2m5r3f00dlre7db72s1kyj', NULL, 'cmu2m5r3p00dqre7dq6odt81b', NULL, 'cmu2m5qhl0064re7d1vp4egez', NULL, NULL, '2026-09-15 11:53:52.504', '2026-09-15 11:53:52.504', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r5c00eere7dwne26fj0', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 3565.10, 'GHS', 'Payment received for INV-2026-00022', 'Sales', '2026-09-18 00:00:00', 'PAY-2026-00020', NULL, 'cmu2m5r4w00e6re7d17jpkana', NULL, 'cmu2m5r5a00edre7doll809bd', NULL, 'cmu2m5qgw005xre7dqqd7l1ko', NULL, NULL, '2026-09-15 11:53:52.56', '2026-09-15 11:53:52.56', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r7100f2re7d8yv7fm3c', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 5913.31, 'GHS', 'Payment received for INV-2026-00025', 'Sales', '2026-09-20 00:00:00', 'PAY-2026-00021', NULL, 'cmu2m5r6i00eure7d6bq30cog', NULL, 'cmu2m5r6x00f1re7d6v07s6oc', NULL, 'cmu2m5qh90060re7dlc2x2rhs', NULL, NULL, '2026-09-15 11:53:52.621', '2026-09-15 11:53:52.621', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r7q00fcre7dpi5n45me', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 1370.60, 'GHS', 'Payment received for INV-2026-00026', 'Sales', '2026-09-22 00:00:00', 'PAY-2026-00022', NULL, 'cmu2m5r7b00f4re7d6i1qise6', NULL, 'cmu2m5r7o00fbre7djfxo15ic', NULL, 'cmu2m5qhc0061re7dbvxmy9ds', NULL, NULL, '2026-09-15 11:53:52.646', '2026-09-15 11:53:52.646', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r8h00fmre7d1c3qp9c5', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 10669.40, 'GHS', 'Payment received for INV-2026-00027', 'Sales', '2026-09-14 00:00:00', 'PAY-2026-00023', NULL, 'cmu2m5r7z00fere7dbwvdrted', NULL, 'cmu2m5r8f00flre7d6mga16m3', NULL, 'cmu2m5qhg0062re7dwhqjf5gz', NULL, NULL, '2026-09-15 11:53:52.673', '2026-09-15 11:53:52.673', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5r9r00g5re7d0h6uiuvo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 9989.20, 'GHS', 'Payment received for INV-2026-00029', 'Sales', '2026-09-21 00:00:00', 'PAY-2026-00024', NULL, 'cmu2m5r9600fvre7dy356jx42', NULL, 'cmu2m5r9p00g4re7d64fo2bch', NULL, 'cmu2m5qhl0064re7d1vp4egez', NULL, NULL, '2026-09-15 11:53:52.719', '2026-09-15 11:53:52.719', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rac00gdre7d51rge7mn', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'INCOME', 2668.60, 'GHS', 'Payment received for INV-2026-00030', 'Sales', '2026-10-01 00:00:00', 'PAY-2026-00025', NULL, 'cmu2m5r9z00g7re7dhj28yo6z', NULL, 'cmu2m5raa00gcre7dflrisivz', NULL, 'cmu2m5qho0065re7d4hn7mtvt', NULL, NULL, '2026-09-15 11:53:52.74', '2026-09-15 11:53:52.74', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rap00ggre7d6pzm4rqt', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -9240.00, 'GHS', 'Warehouse rent, quarterly', 'Rent & facilities', '2026-09-03 00:00:00', 'EXP-2026-00001', NULL, NULL, NULL, NULL, 'cmu2m5ram00gfre7d0quwisqm', NULL, NULL, NULL, '2026-09-15 11:53:52.753', '2026-09-15 11:53:52.753', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ray00gjre7dzmewispz', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls', 'Travel', '2026-09-10 00:00:00', 'EXP-2026-00002', NULL, NULL, NULL, NULL, 'cmu2m5raw00gire7d9xha6w8c', NULL, NULL, NULL, '2026-09-15 11:53:52.762', '2026-09-15 11:53:52.762', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rb700gmre7duxts8r3s', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats)', 'Software & subscriptions', '2026-08-27 00:00:00', 'EXP-2026-00003', NULL, NULL, NULL, NULL, 'cmu2m5rb400glre7dfjoq2or0', NULL, NULL, NULL, '2026-09-15 11:53:52.771', '2026-09-15 11:53:52.771', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rbh00gpre7d0q3l0wu3', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3575.00, 'GHS', 'Trade show stand at Workspace Expo', 'Marketing', '2026-08-19 00:00:00', 'EXP-2026-00004', NULL, NULL, NULL, NULL, 'cmu2m5rbf00gore7dnq2lgtcu', NULL, NULL, NULL, '2026-09-15 11:53:52.781', '2026-09-15 11:53:52.781', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rbq00gsre7d67j2ypjz', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity', 'Utilities', '2026-09-07 00:00:00', 'EXP-2026-00005', NULL, NULL, NULL, NULL, 'cmu2m5rbn00grre7ddsihz6ek', NULL, NULL, NULL, '2026-09-15 11:53:52.79', '2026-09-15 11:53:52.79', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rc100gvre7d3lmw2fwz', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1298.00, 'GHS', 'Forklift annual service', 'Equipment', '2026-08-12 00:00:00', 'EXP-2026-00006', NULL, NULL, NULL, NULL, 'cmu2m5rby00gure7da0sowjzz', NULL, NULL, NULL, '2026-09-15 11:53:52.801', '2026-09-15 11:53:52.801', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rca00gyre7dnfltg9mm', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer', 'Professional services', '2026-08-31 00:00:00', 'EXP-2026-00007', NULL, NULL, NULL, NULL, 'cmu2m5rc700gxre7d1ldyyy49', NULL, NULL, NULL, '2026-09-15 11:53:52.81', '2026-09-15 11:53:52.81', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rcj00h1re7d4mb25273', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -438.57, 'GHS', 'Packing materials and pallets', 'Office supplies', '2026-09-12 00:00:00', 'EXP-2026-00008', NULL, NULL, NULL, NULL, 'cmu2m5rch00h0re7dl9f5jyp0', NULL, NULL, NULL, '2026-09-15 11:53:52.819', '2026-09-15 11:53:52.819', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rcr00h4re7druid8bod', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -950.40, 'GHS', 'Installer team overnight accommodation', 'Travel', '2026-08-25 00:00:00', 'EXP-2026-00009', NULL, NULL, NULL, NULL, 'cmu2m5rcp00h3re7dnhw0z7f0', NULL, NULL, NULL, '2026-09-15 11:53:52.827', '2026-09-15 11:53:52.827', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rcz00h7re7d69wm3n4p', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -2464.00, 'GHS', 'Liability insurance premium', 'Professional services', '2026-08-01 00:00:00', 'EXP-2026-00010', NULL, NULL, NULL, NULL, 'cmu2m5rcx00h6re7d6oq5qagt', NULL, NULL, NULL, '2026-09-15 11:53:52.835', '2026-09-15 11:53:52.835', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rd800hare7dzvpdx7e9', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, current month', 'Rent & facilities', '2026-08-29 00:00:00', 'EXP-2026-00011', NULL, NULL, NULL, NULL, 'cmu2m5rd500h9re7di675wfe5', NULL, NULL, NULL, '2026-09-15 11:53:52.844', '2026-09-15 11:53:52.844', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rdf00hdre7dk327qgr4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), current month', 'Software & subscriptions', '2026-08-31 00:00:00', 'EXP-2026-00012', NULL, NULL, NULL, NULL, 'cmu2m5rde00hcre7dp8tvauld', NULL, NULL, NULL, '2026-09-15 11:53:52.851', '2026-09-15 11:53:52.851', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rdl00hgre7dvx26ip15', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, current month', 'Utilities', '2026-09-04 00:00:00', 'EXP-2026-00013', NULL, NULL, NULL, NULL, 'cmu2m5rdk00hfre7ddpxa0xsw', NULL, NULL, NULL, '2026-09-15 11:53:52.857', '2026-09-15 11:53:52.857', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rds00hjre7dme1gj20l', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, current month', 'Professional services', '2026-09-02 00:00:00', 'EXP-2026-00014', NULL, NULL, NULL, NULL, 'cmu2m5rdq00hire7d4hu5idx2', NULL, NULL, NULL, '2026-09-15 11:53:52.864', '2026-09-15 11:53:52.864', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5re100hmre7day26dzkj', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, current month', 'Travel', '2026-08-31 00:00:00', 'EXP-2026-00015', NULL, NULL, NULL, NULL, 'cmu2m5re000hlre7d65shu7a1', NULL, NULL, NULL, '2026-09-15 11:53:52.873', '2026-09-15 11:53:52.873', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5re900hpre7dphidopxn', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 1 month ago', 'Rent & facilities', '2026-08-08 00:00:00', 'EXP-2026-00016', NULL, NULL, NULL, NULL, 'cmu2m5re700hore7dj6qs2d0k', NULL, NULL, NULL, '2026-09-15 11:53:52.881', '2026-09-15 11:53:52.881', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ref00hsre7dzmsx2zmt', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 1 month ago', 'Software & subscriptions', '2026-08-05 00:00:00', 'EXP-2026-00017', NULL, NULL, NULL, NULL, 'cmu2m5ree00hrre7dali25lr9', NULL, NULL, NULL, '2026-09-15 11:53:52.887', '2026-09-15 11:53:52.887', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rem00hvre7dp8r2uahv', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 1 month ago', 'Utilities', '2026-07-31 00:00:00', 'EXP-2026-00018', NULL, NULL, NULL, NULL, 'cmu2m5rel00hure7ddnor9zbi', NULL, NULL, NULL, '2026-09-15 11:53:52.894', '2026-09-15 11:53:52.894', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ret00hyre7d52bx5p8z', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 1 month ago', 'Professional services', '2026-07-30 00:00:00', 'EXP-2026-00019', NULL, NULL, NULL, NULL, 'cmu2m5rer00hxre7dypxkoz0q', NULL, NULL, NULL, '2026-09-15 11:53:52.901', '2026-09-15 11:53:52.901', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rez00i1re7djbi0mth4', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 1 month ago', 'Travel', '2026-08-14 00:00:00', 'EXP-2026-00020', NULL, NULL, NULL, NULL, 'cmu2m5rex00i0re7d7ss1j95v', NULL, NULL, NULL, '2026-09-15 11:53:52.907', '2026-09-15 11:53:52.907', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rf600i4re7diemg1ca9', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 2 months ago', 'Rent & facilities', '2026-07-04 00:00:00', 'EXP-2026-00021', NULL, NULL, NULL, NULL, 'cmu2m5rf400i3re7dtoqq1ilu', NULL, NULL, NULL, '2026-09-15 11:53:52.914', '2026-09-15 11:53:52.914', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfc00i7re7dq9bl5lsf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 2 months ago', 'Software & subscriptions', '2026-07-02 00:00:00', 'EXP-2026-00022', NULL, NULL, NULL, NULL, 'cmu2m5rfb00i6re7dcmo8ke97', NULL, NULL, NULL, '2026-09-15 11:53:52.92', '2026-09-15 11:53:52.92', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfj00iare7deisfzq14', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 2 months ago', 'Utilities', '2026-07-11 00:00:00', 'EXP-2026-00023', NULL, NULL, NULL, NULL, 'cmu2m5rfh00i9re7dl4w3l6oq', NULL, NULL, NULL, '2026-09-15 11:53:52.927', '2026-09-15 11:53:52.927', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfp00idre7dtueu7pmd', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 2 months ago', 'Professional services', '2026-07-01 00:00:00', 'EXP-2026-00024', NULL, NULL, NULL, NULL, 'cmu2m5rfo00icre7d5srcvabm', NULL, NULL, NULL, '2026-09-15 11:53:52.933', '2026-09-15 11:53:52.933', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rfw00igre7dbumkif1a', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 2 months ago', 'Travel', '2026-07-05 00:00:00', 'EXP-2026-00025', NULL, NULL, NULL, NULL, 'cmu2m5rfu00ifre7days8z7fo', NULL, NULL, NULL, '2026-09-15 11:53:52.94', '2026-09-15 11:53:52.94', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rg200ijre7dzshkrlzm', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 3 months ago', 'Rent & facilities', '2026-06-01 00:00:00', 'EXP-2026-00026', NULL, NULL, NULL, NULL, 'cmu2m5rg100iire7d5mpx8saq', NULL, NULL, NULL, '2026-09-15 11:53:52.946', '2026-09-15 11:53:52.946', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rg900imre7dfijnuern', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 3 months ago', 'Software & subscriptions', '2026-05-29 00:00:00', 'EXP-2026-00027', NULL, NULL, NULL, NULL, 'cmu2m5rg700ilre7d4t2pyede', NULL, NULL, NULL, '2026-09-15 11:53:52.953', '2026-09-15 11:53:52.953', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rge00ipre7dlfap7jpc', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 3 months ago', 'Utilities', '2026-06-09 00:00:00', 'EXP-2026-00028', NULL, NULL, NULL, NULL, 'cmu2m5rgd00iore7d8j425sjk', NULL, NULL, NULL, '2026-09-15 11:53:52.958', '2026-09-15 11:53:52.958', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rgl00isre7d9ita7qvk', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 3 months ago', 'Professional services', '2026-06-05 00:00:00', 'EXP-2026-00029', NULL, NULL, NULL, NULL, 'cmu2m5rgk00irre7dsgfo3gvq', NULL, NULL, NULL, '2026-09-15 11:53:52.965', '2026-09-15 11:53:52.965', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rgu00ivre7dbuxhpc79', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 3 months ago', 'Travel', '2026-05-31 00:00:00', 'EXP-2026-00030', NULL, NULL, NULL, NULL, 'cmu2m5rgt00iure7dg7hulk2d', NULL, NULL, NULL, '2026-09-15 11:53:52.974', '2026-09-15 11:53:52.974', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rh000iyre7d8qw257bf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 4 months ago', 'Rent & facilities', '2026-05-11 00:00:00', 'EXP-2026-00031', NULL, NULL, NULL, NULL, 'cmu2m5rgz00ixre7d9zfp5coa', NULL, NULL, NULL, '2026-09-15 11:53:52.98', '2026-09-15 11:53:52.98', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rh600j1re7dlgdi83qf', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 4 months ago', 'Software & subscriptions', '2026-05-05 00:00:00', 'EXP-2026-00032', NULL, NULL, NULL, NULL, 'cmu2m5rh500j0re7dus35zrsd', NULL, NULL, NULL, '2026-09-15 11:53:52.986', '2026-09-15 11:53:52.986', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhc00j4re7d4ko646hv', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 4 months ago', 'Utilities', '2026-05-08 00:00:00', 'EXP-2026-00033', NULL, NULL, NULL, NULL, 'cmu2m5rhb00j3re7dr4ybbizu', NULL, NULL, NULL, '2026-09-15 11:53:52.992', '2026-09-15 11:53:52.992', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhj00j7re7dyk7tbm76', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 4 months ago', 'Professional services', '2026-05-14 00:00:00', 'EXP-2026-00034', NULL, NULL, NULL, NULL, 'cmu2m5rhh00j6re7dq8o87m1w', NULL, NULL, NULL, '2026-09-15 11:53:52.999', '2026-09-15 11:53:52.999', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhp00jare7dmgfelu69', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 4 months ago', 'Travel', '2026-05-01 00:00:00', 'EXP-2026-00035', NULL, NULL, NULL, NULL, 'cmu2m5rho00j9re7dbz42pgko', NULL, NULL, NULL, '2026-09-15 11:53:53.005', '2026-09-15 11:53:53.005', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rhw00jdre7draj3v364', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 5 months ago', 'Rent & facilities', '2026-04-16 00:00:00', 'EXP-2026-00036', NULL, NULL, NULL, NULL, 'cmu2m5rhu00jcre7ddaxdzdap', NULL, NULL, NULL, '2026-09-15 11:53:53.012', '2026-09-15 11:53:53.012', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5ri400jgre7d394jd1ga', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 5 months ago', 'Software & subscriptions', '2026-04-14 00:00:00', 'EXP-2026-00037', NULL, NULL, NULL, NULL, 'cmu2m5ri200jfre7dwxnu7wnv', NULL, NULL, NULL, '2026-09-15 11:53:53.02', '2026-09-15 11:53:53.02', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rib00jjre7drzae0cru', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 5 months ago', 'Utilities', '2026-04-14 00:00:00', 'EXP-2026-00038', NULL, NULL, NULL, NULL, 'cmu2m5ri900jire7d31v545aq', NULL, NULL, NULL, '2026-09-15 11:53:53.027', '2026-09-15 11:53:53.027', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rii00jmre7dwnwgizvo', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003ire7drzf97vel', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 5 months ago', 'Professional services', '2026-04-09 00:00:00', 'EXP-2026-00039', NULL, NULL, NULL, NULL, 'cmu2m5rig00jlre7dhe2wy0w6', NULL, NULL, NULL, '2026-09-15 11:53:53.034', '2026-09-15 11:53:53.034', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu2m5rip00jpre7dsnona7b8', 'cmu2m5q7v0037re7dsgqq4eos', 'cmu2m5qa3003jre7dzso0skva', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 5 months ago', 'Travel', '2026-04-09 00:00:00', 'EXP-2026-00040', NULL, NULL, NULL, NULL, 'cmu2m5rin00jore7doyghvg3n', NULL, NULL, NULL, '2026-09-15 11:53:53.041', '2026-09-15 11:53:53.041', NULL);


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict LbJM1sqwZLhZxYWXwNMuue4uSZ46p92iAgrUv6Ia8jyrE91JKl8drs7wsX6edGd

COMMIT;

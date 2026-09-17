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

-- ===== migration: 20260915152416_paystack_billing =====
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "paystackCustomer" TEXT,
ADD COLUMN     "paystackEmailToken" TEXT,
ADD COLUMN     "paystackSubscription" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "plan" TEXT,
    "period" TEXT,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_reference_key" ON "billing_events"("reference");

-- CreateIndex
CREATE INDEX "billing_events_organizationId_occurredAt_idx" ON "billing_events"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "billing_events_type_idx" ON "billing_events"("type");

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== migration: 20260916065240_data_import =====
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "externalId" TEXT;

-- CreateTable
CREATE TABLE "import_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "dataset" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'create',
    "mapping" JSONB,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_runs_organizationId_startedAt_idx" ON "import_runs"("organizationId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organizationId_externalId_key" ON "customers"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_organizationId_externalId_key" ON "product_categories"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "products_organizationId_externalId_key" ON "products"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_organizationId_externalId_key" ON "suppliers"("organizationId", "externalId");

-- AddForeignKey
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== migration: 20260917004211_assistant =====
-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_proposals" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "preview" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultLabel" TEXT,
    "resultHref" TEXT,
    "error" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_organizationId_userId_updatedAt_idx" ON "conversations"("organizationId", "userId", "updatedAt");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "assistant_proposals_conversationId_idx" ON "assistant_proposals"("conversationId");

-- CreateIndex
CREATE INDEX "assistant_proposals_organizationId_status_idx" ON "assistant_proposals"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== migration: 20260917160149_invoice_template =====
-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "invoiceTemplate" TEXT NOT NULL DEFAULT 'classic';

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
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '961af8efdd69fc547ec35762c420b49b3d90d95b2a11b3ebba3ee9f5b32dc826', now(), '20260915152416_paystack_billing', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, 'c30c4872513a37778f1e0caceb302fbd2e16bed63f6c1d8a1bcb5ca9efa7c1e2', now(), '20260916065240_data_import', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '820c8854d792512f581291f1031d86a64ecfd2065f440162ada479293081fb06', now(), '20260917004211_assistant', now(), 1);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '0787c77ff628367e8af57f59e9f2a5a92c41d25533713498b99d3f803dff1ec2', now(), '20260917160149_invoice_template', now(), 1);

-- ===== demo dataset =====
--
-- PostgreSQL database dump
--

\restrict ApoLEJREsoLhLAeBTdkk70Z8LrefUvHAoYSaGkr5X3rVTVuumDPvFMUHCfcZkG3

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

INSERT INTO public.organizations (id, name, slug, "legalName", email, phone, website, "taxId", "logoUrl", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, timezone, industry, plan, "isActive", "createdAt", "updatedAt", "deletedAt", "requestedPlan", "subscriptionStatus", "trialEndsAt", "requestedBilling", "paystackCustomer", "paystackEmailToken", "paystackSubscription", "subscriptionEndsAt") VALUES ('cmu5qfdzr0037xi7djkemxwps', 'Northwind Supply Co.', 'northwind-supply-co', 'Northwind Supply Company LLC', 'accounts@northwindsupply.example', '+1 (415) 555-0200', 'https://northwindsupply.example', 'US-884-120-663', NULL, '1400 Cesar Chavez Street', 'Unit 22', 'San Francisco', 'CA', '94107', 'Ghana', 'GHS', 'Africa/Accra', 'Commercial interiors', 'business', true, '2026-09-17 16:16:39.063', '2026-09-17 16:16:39.133', NULL, NULL, 'trialing', '2026-10-05 16:16:38.464', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.organizations (id, name, slug, "legalName", email, phone, website, "taxId", "logoUrl", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, timezone, industry, plan, "isActive", "createdAt", "updatedAt", "deletedAt", "requestedPlan", "subscriptionStatus", "trialEndsAt", "requestedBilling", "paystackCustomer", "paystackEmailToken", "paystackSubscription", "subscriptionEndsAt") VALUES ('cmu5qfe1v003xxi7dlcrq5rip', 'Harbour Fitouts Ltd.', 'harbour-fitouts', NULL, 'hello@harbourfitouts.example', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Ghana', 'GHS', 'Africa/Accra', NULL, 'business', true, '2026-09-17 16:16:39.139', '2026-09-17 16:16:39.193', NULL, NULL, 'trialing', '2026-09-21 16:16:38.464', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe390048xi7dg5vvdoat', 'cmu5qfe1v003xxi7dlcrq5rip', 'Main business account', 'BANK', NULL, NULL, 'GHS', 0.00, 0.00, NULL, true, true, '2026-09-17 16:16:39.189', '2026-09-17 16:16:39.189', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe390049xi7df2q372cd', 'cmu5qfe1v003xxi7dlcrq5rip', 'Petty cash', 'CASH', NULL, NULL, 'GHS', 0.00, 0.00, NULL, false, true, '2026-09-17 16:16:39.189', '2026-09-17 16:16:39.189', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdzr0037xi7djkemxwps', 'Main business account', 'BANK', NULL, NULL, 'GHS', 0.00, 288710.62, NULL, true, true, '2026-09-17 16:16:39.116', '2026-09-17 16:16:40.257', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe18003jxi7dc88nh70f', 'cmu5qfdzr0037xi7djkemxwps', 'Petty cash', 'CASH', NULL, NULL, 'GHS', 0.00, -11840.95, NULL, false, true, '2026-09-17 16:16:39.116', '2026-09-17 16:16:40.263', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu5qfdxz0000xi7dmfw8krvy', 'owner@northwindsupply.example', 'Alex Moreno', '$2b$12$tX89x52ehp0SSorwKTOJu.Yg0xREHdVOG4aKMhlZUWFlJsUP9p0em', NULL, '+1 (415) 555-0201', 'Managing Director', '2026-09-17 16:16:38.464', NULL, true, '2026-09-17 16:16:38.999', '2026-09-17 16:16:38.999', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu5qfdy60001xi7dqvhm0z2x', 'nadia@northwindsupply.example', 'Nadia Osei', '$2b$12$tX89x52ehp0SSorwKTOJu.Yg0xREHdVOG4aKMhlZUWFlJsUP9p0em', NULL, NULL, 'Head of Sales', '2026-09-17 16:16:38.464', NULL, true, '2026-09-17 16:16:39.006', '2026-09-17 16:16:39.006', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu5qfdy60002xi7df3nss1y1', 'clara@northwindsupply.example', 'Clara Nkemelu', '$2b$12$tX89x52ehp0SSorwKTOJu.Yg0xREHdVOG4aKMhlZUWFlJsUP9p0em', NULL, NULL, 'Management Accountant', '2026-09-17 16:16:38.464', NULL, true, '2026-09-17 16:16:39.006', '2026-09-17 16:16:39.006', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu5qfdy60003xi7d4wwldzbi', 'sophie@northwindsupply.example', 'Sophie Lang', '$2b$12$tX89x52ehp0SSorwKTOJu.Yg0xREHdVOG4aKMhlZUWFlJsUP9p0em', NULL, NULL, 'Interior Designer', '2026-09-17 16:16:38.464', NULL, true, '2026-09-17 16:16:39.006', '2026-09-17 16:16:39.006', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu5qfdy60004xi7drb9ya0a4', 'ben@northwindsupply.example', 'Ben Ferraro', '$2b$12$tX89x52ehp0SSorwKTOJu.Yg0xREHdVOG4aKMhlZUWFlJsUP9p0em', NULL, NULL, 'Operations Manager', '2026-09-17 16:16:38.464', NULL, true, '2026-09-17 16:16:39.006', '2026-09-17 16:16:39.006', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu5qfe1r003wxi7d0yq561yw', 'rosa@harbourfitouts.example', 'Rosa Iglesias', '$2b$12$tX89x52ehp0SSorwKTOJu.Yg0xREHdVOG4aKMhlZUWFlJsUP9p0em', NULL, NULL, 'Founder', '2026-09-17 16:16:38.464', NULL, true, '2026-09-17 16:16:39.135', '2026-09-17 16:16:39.135', false);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: assistant_proposals; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe700066xi7dt39q80ff', 'cmu5qfdzr0037xi7djkemxwps', 'EMP-0001', 'Nadia', 'Osei', 'nadia.osei@northwindsupply.example', '+1 (415) 555-0210', 'Sales', 'Head of Sales', 'FULL_TIME', 'ACTIVE', '2023-04-17 16:16:38.464', NULL, 7400.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 16:16:39.324', '2026-09-17 16:16:39.324', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe730067xi7dkri6hdwe', 'cmu5qfdzr0037xi7djkemxwps', 'EMP-0002', 'Ben', 'Ferraro', 'ben.ferraro@northwindsupply.example', '+1 (415) 555-0211', 'Operations', 'Operations Manager', 'FULL_TIME', 'ACTIVE', '2023-12-17 16:16:38.464', NULL, 6600.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 16:16:39.327', '2026-09-17 16:16:39.327', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe750068xi7d176qjjdr', 'cmu5qfdzr0037xi7djkemxwps', 'EMP-0003', 'Clara', 'Nkemelu', 'clara.nkemelu@northwindsupply.example', '+1 (415) 555-0212', 'Finance', 'Management Accountant', 'FULL_TIME', 'ACTIVE', '2024-11-17 16:16:38.464', NULL, 6100.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 16:16:39.329', '2026-09-17 16:16:39.329', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe770069xi7d7bmvwbty', 'cmu5qfdzr0037xi7djkemxwps', 'EMP-0004', 'Diego', 'Marín', 'diego.marin@northwindsupply.example', '+1 (415) 555-0213', 'Projects', 'Senior Project Manager', 'FULL_TIME', 'ACTIVE', '2025-04-17 16:16:38.464', NULL, 6850.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 16:16:39.331', '2026-09-17 16:16:39.331', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe79006axi7ds4h9lild', 'cmu5qfdzr0037xi7djkemxwps', 'EMP-0005', 'Sophie', 'Lang', 'sophie.lang@northwindsupply.example', '+1 (415) 555-0214', 'Design', 'Interior Designer', 'FULL_TIME', 'ACTIVE', '2025-12-17 16:16:38.464', NULL, 5400.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 16:16:39.333', '2026-09-17 16:16:39.333', NULL);


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez000l0xi7de5lfbkal', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.332', '2026-09-17 16:16:40.332');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez200l1xi7dcz99q2d7', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.334', '2026-09-17 16:16:40.334');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez200l2xi7dcv4konuy', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.334', '2026-09-17 16:16:40.334');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez300l3xi7dq6bl85m5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.335', '2026-09-17 16:16:40.335');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez400l4xi7dlw6erp3h', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.336', '2026-09-17 16:16:40.336');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez500l5xi7du281lf09', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.337', '2026-09-17 16:16:40.337');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez700l6xi7dvjyns4dj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.339', '2026-09-17 16:16:40.339');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez800l7xi7dkhdamm8k', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.34', '2026-09-17 16:16:40.34');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfez900l8xi7d3t2xktow', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.341', '2026-09-17 16:16:40.341');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfeza00l9xi7djotalbd1', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.342', '2026-09-17 16:16:40.342');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezb00laxi7d0glwjbyn', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.343', '2026-09-17 16:16:40.343');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezc00lbxi7du5feh45p', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.344', '2026-09-17 16:16:40.344');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezd00lcxi7d93oxakqv', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.345', '2026-09-17 16:16:40.345');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfeze00ldxi7dgbe2f6s9', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.346', '2026-09-17 16:16:40.346');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfeze00lexi7dqu3qvvzt', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.346', '2026-09-17 16:16:40.346');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezf00lfxi7du9a6qts6', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.347', '2026-09-17 16:16:40.347');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezg00lgxi7dihc36qr4', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.348', '2026-09-17 16:16:40.348');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezh00lhxi7d5a7wa5sa', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.349', '2026-09-17 16:16:40.349');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezi00lixi7dtb6ukqcs', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.35', '2026-09-17 16:16:40.35');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezj00ljxi7d3tve3t26', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.351', '2026-09-17 16:16:40.351');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezj00lkxi7dod5nk9td', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.351', '2026-09-17 16:16:40.351');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezk00llxi7drhceurwj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.352', '2026-09-17 16:16:40.352');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezl00lmxi7djolde2dt', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.353', '2026-09-17 16:16:40.353');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezm00lnxi7dsd5erk5s', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.354', '2026-09-17 16:16:40.354');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezn00loxi7dvm02odrr', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.355', '2026-09-17 16:16:40.355');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezn00lpxi7dhjye1fg3', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.355', '2026-09-17 16:16:40.355');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezo00lqxi7dsx845oir', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.356', '2026-09-17 16:16:40.356');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezp00lrxi7di79uxa0f', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.357', '2026-09-17 16:16:40.357');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezq00lsxi7diwuapgxx', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.358', '2026-09-17 16:16:40.358');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezr00ltxi7dihivsazn', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.359', '2026-09-17 16:16:40.359');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezr00luxi7dywfj9jlg', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.359', '2026-09-17 16:16:40.359');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezs00lvxi7dd6zprwku', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.36', '2026-09-17 16:16:40.36');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezt00lwxi7dh6842ewe', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.361', '2026-09-17 16:16:40.361');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezu00lxxi7d5hca0hic', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.362', '2026-09-17 16:16:40.362');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezu00lyxi7dgloaq60u', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.362', '2026-09-17 16:16:40.362');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezv00lzxi7dyec3fy0e', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.363', '2026-09-17 16:16:40.363');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezw00m0xi7d5ugqrduz', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.364', '2026-09-17 16:16:40.364');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezx00m1xi7d6qfv9syy', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.365', '2026-09-17 16:16:40.365');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezy00m2xi7dgvs913ld', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.366', '2026-09-17 16:16:40.366');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu5qfezy00m3xi7dt91d8yau', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 16:16:40.366', '2026-09-17 16:16:40.366');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3s004pxi7d97kcqb3z', 'cmu5qfdzr0037xi7djkemxwps', 'Kestrel Timber Works', 'Kestrel Timber Works Ltd.', 'orders@kestreltimber.example', '+1 (503) 555-0118', NULL, 'US-771-204-338', NULL, 'Portland', 'OR', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-17 16:16:39.208', '2026-09-17 16:16:39.208', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3u004qxi7dy06m8zzp', 'cmu5qfdzr0037xi7djkemxwps', 'Vertex Seating', 'Vertex Seating Inc.', 'supply@vertexseating.example', '+1 (312) 555-0143', NULL, 'US-660-918-224', NULL, 'Chicago', 'IL', NULL, 'United States', 45, NULL, 'ACTIVE', '2026-09-17 16:16:39.21', '2026-09-17 16:16:39.21', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3w004rxi7d7oy9ur71', 'cmu5qfdzr0037xi7djkemxwps', 'Halcyon Acoustics', 'Halcyon Acoustics LLC', 'hello@halcyonacoustics.example', '+1 (206) 555-0177', NULL, NULL, NULL, 'Seattle', 'WA', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-17 16:16:39.212', '2026-09-17 16:16:39.212', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3x004sxi7d5pngjbbe', 'cmu5qfdzr0037xi7djkemxwps', 'Meridian Electrical Supply', 'Meridian Electrical Supply Co.', 'accounts@meridianelec.example', '+1 (415) 555-0192', NULL, NULL, NULL, 'Oakland', 'CA', NULL, 'United States', 21, NULL, 'ACTIVE', '2026-09-17 16:16:39.213', '2026-09-17 16:16:39.213', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3z004txi7domrj4jf9', 'cmu5qfdzr0037xi7djkemxwps', 'Cobalt Metal Fabrication', 'Cobalt Metal Fabrication', 'sales@cobaltfab.example', '+1 (602) 555-0164', NULL, NULL, NULL, 'Phoenix', 'AZ', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-17 16:16:39.215', '2026-09-17 16:16:39.215', NULL, NULL);


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3j004jxi7dwr9211ms', 'cmu5qfdzr0037xi7djkemxwps', 'Workstations', 'Desks, benches and height-adjustable frames', NULL, NULL, '2026-09-17 16:16:39.199', '2026-09-17 16:16:39.199', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3l004kxi7dub3vi65v', 'cmu5qfdzr0037xi7djkemxwps', 'Seating', 'Task chairs, stools and soft seating', NULL, NULL, '2026-09-17 16:16:39.201', '2026-09-17 16:16:39.201', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3m004lxi7dtxycn1r5', 'cmu5qfdzr0037xi7djkemxwps', 'Storage', 'Pedestals, lockers and shelving', NULL, NULL, '2026-09-17 16:16:39.202', '2026-09-17 16:16:39.202', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3n004mxi7di5rkza9p', 'cmu5qfdzr0037xi7djkemxwps', 'Acoustics', 'Panels, screens and sound treatment', NULL, NULL, '2026-09-17 16:16:39.203', '2026-09-17 16:16:39.203', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3o004nxi7dapbc3ote', 'cmu5qfdzr0037xi7djkemxwps', 'Power & data', 'Cable management, sockets and modules', NULL, NULL, '2026-09-17 16:16:39.204', '2026-09-17 16:16:39.204', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3p004oxi7d5tx5v5pa', 'cmu5qfdzr0037xi7djkemxwps', 'Services', 'Design, delivery and installation labour', NULL, NULL, '2026-09-17 16:16:39.206', '2026-09-17 16:16:39.206', NULL, NULL);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5o005kxi7dtn5cieaj', 'cmu5qfdzr0037xi7djkemxwps', 'Acoustic Ceiling Baffle', 'AC-BAF-1200', NULL, 'Suspended vertical baffle, 1200×300mm.', 'GOOD', 'cmu5qfe3n004mxi7di5rkza9p', 'cmu5qfe3w004rxi7d7oy9ur71', 'unit', 58.00, 108.00, 10.000, 96.000, 30.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.276', '2026-09-17 16:16:39.276', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6c005uxi7dufd2m472', 'cmu5qfdzr0037xi7djkemxwps', 'Space Planning & Design', 'SV-DESIGN', NULL, 'CAD space planning, furniture specification and 3D visuals.', 'SERVICE', 'cmu5qfe3p004oxi7d5tx5v5pa', NULL, 'hour', 0.00, 125.00, 10.000, 0.000, 0.000, false, NULL, 'ACTIVE', '2026-09-17 16:16:39.3', '2026-09-17 16:16:39.3', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6e005vxi7djw02yt35', 'cmu5qfdzr0037xi7djkemxwps', 'Delivery & Installation', 'SV-INSTALL', NULL, 'Two-person install team, build, placement and waste removal.', 'SERVICE', 'cmu5qfe3p004oxi7d5tx5v5pa', NULL, 'hour', 0.00, 88.00, 10.000, 0.000, 0.000, false, NULL, 'ACTIVE', '2026-09-17 16:16:39.302', '2026-09-17 16:16:39.302', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe4q0056xi7d7ilrhobv', 'cmu5qfdzr0037xi7djkemxwps', 'Draughtsman Stool', 'ST-DRFT-GRY', NULL, 'Height-adjustable stool with footring, grey fabric.', 'GOOD', 'cmu5qfe3l004kxi7dub3vi65v', 'cmu5qfe3u004qxi7dy06m8zzp', 'unit', 132.00, 249.00, 10.000, 0.000, 6.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.242', '2026-09-17 16:16:39.593', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe41004uxi7ddcursik2', 'cmu5qfdzr0037xi7djkemxwps', 'Meridian Sit-Stand Desk 1600', 'WS-1600-OAK', NULL, 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 'GOOD', 'cmu5qfe3j004jxi7dwr9211ms', 'cmu5qfe3s004pxi7d97kcqb3z', 'unit', 412.00, 749.00, 10.000, 79.000, 10.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.217', '2026-09-17 16:16:39.933', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe64005sxi7d0kk6zzww', 'cmu5qfdzr0037xi7djkemxwps', 'Under-Desk Cable Tray 1200', 'PD-TRY-1200', NULL, 'Perforated steel cable tray with fixings.', 'GOOD', 'cmu5qfe3o004nxi7dapbc3ote', NULL, 'unit', 17.00, 34.00, 10.000, 517.000, 50.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.292', '2026-09-17 16:16:39.95', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe4u0058xi7do392h6fr', 'cmu5qfdzr0037xi7djkemxwps', 'Alcove Soft Seating Two-Seat', 'ST-SOFT-2S', NULL, 'High-back two-seat booth in wool-blend upholstery.', 'GOOD', 'cmu5qfe3l004kxi7dub3vi65v', NULL, 'unit', 640.00, 1150.00, 10.000, 0.000, 3.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.246', '2026-09-17 16:16:39.642', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe4j0052xi7d3ktapiml', 'cmu5qfdzr0037xi7djkemxwps', 'Vertex Ergo Task Chair', 'ST-ERGO-BLK', NULL, 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 'GOOD', 'cmu5qfe3l004kxi7dub3vi65v', 'cmu5qfe3u004qxi7dy06m8zzp', 'unit', 218.00, 399.00, 10.000, 193.000, 20.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.235', '2026-09-17 16:16:39.997', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe4m0054xi7ds0ibubz5', 'cmu5qfdzr0037xi7djkemxwps', 'Vertex Ergo Task Chair (Headrest)', 'ST-ERGO-HR', NULL, 'Ergo task chair with adjustable headrest.', 'GOOD', 'cmu5qfe3l004kxi7dub3vi65v', 'cmu5qfe3u004qxi7dy06m8zzp', 'unit', 254.00, 459.00, 10.000, 59.000, 12.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.238', '2026-09-17 16:16:39.967', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5f005gxi7d65bfsb6g', 'cmu5qfdzr0037xi7djkemxwps', 'Acoustic Desk Screen 1400', 'AC-SCR-1400', NULL, 'PET felt desk-mounted screen, 1400×400mm.', 'GOOD', 'cmu5qfe3n004mxi7di5rkza9p', 'cmu5qfe3w004rxi7d7oy9ur71', 'unit', 62.00, 119.00, 10.000, 330.000, 30.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.267', '2026-09-17 16:16:39.999', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe57005cxi7d5gyzpj4n', 'cmu5qfdzr0037xi7djkemxwps', 'Personal Locker Bank of 6', 'SG-LOCK-6', NULL, 'Six-door locker bank with digital locks.', 'GOOD', 'cmu5qfe3m004lxi7dtxycn1r5', 'cmu5qfe3z004txi7domrj4jf9', 'unit', 470.00, 845.00, 10.000, 0.000, 5.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.259', '2026-09-17 16:16:39.716', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5y005qxi7dmr1135qk', 'cmu5qfdzr0037xi7djkemxwps', 'Vertical Cable Spine', 'PD-CBL-SPN', NULL, 'Flexible spine routing cables from desk to floor box.', 'GOOD', 'cmu5qfe3o004nxi7dapbc3ote', 'cmu5qfe3x004sxi7d5pngjbbe', 'unit', 22.00, 45.00, 10.000, 333.000, 30.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.286', '2026-09-17 16:16:39.89', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5c005exi7dx1fv80s5', 'cmu5qfdzr0037xi7djkemxwps', 'Open Shelving Unit 1800', 'SG-SHLF-1800', NULL, 'Five-tier open shelving, powder-coated steel.', 'GOOD', 'cmu5qfe3m004lxi7dtxycn1r5', NULL, 'unit', 156.00, 289.00, 10.000, 46.000, 8.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.264', '2026-09-17 16:16:40.002', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5r005mxi7dqttogrcw', 'cmu5qfdzr0037xi7djkemxwps', 'Phone Booth Single', 'AC-BOOTH-1P', NULL, 'Single-occupancy acoustic pod with ventilation and lighting.', 'GOOD', 'cmu5qfe3n004mxi7di5rkza9p', NULL, 'unit', 3150.00, 5290.00, 10.000, 0.000, 2.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.279', '2026-09-17 16:16:39.834', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe49004yxi7dtni24pdo', 'cmu5qfdzr0037xi7djkemxwps', 'Halden Bench Desk 4-Person', 'WS-BEN-4P', NULL, 'Four-person back-to-back bench with shared cable tray.', 'GOOD', 'cmu5qfe3j004jxi7dwr9211ms', 'cmu5qfe3s004pxi7d97kcqb3z', 'unit', 960.00, 1685.00, 10.000, 0.000, 4.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.225', '2026-09-17 16:16:39.735', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5u005oxi7dwggqerb0', 'cmu5qfdzr0037xi7djkemxwps', 'Desktop Power Module 2×Socket', 'PD-PWR-2S', NULL, 'Clamp-on module with two sockets and two USB-C.', 'GOOD', 'cmu5qfe3o004nxi7dapbc3ote', 'cmu5qfe3x004sxi7d5pngjbbe', 'unit', 41.00, 79.00, 10.000, 466.000, 40.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.282', '2026-09-17 16:16:40.017', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe4z005axi7dl1bjteys', 'cmu5qfdzr0037xi7djkemxwps', 'Mobile Pedestal 3-Drawer', 'SG-PED-3D', NULL, 'Lockable steel pedestal on castors.', 'GOOD', 'cmu5qfe3m004lxi7dtxycn1r5', 'cmu5qfe3z004txi7domrj4jf9', 'unit', 88.00, 165.00, 10.000, 280.000, 25.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.251', '2026-09-17 16:16:39.909', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe46004wxi7dzsbk6yl3', 'cmu5qfdzr0037xi7djkemxwps', 'Meridian Sit-Stand Desk 1400', 'WS-1400-OAK', NULL, 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 'GOOD', 'cmu5qfe3j004jxi7dwr9211ms', 'cmu5qfe3s004pxi7d97kcqb3z', 'unit', 378.00, 689.00, 10.000, 132.000, 10.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.222', '2026-09-17 16:16:39.911', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe4d0050xi7dxa7k9i8v', 'cmu5qfdzr0037xi7djkemxwps', 'Corner Workstation 1800', 'WS-CNR-1800', NULL, 'Fixed-height corner desk with modesty panel.', 'GOOD', 'cmu5qfe3j004jxi7dwr9211ms', NULL, 'unit', 246.00, 445.00, 10.000, 0.000, 8.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.229', '2026-09-17 16:16:39.985', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe5k005ixi7dip14tjcb', 'cmu5qfdzr0037xi7djkemxwps', 'Acoustic Wall Panel 600×600', 'AC-PNL-600', NULL, 'Class A absorber panel, 40mm, concealed fixings.', 'GOOD', 'cmu5qfe3n004mxi7di5rkza9p', 'cmu5qfe3w004rxi7d7oy9ur71', 'unit', 44.00, 84.00, 10.000, 810.000, 60.000, true, NULL, 'ACTIVE', '2026-09-17 16:16:39.272', '2026-09-17 16:16:39.988', NULL, NULL);


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: billing_events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.branches (id, "organizationId", name, code, "addressLine1", city, state, "postalCode", country, phone, email, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe14003gxi7dxpd2z75h', 'cmu5qfdzr0037xi7djkemxwps', 'Head office', 'HQ', NULL, NULL, NULL, NULL, 'Ghana', NULL, NULL, true, true, '2026-09-17 16:16:39.112', '2026-09-17 16:16:39.112', NULL);
INSERT INTO public.branches (id, "organizationId", name, code, "addressLine1", city, state, "postalCode", country, phone, email, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe370046xi7d4nrixmfu', 'cmu5qfe1v003xxi7dlcrq5rip', 'Head office', 'HQ', NULL, NULL, NULL, NULL, 'Ghana', NULL, NULL, true, true, '2026-09-17 16:16:39.187', '2026-09-17 16:16:39.187', NULL);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.company_settings (id, "organizationId", "invoicePrefix", "quotationPrefix", "paymentPrefix", "purchaseOrderPrefix", "numberPadding", "numberIncludeYear", "defaultPaymentTermDays", "defaultInvoiceNotes", "paymentInstructions", "invoiceFooter", "taxLabel", "defaultTaxRate", "pricesIncludeTax", "lowStockAlerts", "notifyOnInvoicePaid", "notifyOnLowStock", "notifyOnQuoteAccepted", "notifyOnOverdue", "primaryColor", "secondaryColor", "createdAt", "updatedAt", "invoiceTemplate") VALUES ('cmu5qfdzt0038xi7dl4gnyhir', 'cmu5qfdzr0037xi7djkemxwps', 'INV', 'QTE', 'PAY', 'PO', 5, true, 14, NULL, 'Please reference the invoice number with your payment so we can match it automatically.', 'Thank you for your business.', 'VAT', 10.000, false, true, true, true, true, true, NULL, NULL, '2026-09-17 16:16:39.063', '2026-09-17 16:16:39.063', 'classic');
INSERT INTO public.company_settings (id, "organizationId", "invoicePrefix", "quotationPrefix", "paymentPrefix", "purchaseOrderPrefix", "numberPadding", "numberIncludeYear", "defaultPaymentTermDays", "defaultInvoiceNotes", "paymentInstructions", "invoiceFooter", "taxLabel", "defaultTaxRate", "pricesIncludeTax", "lowStockAlerts", "notifyOnInvoicePaid", "notifyOnLowStock", "notifyOnQuoteAccepted", "notifyOnOverdue", "primaryColor", "secondaryColor", "createdAt", "updatedAt", "invoiceTemplate") VALUES ('cmu5qfe1v003yxi7drupgv7gt', 'cmu5qfe1v003xxi7dlcrq5rip', 'INV', 'QTE', 'PAY', 'PO', 5, true, 14, NULL, 'Please reference the invoice number with your payment so we can match it automatically.', 'Thank you for your business.', 'VAT', 10.000, false, true, true, true, true, true, NULL, NULL, '2026-09-17 16:16:39.139', '2026-09-17 16:16:39.139', 'classic');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe3g004ixi7dupbyabqm', 'cmu5qfe1v003xxi7dlcrq5rip', 'Bay Marina Offices', 'Bay Marina Offices LLC', 'admin@baymarina.example', NULL, NULL, NULL, NULL, NULL, 'Sausalito', NULL, NULL, 'United States', NULL, NULL, 14, NULL, '{}', 'ACTIVE', '2026-09-17 16:16:39.196', '2026-09-17 16:16:39.196', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6g005wxi7dii6bekpm', 'cmu5qfdzr0037xi7djkemxwps', 'Priya Raghavan', 'Lumen Health Group', 'priya.raghavan@lumenhealth.example', '+1 (415) 555-0121', NULL, 'US-338-221-904', '2100 Folsom Street', NULL, 'San Francisco', 'CA', '94110', 'United States', NULL, NULL, 30, 'Rolling refit across four clinics. Purchase orders required on every invoice.', '{healthcare,"key account"}', 'ACTIVE', '2025-05-17 16:16:38.464', '2026-09-17 16:16:39.304', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6i005xxi7dj4aemiz1', 'cmu5qfdzr0037xi7djkemxwps', 'Daniel Okonkwo', 'Fairview Legal Partners', 'd.okonkwo@fairviewlegal.example', '+1 (212) 555-0187', NULL, NULL, '48 Wall Street, Floor 11', NULL, 'New York', 'NY', '10005', 'United States', NULL, NULL, 14, 'Prefers quotations valid for 30 days. Pays reliably within terms.', '{"professional services"}', 'ACTIVE', '2025-02-17 16:16:38.464', '2026-09-17 16:16:39.306', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6k005yxi7dheo9lpoa', 'cmu5qfdzr0037xi7djkemxwps', 'Marta Delgado', 'Cobre Coffee Roasters', 'marta@cobrecoffee.example', '+1 (512) 555-0139', NULL, NULL, '910 East 6th Street', NULL, 'Austin', 'TX', '78702', 'United States', NULL, NULL, 14, 'Opening two new sites this year. Interested in acoustic panelling.', '{hospitality,growth}', 'ACTIVE', '2025-02-17 16:16:38.464', '2026-09-17 16:16:39.308', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6m005zxi7djbndzaq0', 'cmu5qfdzr0037xi7djkemxwps', 'Tom Whitfield', 'Northside Academy Trust', 'procurement@northsideacademy.example', '+1 (617) 555-0155', NULL, 'US-119-887-455', '300 Huntington Avenue', NULL, 'Boston', 'MA', '02115', 'United States', NULL, NULL, 45, 'Public sector terms. Invoices must quote the framework reference.', '{education,"public sector"}', 'ACTIVE', '2026-04-17 16:16:38.464', '2026-09-17 16:16:39.31', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6q0060xi7dh0m5fxv6', 'cmu5qfdzr0037xi7djkemxwps', 'Alice Chen', 'Bright Harbour Studios', 'alice.chen@brightharbour.example', '+1 (206) 555-0148', NULL, NULL, '77 Yesler Way', NULL, 'Seattle', 'WA', '98104', 'United States', NULL, NULL, 14, 'Design-led fitout. Signs off quickly but wants samples first.', '{creative}', 'ACTIVE', '2026-07-17 16:16:38.464', '2026-09-17 16:16:39.314', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6s0061xi7dci8v10qe', 'cmu5qfdzr0037xi7djkemxwps', 'Samuel Boateng', 'Ridgeline Logistics', 's.boateng@ridgelinelogistics.example', '+1 (303) 555-0176', NULL, NULL, '4500 Havana Street', NULL, 'Denver', 'CO', '80239', 'United States', NULL, NULL, 30, 'Warehouse offices. Volume pricing agreed on storage lines.', '{logistics}', 'ACTIVE', '2025-09-17 16:16:38.464', '2026-09-17 16:16:39.316', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6u0062xi7de4xegtki', 'cmu5qfdzr0037xi7djkemxwps', 'Hannah Lindqvist', 'Aster Biotech', 'hannah.l@asterbiotech.example', '+1 (858) 555-0193', NULL, 'US-502-663-118', '11255 Torrey Pines Road', NULL, 'San Diego', 'CA', '92121', 'United States', NULL, NULL, 30, 'Lab-adjacent office space. Strict delivery windows.', '{"life sciences","key account"}', 'ACTIVE', '2026-03-17 16:16:38.464', '2026-09-17 16:16:39.318', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6v0063xi7d2u45voj8', 'cmu5qfdzr0037xi7djkemxwps', 'Owen Pritchard', 'Grainger & Mills Accountants', 'owen@graingermills.example', '+1 (704) 555-0129', NULL, NULL, '620 South Tryon Street', NULL, 'Charlotte', 'NC', '28202', 'United States', NULL, NULL, 14, 'Small but repeat orders every quarter.', '{"professional services"}', 'ACTIVE', '2024-11-17 16:16:38.464', '2026-09-17 16:16:39.319', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6w0064xi7d8qto7xt1', 'cmu5qfdzr0037xi7djkemxwps', 'Yara Haddad', 'Solstice Fitness Collective', 'yara@solsticefitness.example', '+1 (305) 555-0161', NULL, NULL, '1801 Biscayne Boulevard', NULL, 'Miami', 'FL', '33132', 'United States', NULL, NULL, 21, 'Reception and staff areas only. Budget sensitive.', '{leisure}', 'ACTIVE', '2026-04-17 16:16:38.464', '2026-09-17 16:16:39.32', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu5qfe6y0065xi7d5218zaog', 'cmu5qfdzr0037xi7djkemxwps', 'Greg Salter', 'Mercer Property Group', 'g.salter@mercerproperty.example', '+1 (503) 555-0184', NULL, 'US-410-775-236', '1220 SW Morrison Street', NULL, 'Portland', 'OR', '97205', 'United States', NULL, NULL, 30, 'Fits out serviced offices. Slow payer, so chase at day 35.', '{"real estate"}', 'ACTIVE', '2024-07-17 16:16:38.464', '2026-09-17 16:16:39.322', NULL, NULL);


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003kxi7dyng41nr2', 'cmu5qfdzr0037xi7djkemxwps', 'Rent & facilities', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003lxi7dgwelhedm', 'cmu5qfdzr0037xi7djkemxwps', 'Software & subscriptions', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003mxi7dw0fsmsxs', 'cmu5qfdzr0037xi7djkemxwps', 'Travel', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003nxi7dighvljxu', 'cmu5qfdzr0037xi7djkemxwps', 'Marketing', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003oxi7dx34huiof', 'cmu5qfdzr0037xi7djkemxwps', 'Professional services', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003pxi7dqxgtb0nr', 'cmu5qfdzr0037xi7djkemxwps', 'Utilities', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003qxi7dvsxlbg9n', 'cmu5qfdzr0037xi7djkemxwps', 'Equipment', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1a003rxi7dyl57iytd', 'cmu5qfdzr0037xi7djkemxwps', 'Office supplies', NULL, NULL, '2026-09-17 16:16:39.118', '2026-09-17 16:16:39.118', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004axi7dmwpxqc0v', 'cmu5qfe1v003xxi7dlcrq5rip', 'Rent & facilities', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004bxi7d8i65f7ge', 'cmu5qfe1v003xxi7dlcrq5rip', 'Software & subscriptions', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004cxi7dy0klfb3z', 'cmu5qfe1v003xxi7dlcrq5rip', 'Travel', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004dxi7dtrdlmmq2', 'cmu5qfe1v003xxi7dlcrq5rip', 'Marketing', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004exi7d9jmim6pi', 'cmu5qfe1v003xxi7dlcrq5rip', 'Professional services', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004fxi7dm911u60b', 'cmu5qfe1v003xxi7dlcrq5rip', 'Utilities', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004gxi7djdc7qmwc', 'cmu5qfe1v003xxi7dlcrq5rip', 'Equipment', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe3b004hxi7dt6md49u3', 'cmu5qfe1v003xxi7dlcrq5rip', 'Office supplies', NULL, NULL, '2026-09-17 16:16:39.191', '2026-09-17 16:16:39.191', NULL);


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfex800jqxi7dqmra88y5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6g005wxi7dii6bekpm', 'PRJ-LUMEN-01', 'Lumen Health, Mission Bay clinic refit', 'Full furniture package for a 42-desk clinical admin floor, phased over two weekends.', 'ACTIVE', '2026-06-17 16:16:38.464', '2026-11-17 16:16:38.464', 96000.00, 48806.40, 'GHS', 62, NULL, '2026-09-17 16:16:40.268', '2026-09-17 16:16:40.268', NULL);
INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexd00juxi7dtm1vq7t9', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6u0062xi7de4xegtki', 'PRJ-ASTER-01', 'Aster Biotech, Torrey Pines office expansion', 'New 28-person office adjacent to the lab, including acoustic treatment and two phone booths.', 'ACTIVE', '2026-08-17 16:16:38.464', '2027-01-17 16:16:38.464', 64000.00, 17843.20, 'GHS', 34, NULL, '2026-09-17 16:16:40.273', '2026-09-17 16:16:40.273', NULL);
INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexh00jyxi7ddv0o42kj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6k005yxi7dheo9lpoa', 'PRJ-COBRE-01', 'Cobre Coffee, East 6th flagship', 'Back-of-house office and staff room fitout alongside the new roastery build.', 'COMPLETED', '2026-02-17 16:16:38.464', '2026-07-17 16:16:38.464', 28500.00, 23370.00, 'GHS', 100, NULL, '2026-09-17 16:16:40.277', '2026-09-17 16:16:40.277', NULL);


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeqn00gfxi7daqvqvvxj', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00001', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, quarterly', 'Warehouse rent, quarterly, recorded from supplier documentation.', 8400.00, 840.00, 9240.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-05 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-05 00:00:00', '2026-09-17 16:16:40.031', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeqv00gixi7d4k2d0k7x', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00002', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls', 'Delivery van fuel and tolls, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-09-12 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-12 00:00:00', '2026-09-17 16:16:40.039', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfer300glxi7dvuhxthxx', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00003', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats)', 'Design software licences (5 seats), recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-29 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-29 00:00:00', '2026-09-17 16:16:40.047', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfera00goxi7d36t83r4t', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00004', 'cmu5qfe1a003nxi7dighvljxu', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Trade show stand at Workspace Expo', 'Trade show stand at Workspace Expo, recorded from supplier documentation.', 3250.00, 325.00, 3575.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-21 00:00:00', 'Workspace Expo Ltd.', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-21 00:00:00', '2026-09-17 16:16:40.054', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfern00grxi7dldqtzvt4', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00005', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity', 'Warehouse electricity, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-09 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-09 00:00:00', '2026-09-17 16:16:40.067', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qferv00guxi7dxa8hv71z', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00006', 'cmu5qfe1a003qxi7dvsxlbg9n', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Forklift annual service', 'Forklift annual service, recorded from supplier documentation.', 1180.00, 118.00, 1298.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-14 00:00:00', 'Halton Materials Handling', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-14 00:00:00', '2026-09-17 16:16:40.075', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfes200gxxi7dkgx7za5t', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00007', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer', 'Accountancy retainer, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-02 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-02 00:00:00', '2026-09-17 16:16:40.082', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfes900h0xi7d9zjnyvth', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00008', 'cmu5qfe1a003rxi7dyl57iytd', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Packing materials and pallets', 'Packing materials and pallets, recorded from supplier documentation.', 398.70, 39.87, 438.57, 'GHS', 'CARD', 'APPROVED', '2026-09-14 00:00:00', 'Crate & Wrap Supplies', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-14 00:00:00', '2026-09-17 16:16:40.089', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesg00h3xi7dc5g2ul0z', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00009', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Installer team overnight accommodation', 'Installer team overnight accommodation, recorded from supplier documentation.', 864.00, 86.40, 950.40, 'GHS', 'CARD', 'APPROVED', '2026-08-27 00:00:00', 'Riverside Inn', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-27 00:00:00', '2026-09-17 16:16:40.096', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesn00h6xi7dsw79hms5', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00010', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Liability insurance premium', 'Liability insurance premium, recorded from supplier documentation.', 2240.00, 224.00, 2464.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-03 00:00:00', 'Ashworth Commercial Insurance', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-03 00:00:00', '2026-09-17 16:16:40.103', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesv00h9xi7depuprkup', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00011', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, current month', 'Warehouse rent, current month, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-31 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-31 00:00:00', '2026-09-17 16:16:40.111', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfet100hcxi7d6m47mc6h', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00012', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats), current month', 'Design software licences (5 seats), current month, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-09-02 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-02 00:00:00', '2026-09-17 16:16:40.117', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfet700hfxi7dxwxl2ztz', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00013', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity, current month', 'Warehouse electricity, current month, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-06 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-06 00:00:00', '2026-09-17 16:16:40.123', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfetd00hixi7d8dhzk56u', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00014', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer, current month', 'Accountancy retainer, current month, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-04 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-04 00:00:00', '2026-09-17 16:16:40.129', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeti00hlxi7d7cwq4w8s', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00015', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls, current month', 'Delivery van fuel and tolls, current month, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-09-02 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-02 00:00:00', '2026-09-17 16:16:40.134', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeto00hoxi7dthw9660n', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00016', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, 1 month ago', 'Warehouse rent, 1 month ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-10 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-10 00:00:00', '2026-09-17 16:16:40.14', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfets00hrxi7dj2v01xyx', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00017', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats), 1 month ago', 'Design software licences (5 seats), 1 month ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-07 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-07 00:00:00', '2026-09-17 16:16:40.144', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfetx00huxi7d3bprddq8', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00018', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity, 1 month ago', 'Warehouse electricity, 1 month ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-02 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-02 00:00:00', '2026-09-17 16:16:40.149', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeu200hxxi7drxp57cda', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00019', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer, 1 month ago', 'Accountancy retainer, 1 month ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-01 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-01 00:00:00', '2026-09-17 16:16:40.154', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeu600i0xi7dnb3edvg8', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00020', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls, 1 month ago', 'Delivery van fuel and tolls, 1 month ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-08-16 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-16 00:00:00', '2026-09-17 16:16:40.158', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeub00i3xi7dwf79arxh', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00021', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, 2 months ago', 'Warehouse rent, 2 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-06 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-06 00:00:00', '2026-09-17 16:16:40.163', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeug00i6xi7dz34p5ni8', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00022', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats), 2 months ago', 'Design software licences (5 seats), 2 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-07-04 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-04 00:00:00', '2026-09-17 16:16:40.168', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeul00i9xi7d2yavbw0f', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00023', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity, 2 months ago', 'Warehouse electricity, 2 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-13 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-13 00:00:00', '2026-09-17 16:16:40.173', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeuq00icxi7do4rj8os0', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00024', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer, 2 months ago', 'Accountancy retainer, 2 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-03 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-03 00:00:00', '2026-09-17 16:16:40.178', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeuv00ifxi7dnp5ahpti', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00025', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls, 2 months ago', 'Delivery van fuel and tolls, 2 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-07-07 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-07 00:00:00', '2026-09-17 16:16:40.183', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfev000iixi7d8iwuxa92', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00026', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, 3 months ago', 'Warehouse rent, 3 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-03 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-03 00:00:00', '2026-09-17 16:16:40.188', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfev500ilxi7ddyq77j8q', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00027', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats), 3 months ago', 'Design software licences (5 seats), 3 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-05-31 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-31 00:00:00', '2026-09-17 16:16:40.193', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevb00ioxi7d5xdhl8b3', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00028', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity, 3 months ago', 'Warehouse electricity, 3 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-11 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-11 00:00:00', '2026-09-17 16:16:40.199', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevg00irxi7di5uqmkk7', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00029', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer, 3 months ago', 'Accountancy retainer, 3 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-07 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-07 00:00:00', '2026-09-17 16:16:40.204', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevm00iuxi7dzfqmhl8y', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00030', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls, 3 months ago', 'Delivery van fuel and tolls, 3 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-06-02 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-02 00:00:00', '2026-09-17 16:16:40.21', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevr00ixxi7dgyw5isl3', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00031', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, 4 months ago', 'Warehouse rent, 4 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-13 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-13 00:00:00', '2026-09-17 16:16:40.215', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevw00j0xi7d2cu0oumg', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00032', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats), 4 months ago', 'Design software licences (5 seats), 4 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-05-07 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-07 00:00:00', '2026-09-17 16:16:40.22', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfew100j3xi7ds9oygbf7', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00033', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity, 4 months ago', 'Warehouse electricity, 4 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-10 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-10 00:00:00', '2026-09-17 16:16:40.225', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfew600j6xi7d4g208s2b', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00034', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer, 4 months ago', 'Accountancy retainer, 4 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-16 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-16 00:00:00', '2026-09-17 16:16:40.23', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewb00j9xi7dzqtrw4l0', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00035', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls, 4 months ago', 'Delivery van fuel and tolls, 4 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-05-03 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-03 00:00:00', '2026-09-17 16:16:40.235', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewg00jcxi7dndlq8abc', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00036', 'cmu5qfe1a003kxi7dyng41nr2', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse rent, 5 months ago', 'Warehouse rent, 5 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-18 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-18 00:00:00', '2026-09-17 16:16:40.24', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewl00jfxi7dtxhyy79u', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00037', 'cmu5qfe1a003lxi7dgwelhedm', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Design software licences (5 seats), 5 months ago', 'Design software licences (5 seats), 5 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-04-16 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-16 00:00:00', '2026-09-17 16:16:40.245', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewq00jixi7d7753jn6t', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00038', 'cmu5qfe1a003pxi7dqxgtb0nr', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Warehouse electricity, 5 months ago', 'Warehouse electricity, 5 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-16 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-16 00:00:00', '2026-09-17 16:16:40.25', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewv00jlxi7d4v05qmxe', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00039', 'cmu5qfe1a003oxi7dx34huiof', NULL, NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'Accountancy retainer, 5 months ago', 'Accountancy retainer, 5 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-11 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-11 00:00:00', '2026-09-17 16:16:40.255', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfex100joxi7dh9o80r5h', 'cmu5qfdzr0037xi7djkemxwps', 'EXP-2026-00040', 'cmu5qfe1a003mxi7dw0fsmsxs', NULL, NULL, 'cmu5qfe18003jxi7dc88nh70f', 'Delivery van fuel and tolls, 5 months ago', 'Delivery van fuel and tolls, 5 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-04-11 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-11 00:00:00', '2026-09-17 16:16:40.261', NULL);


--
-- Data for Name: import_runs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe43004vxi7daaw7wkcf', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'STOCK_IN', 136.000, 136.000, 412.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.219');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe47004xxi7d6drvoz72', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe46004wxi7dzsbk6yl3', 'STOCK_IN', 164.000, 164.000, 378.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.223');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe4b004zxi7d7clqaytp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe49004yxi7dtni24pdo', 'STOCK_IN', 32.000, 32.000, 960.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.227');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe4h0051xi7d07gq1qk8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4d0050xi7dxa7k9i8v', 'STOCK_IN', 24.000, 24.000, 246.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.233');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe4l0053xi7dtw60dpqb', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'STOCK_IN', 248.000, 248.000, 218.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.237');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe4o0055xi7dexxmglwu', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'STOCK_IN', 112.000, 112.000, 254.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.24');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe4s0057xi7dgv4dkt5f', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4q0056xi7d7ilrhobv', 'STOCK_IN', 12.000, 12.000, 132.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.244');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe4w0059xi7dypc7kq3f', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4u0058xi7do392h6fr', 'STOCK_IN', 20.000, 20.000, 640.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.248');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe51005bxi7ddwsvd9ir', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4z005axi7dl1bjteys', 'STOCK_IN', 296.000, 296.000, 88.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.253');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe59005dxi7dm01sapc8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe57005cxi7d5gyzpj4n', 'STOCK_IN', 44.000, 44.000, 470.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.261');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe5d005fxi7ddrzya49k', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5c005exi7dx1fv80s5', 'STOCK_IN', 76.000, 76.000, 156.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.265');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe5h005hxi7dc1r7fxl8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5f005gxi7d65bfsb6g', 'STOCK_IN', 352.000, 352.000, 62.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.269');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe5m005jxi7di14bzu2o', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5k005ixi7dip14tjcb', 'STOCK_IN', 840.000, 840.000, 44.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.274');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe5q005lxi7dnaja7hzh', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5o005kxi7dtn5cieaj', 'STOCK_IN', 96.000, 96.000, 58.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.278');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe5t005nxi7dhxzzhu41', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5r005mxi7dqttogrcw', 'STOCK_IN', 8.000, 8.000, 3150.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.281');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe5w005pxi7d03mgammr', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5u005oxi7dwggqerb0', 'STOCK_IN', 520.000, 520.000, 41.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.284');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe63005rxi7d88ea2p2t', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'STOCK_IN', 384.000, 384.000, 22.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.291');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe6a005txi7dmsfs8z5o', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'STOCK_IN', 580.000, 580.000, 17.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 16:16:38.464', NULL, '2026-09-17 16:16:39.298');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe9m007vxi7dpj0eetfz', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -5.000, 575.000, NULL, 'INV-2026-00001', 'invoice', 'cmu5qfe9e007pxi7denfuoelb', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 16:16:39.418');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe9q007wxi7dnbbwbv7u', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -11.000, 237.000, NULL, 'INV-2026-00001', 'invoice', 'cmu5qfe9e007pxi7denfuoelb', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 16:16:39.422');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe9u007xxi7deei1dgok', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe49004yxi7dtni24pdo', 'SALE', -13.000, 19.000, NULL, 'INV-2026-00001', 'invoice', 'cmu5qfe9e007pxi7denfuoelb', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 16:16:39.426');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfe9x007yxi7diz7uixn8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4q0056xi7d7ilrhobv', 'SALE', -2.000, 10.000, NULL, 'INV-2026-00001', 'invoice', 'cmu5qfe9e007pxi7denfuoelb', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 16:16:39.429');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeag0087xi7dswdk8l4c', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe46004wxi7dzsbk6yl3', 'SALE', -13.000, 151.000, NULL, 'INV-2026-00002', 'invoice', 'cmu5qfeac0083xi7dt0jtb2m4', 'Sold on INV-2026-00002', '2026-04-04 00:00:00', NULL, '2026-09-17 16:16:39.448');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeai0088xi7dxc2pjgzr', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5k005ixi7dip14tjcb', 'SALE', -5.000, 835.000, NULL, 'INV-2026-00002', 'invoice', 'cmu5qfeac0083xi7dt0jtb2m4', 'Sold on INV-2026-00002', '2026-04-04 00:00:00', NULL, '2026-09-17 16:16:39.45');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeb1008hxi7d2i5sr0ss', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe57005cxi7d5gyzpj4n', 'SALE', -9.000, 35.000, NULL, 'INV-2026-00003', 'invoice', 'cmu5qfeaw008dxi7d4jv5kmnp', 'Sold on INV-2026-00003', '2026-04-20 00:00:00', NULL, '2026-09-17 16:16:39.469');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeb5008ixi7dp2uph03n', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -6.000, 231.000, NULL, 'INV-2026-00003', 'invoice', 'cmu5qfeaw008dxi7d4jv5kmnp', 'Sold on INV-2026-00003', '2026-04-20 00:00:00', NULL, '2026-09-17 16:16:39.473');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfebl008txi7dxhkx6xay', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe46004wxi7dzsbk6yl3', 'SALE', -2.000, 149.000, NULL, 'INV-2026-00004', 'invoice', 'cmu5qfebh008nxi7deh53x5iu', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 16:16:39.489');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfebo008uxi7dqeeaz3qg', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe57005cxi7d5gyzpj4n', 'SALE', -12.000, 23.000, NULL, 'INV-2026-00004', 'invoice', 'cmu5qfebh008nxi7deh53x5iu', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 16:16:39.492');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfebr008vxi7d7mosslp5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4q0056xi7d7ilrhobv', 'SALE', -2.000, 8.000, NULL, 'INV-2026-00004', 'invoice', 'cmu5qfebh008nxi7deh53x5iu', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 16:16:39.495');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfebv008wxi7dvwfth35l', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'SALE', -14.000, 122.000, NULL, 'INV-2026-00004', 'invoice', 'cmu5qfebh008nxi7deh53x5iu', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 16:16:39.499');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfech0097xi7dp4gt0fas', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe46004wxi7dzsbk6yl3', 'SALE', -3.000, 146.000, NULL, 'INV-2026-00005', 'invoice', 'cmu5qfeca0091xi7dvoal6wma', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 16:16:39.521');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeck0098xi7d96csazgx', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4u0058xi7do392h6fr', 'SALE', -9.000, 11.000, NULL, 'INV-2026-00005', 'invoice', 'cmu5qfeca0091xi7dvoal6wma', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 16:16:39.524');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfecn0099xi7dlsh4cgk0', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe57005cxi7d5gyzpj4n', 'SALE', -12.000, 11.000, NULL, 'INV-2026-00005', 'invoice', 'cmu5qfeca0091xi7dvoal6wma', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 16:16:39.527');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfect009axi7d3netu9sl', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -4.000, 380.000, NULL, 'INV-2026-00005', 'invoice', 'cmu5qfeca0091xi7dvoal6wma', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 16:16:39.533');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeda009jxi7d0qbu2ypz', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5u005oxi7dwggqerb0', 'SALE', -14.000, 506.000, NULL, 'INV-2026-00006', 'invoice', 'cmu5qfed6009fxi7ddr2fch5g', 'Sold on INV-2026-00006', '2026-05-12 00:00:00', NULL, '2026-09-17 16:16:39.55');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfedd009kxi7dlrck5xn5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -14.000, 217.000, NULL, 'INV-2026-00006', 'invoice', 'cmu5qfed6009fxi7ddr2fch5g', 'Sold on INV-2026-00006', '2026-05-12 00:00:00', NULL, '2026-09-17 16:16:39.553');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfedw009txi7d61l79zlu', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -8.000, 372.000, NULL, 'INV-2026-00007', 'invoice', 'cmu5qfedq009pxi7dj512f3po', 'Sold on INV-2026-00007', '2026-06-03 00:00:00', NULL, '2026-09-17 16:16:39.572');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfedz009uxi7dfmd321ni', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'SALE', -7.000, 105.000, NULL, 'INV-2026-00007', 'invoice', 'cmu5qfedq009pxi7dj512f3po', 'Sold on INV-2026-00007', '2026-06-03 00:00:00', NULL, '2026-09-17 16:16:39.575');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeeg00a4xi7dxqlwcqd8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -12.000, 563.000, NULL, 'INV-2026-00008', 'invoice', 'cmu5qfeec009zxi7d7qlwprdi', 'Sold on INV-2026-00008', '2026-06-05 00:00:00', NULL, '2026-09-17 16:16:39.592');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeej00a5xi7d8txeed1l', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4q0056xi7d7ilrhobv', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00008', 'invoice', 'cmu5qfeec009zxi7d7qlwprdi', 'Sold on INV-2026-00008', '2026-06-05 00:00:00', NULL, '2026-09-17 16:16:39.595');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeem00a6xi7dpadef0dd', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -4.000, 368.000, NULL, 'INV-2026-00008', 'invoice', 'cmu5qfeec009zxi7d7qlwprdi', 'Sold on INV-2026-00008', '2026-06-05 00:00:00', NULL, '2026-09-17 16:16:39.598');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfef400agxi7d8jsp6wrp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -12.000, 356.000, NULL, 'INV-2026-00009', 'invoice', 'cmu5qfeez00abxi7d6qhaa1yf', 'Sold on INV-2026-00009', '2026-06-05 00:00:00', NULL, '2026-09-17 16:16:39.616');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfef800ahxi7dm84odwx8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -10.000, 553.000, NULL, 'INV-2026-00009', 'invoice', 'cmu5qfeez00abxi7d6qhaa1yf', 'Sold on INV-2026-00009', '2026-06-05 00:00:00', NULL, '2026-09-17 16:16:39.62');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfefa00aixi7d5hbbu3aj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'SALE', -13.000, 109.000, NULL, 'INV-2026-00009', 'invoice', 'cmu5qfeez00abxi7d6qhaa1yf', 'Sold on INV-2026-00009', '2026-06-05 00:00:00', NULL, '2026-09-17 16:16:39.622');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfefr00asxi7dh522c2uj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -10.000, 207.000, NULL, 'INV-2026-00010', 'invoice', 'cmu5qfefm00anxi7dktvq1a5r', 'Sold on INV-2026-00010', '2026-06-15 00:00:00', NULL, '2026-09-17 16:16:39.639');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeft00atxi7dkxkv6q8g', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5f005gxi7d65bfsb6g', 'SALE', -6.000, 346.000, NULL, 'INV-2026-00010', 'invoice', 'cmu5qfefm00anxi7dktvq1a5r', 'Sold on INV-2026-00010', '2026-06-15 00:00:00', NULL, '2026-09-17 16:16:39.641');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfefv00auxi7d3ilgfbmh', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4u0058xi7do392h6fr', 'SALE', -11.000, 0.000, NULL, 'INV-2026-00010', 'invoice', 'cmu5qfefm00anxi7dktvq1a5r', 'Sold on INV-2026-00010', '2026-06-15 00:00:00', NULL, '2026-09-17 16:16:39.643');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfege00b5xi7d6susez8g', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -7.000, 546.000, NULL, 'INV-2026-00011', 'invoice', 'cmu5qfeg800azxi7d74kdnsa7', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 16:16:39.662');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfegh00b6xi7d7xtvsvav', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -12.000, 344.000, NULL, 'INV-2026-00011', 'invoice', 'cmu5qfeg800azxi7d74kdnsa7', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 16:16:39.665');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfegj00b7xi7dgz62zj3k', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5c005exi7dx1fv80s5', 'SALE', -5.000, 71.000, NULL, 'INV-2026-00011', 'invoice', 'cmu5qfeg800azxi7d74kdnsa7', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 16:16:39.667');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfegl00b8xi7dilg1zn1f', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5f005gxi7d65bfsb6g', 'SALE', -5.000, 341.000, NULL, 'INV-2026-00011', 'invoice', 'cmu5qfeg800azxi7d74kdnsa7', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 16:16:39.669');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeh200bjxi7dwfjh1wxr', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5u005oxi7dwggqerb0', 'SALE', -14.000, 492.000, NULL, 'INV-2026-00012', 'invoice', 'cmu5qfegx00bdxi7d0l73uq4e', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 16:16:39.686');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeh500bkxi7dcxnn6u89', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe49004yxi7dtni24pdo', 'SALE', -11.000, 8.000, NULL, 'INV-2026-00012', 'invoice', 'cmu5qfegx00bdxi7d0l73uq4e', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 16:16:39.689');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeh800blxi7do8xsiefi', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'SALE', -11.000, 94.000, NULL, 'INV-2026-00012', 'invoice', 'cmu5qfegx00bdxi7d0l73uq4e', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 16:16:39.692');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfehb00bmxi7d1x7s4zau', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -11.000, 535.000, NULL, 'INV-2026-00012', 'invoice', 'cmu5qfegx00bdxi7d0l73uq4e', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 16:16:39.695');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfehv00bvxi7dxjwoftxc', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5u005oxi7dwggqerb0', 'SALE', -8.000, 484.000, NULL, 'INV-2026-00013', 'invoice', 'cmu5qfehp00brxi7ds3d8jv6u', 'Sold on INV-2026-00013', '2026-07-04 00:00:00', NULL, '2026-09-17 16:16:39.715');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfehy00bwxi7dkob4ldq4', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe57005cxi7d5gyzpj4n', 'SALE', -11.000, 0.000, NULL, 'INV-2026-00013', 'invoice', 'cmu5qfehp00brxi7ds3d8jv6u', 'Sold on INV-2026-00013', '2026-07-04 00:00:00', NULL, '2026-09-17 16:16:39.718');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeig00c5xi7dw70h4b4j', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe49004yxi7dtni24pdo', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00014', 'invoice', 'cmu5qfeic00c1xi7daoalnziq', 'Sold on INV-2026-00014', '2026-07-06 00:00:00', NULL, '2026-09-17 16:16:39.736');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeij00c6xi7d59xrax0b', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'SALE', -13.000, 81.000, NULL, 'INV-2026-00014', 'invoice', 'cmu5qfeic00c1xi7daoalnziq', 'Sold on INV-2026-00014', '2026-07-06 00:00:00', NULL, '2026-09-17 16:16:39.739');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfej200cgxi7d95awbumq', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5c005exi7dx1fv80s5', 'SALE', -9.000, 62.000, NULL, 'INV-2026-00015', 'invoice', 'cmu5qfeix00cbxi7dqa1y0e7j', 'Sold on INV-2026-00015', '2026-07-14 00:00:00', NULL, '2026-09-17 16:16:39.758');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfej500chxi7du5joqpk6', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4z005axi7dl1bjteys', 'SALE', -9.000, 287.000, NULL, 'INV-2026-00015', 'invoice', 'cmu5qfeix00cbxi7dqa1y0e7j', 'Sold on INV-2026-00015', '2026-07-14 00:00:00', NULL, '2026-09-17 16:16:39.761');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfej800cixi7dn5zmt4a1', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe46004wxi7dzsbk6yl3', 'SALE', -10.000, 136.000, NULL, 'INV-2026-00015', 'invoice', 'cmu5qfeix00cbxi7dqa1y0e7j', 'Sold on INV-2026-00015', '2026-07-14 00:00:00', NULL, '2026-09-17 16:16:39.764');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeju00csxi7d4z235zec', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -8.000, 336.000, NULL, 'INV-2026-00016', 'invoice', 'cmu5qfejo00cnxi7djhxdoaki', 'Sold on INV-2026-00016', '2026-07-30 00:00:00', NULL, '2026-09-17 16:16:39.786');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfejx00ctxi7dk7ak8iou', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5k005ixi7dip14tjcb', 'SALE', -4.000, 831.000, NULL, 'INV-2026-00016', 'invoice', 'cmu5qfejo00cnxi7djhxdoaki', 'Sold on INV-2026-00016', '2026-07-30 00:00:00', NULL, '2026-09-17 16:16:39.789');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfejz00cuxi7dmrpft981', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'SALE', -12.000, 97.000, NULL, 'INV-2026-00016', 'invoice', 'cmu5qfejo00cnxi7djhxdoaki', 'Sold on INV-2026-00016', '2026-07-30 00:00:00', NULL, '2026-09-17 16:16:39.791');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfekl00d3xi7dx6inn261', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'SALE', -11.000, 86.000, NULL, 'INV-2026-00017', 'invoice', 'cmu5qfekf00czxi7dpp88xlzf', 'Sold on INV-2026-00017', '2026-08-02 00:00:00', NULL, '2026-09-17 16:16:39.813');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeko00d4xi7d3kf4hg8n', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -2.000, 205.000, NULL, 'INV-2026-00017', 'invoice', 'cmu5qfekf00czxi7dpp88xlzf', 'Sold on INV-2026-00017', '2026-08-02 00:00:00', NULL, '2026-09-17 16:16:39.816');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfel500dexi7d27qbe279', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5f005gxi7d65bfsb6g', 'SALE', -2.000, 339.000, NULL, 'INV-2026-00018', 'invoice', 'cmu5qfel000d9xi7d99nbufls', 'Sold on INV-2026-00018', '2026-08-09 00:00:00', NULL, '2026-09-17 16:16:39.833');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfel800dfxi7dvvi1kk4l', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5r005mxi7dqttogrcw', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00018', 'invoice', 'cmu5qfel000d9xi7d99nbufls', 'Sold on INV-2026-00018', '2026-08-09 00:00:00', NULL, '2026-09-17 16:16:39.836');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfela00dgxi7dnzeav2m3', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'SALE', -2.000, 84.000, NULL, 'INV-2026-00018', 'invoice', 'cmu5qfel000d9xi7d99nbufls', 'Sold on INV-2026-00018', '2026-08-09 00:00:00', NULL, '2026-09-17 16:16:39.838');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfelq00doxi7dp7nx1ge9', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4d0050xi7dxa7k9i8v', 'SALE', -5.000, 19.000, NULL, 'INV-2026-00019', 'invoice', 'cmu5qfelm00dlxi7dj70mf7oh', 'Sold on INV-2026-00019', '2026-08-18 00:00:00', NULL, '2026-09-17 16:16:39.854');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfemc00e2xi7d3o23lds3', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5k005ixi7dip14tjcb', 'SALE', -10.000, 821.000, NULL, 'INV-2026-00021', 'invoice', 'cmu5qfem800dxxi7d7loqfdxe', 'Sold on INV-2026-00021', '2026-09-03 00:00:00', NULL, '2026-09-17 16:16:39.876');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeme00e3xi7ddknb9uv1', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5u005oxi7dwggqerb0', 'SALE', -4.000, 480.000, NULL, 'INV-2026-00021', 'invoice', 'cmu5qfem800dxxi7d7loqfdxe', 'Sold on INV-2026-00021', '2026-09-03 00:00:00', NULL, '2026-09-17 16:16:39.878');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfemh00e4xi7dvw1axxu2', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'SALE', -7.000, 74.000, NULL, 'INV-2026-00021', 'invoice', 'cmu5qfem800dxxi7d7loqfdxe', 'Sold on INV-2026-00021', '2026-09-03 00:00:00', NULL, '2026-09-17 16:16:39.881');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfems00eaxi7di2tp6odp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5y005qxi7dmr1135qk', 'SALE', -3.000, 333.000, NULL, 'INV-2026-00022', 'invoice', 'cmu5qfemo00e6xi7d4h5tje75', 'Sold on INV-2026-00022', '2026-09-04 00:00:00', NULL, '2026-09-17 16:16:39.892');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfemv00ebxi7de1n0ot5c', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'SALE', -6.000, 68.000, NULL, 'INV-2026-00022', 'invoice', 'cmu5qfemo00e6xi7d4h5tje75', 'Sold on INV-2026-00022', '2026-09-04 00:00:00', NULL, '2026-09-17 16:16:39.895');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfena00elxi7dfq6x66a5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4z005axi7dl1bjteys', 'SALE', -7.000, 280.000, NULL, 'INV-2026-00023', 'invoice', 'cmu5qfen600egxi7di9khl9zb', 'Sold on INV-2026-00023', '2026-09-06 00:00:00', NULL, '2026-09-17 16:16:39.91');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfend00emxi7d8ewfbk0x', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe46004wxi7dzsbk6yl3', 'SALE', -4.000, 132.000, NULL, 'INV-2026-00023', 'invoice', 'cmu5qfen600egxi7di9khl9zb', 'Sold on INV-2026-00023', '2026-09-06 00:00:00', NULL, '2026-09-17 16:16:39.913');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfenf00enxi7dpvxr86c7', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -5.000, 530.000, NULL, 'INV-2026-00023', 'invoice', 'cmu5qfen600egxi7di9khl9zb', 'Sold on INV-2026-00023', '2026-09-06 00:00:00', NULL, '2026-09-17 16:16:39.915');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfenw00eyxi7dvwzbya55', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5c005exi7dx1fv80s5', 'SALE', -5.000, 57.000, NULL, 'INV-2026-00025', 'invoice', 'cmu5qfenr00euxi7dq5usropr', 'Sold on INV-2026-00025', '2026-09-09 00:00:00', NULL, '2026-09-17 16:16:39.932');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfenz00ezxi7d1mzlrzog', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe41004uxi7ddcursik2', 'SALE', -5.000, 79.000, NULL, 'INV-2026-00025', 'invoice', 'cmu5qfenr00euxi7dq5usropr', 'Sold on INV-2026-00025', '2026-09-09 00:00:00', NULL, '2026-09-17 16:16:39.935');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeof00f8xi7drhvcwu9i', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe64005sxi7d0kk6zzww', 'SALE', -13.000, 517.000, NULL, 'INV-2026-00026', 'invoice', 'cmu5qfeob00f4xi7d4ss8nqwm', 'Sold on INV-2026-00026', '2026-09-11 00:00:00', NULL, '2026-09-17 16:16:39.951');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeoh00f9xi7dxqroe1su', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -2.000, 203.000, NULL, 'INV-2026-00026', 'invoice', 'cmu5qfeob00f4xi7d4ss8nqwm', 'Sold on INV-2026-00026', '2026-09-11 00:00:00', NULL, '2026-09-17 16:16:39.953');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeox00fixi7deff7pzff', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4m0054xi7ds0ibubz5', 'SALE', -9.000, 59.000, NULL, 'INV-2026-00027', 'invoice', 'cmu5qfeos00fexi7dk2bv8eo8', 'Sold on INV-2026-00027', '2026-09-12 00:00:00', NULL, '2026-09-17 16:16:39.969');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfep000fjxi7d9bstg8pb', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4d0050xi7dxa7k9i8v', 'SALE', -11.000, 8.000, NULL, 'INV-2026-00027', 'invoice', 'cmu5qfeos00fexi7dk2bv8eo8', 'Sold on INV-2026-00027', '2026-09-12 00:00:00', NULL, '2026-09-17 16:16:39.972');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfepf00fsxi7dnc7q652r', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4d0050xi7dxa7k9i8v', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00028', 'invoice', 'cmu5qfepb00foxi7dwck7aw2n', 'Sold on INV-2026-00028', '2026-09-14 00:00:00', NULL, '2026-09-17 16:16:39.987');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeph00ftxi7dkvrixou4', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5k005ixi7dip14tjcb', 'SALE', -11.000, 810.000, NULL, 'INV-2026-00028', 'invoice', 'cmu5qfepb00foxi7dwck7aw2n', 'Sold on INV-2026-00028', '2026-09-14 00:00:00', NULL, '2026-09-17 16:16:39.989');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfepq00g0xi7dcusreffx', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe4j0052xi7d3ktapiml', 'SALE', -10.000, 193.000, NULL, 'INV-2026-00029', 'invoice', 'cmu5qfepm00fvxi7d0n73mgtd', 'Sold on INV-2026-00029', '2026-09-15 00:00:00', NULL, '2026-09-17 16:16:39.998');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfept00g1xi7dgw5gv4pz', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5f005gxi7d65bfsb6g', 'SALE', -9.000, 330.000, NULL, 'INV-2026-00029', 'invoice', 'cmu5qfepm00fvxi7d0n73mgtd', 'Sold on INV-2026-00029', '2026-09-15 00:00:00', NULL, '2026-09-17 16:16:40.001');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfepv00g2xi7dam4cbgte', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5c005exi7dx1fv80s5', 'SALE', -11.000, 46.000, NULL, 'INV-2026-00029', 'invoice', 'cmu5qfepm00fvxi7d0n73mgtd', 'Sold on INV-2026-00029', '2026-09-15 00:00:00', NULL, '2026-09-17 16:16:40.003');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu5qfeqb00gaxi7d6qqnjggp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe5u005oxi7dwggqerb0', 'SALE', -14.000, 466.000, NULL, 'INV-2026-00030', 'invoice', 'cmu5qfeq700g7xi7d9kry6ibd', 'Sold on INV-2026-00030', '2026-09-17 00:00:00', NULL, '2026-09-17 16:16:40.019');


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe7n006cxi7dwfja7wl5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6g005wxi7dii6bekpm', 'QTE-2026-00001', 'ACCEPTED', '2026-07-09 16:16:38.464', '2026-08-08 16:16:38.464', 'GHS', 4896.00, 'PERCENTAGE', 5.00, 242.23, 460.24, 5062.66, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-10 16:16:38.464', '2026-07-14 16:16:38.464', NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-09 16:16:38.464', '2026-09-17 16:16:39.347', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe7v006jxi7d5qya2e64', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6i005xxi7dj4aemiz1', 'QTE-2026-00002', 'SENT', '2026-08-01 16:16:38.464', '2026-08-31 16:16:38.464', 'GHS', 6230.00, 'PERCENTAGE', 0.00, 0.00, 606.09, 6667.04, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-02 16:16:38.464', NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-01 16:16:38.464', '2026-09-17 16:16:39.355', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe83006pxi7dixzu2xle', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6k005yxi7dheo9lpoa', 'QTE-2026-00003', 'DRAFT', '2026-08-22 16:16:38.464', '2026-09-21 16:16:38.464', 'GHS', 3890.00, 'PERCENTAGE', 0.00, 0.00, 389.00, 4279.00, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', NULL, NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-22 16:16:38.464', '2026-09-17 16:16:39.363', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe8a006vxi7dahvc922w', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6m005zxi7djbndzaq0', 'QTE-2026-00004', 'REJECTED', '2026-07-15 16:16:38.464', '2026-08-14 16:16:38.464', 'GHS', 17225.00, 'PERCENTAGE', 5.00, 856.26, 1626.90, 17895.89, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-16 16:16:38.464', NULL, '2026-07-21 16:16:38.464', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-15 16:16:38.464', '2026-09-17 16:16:39.37', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe8h0070xi7d9ztchxue', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6q0060xi7dh0m5fxv6', 'QTE-2026-00005', 'SENT', '2026-09-09 16:16:38.464', '2026-10-09 16:16:38.464', 'GHS', 18096.00, 'PERCENTAGE', 0.00, 0.00, 1769.49, 19464.39, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-09-10 16:16:38.464', NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-09 16:16:38.464', '2026-09-17 16:16:39.377', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe8o0077xi7davql731h', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6s0061xi7dci8v10qe', 'QTE-2026-00006', 'EXPIRED', '2026-07-31 16:16:38.464', '2026-08-30 16:16:38.464', 'GHS', 26842.00, 'PERCENTAGE', 0.00, 0.00, 2684.20, 29526.20, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-01 16:16:38.464', NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-31 16:16:38.464', '2026-09-17 16:16:39.384', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe8v007cxi7dj46ojl3s', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6u0062xi7de4xegtki', 'QTE-2026-00007', 'ACCEPTED', '2026-06-25 16:16:38.464', '2026-07-25 16:16:38.464', 'GHS', 35884.00, 'PERCENTAGE', 5.00, 1792.85, 3406.42, 37470.57, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-06-26 16:16:38.464', '2026-07-04 16:16:38.464', NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-25 16:16:38.464', '2026-09-17 16:16:39.391', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe94007jxi7drt9d1ird', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe6v0063xi7d2u45voj8', 'QTE-2026-00008', 'SENT', '2026-08-09 16:16:38.464', '2026-09-08 16:16:38.464', 'GHS', 26465.00, 'PERCENTAGE', 0.00, 0.00, 2646.50, 29111.50, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-10 16:16:38.464', NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-09 16:16:38.464', '2026-09-17 16:16:39.4', NULL);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe9e007pxi7denfuoelb', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6g005wxi7dii6bekpm', 'INV-2026-00001', 'PAID', '2026-03-25 00:00:00', '2026-04-08 00:00:00', 'GHS', 27587.00, 'PERCENTAGE', 3.00, 788.17, 2548.41, 0.00, 28032.54, 28032.54, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-03-26 00:00:00', '2026-03-27 00:00:00', '2026-04-03 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-03-25 00:00:00', '2026-09-17 16:16:39.41', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeac0083xi7dt0jtb2m4', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6i005xxi7dj4aemiz1', 'INV-2026-00002', 'PAID', '2026-04-04 00:00:00', '2026-05-04 00:00:00', 'GHS', 10877.00, 'PERCENTAGE', 0.00, 0.00, 1087.70, 0.00, 11964.70, 11964.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-04-05 00:00:00', '2026-04-06 00:00:00', '2026-05-02 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-04 00:00:00', '2026-09-17 16:16:39.444', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeaw008dxi7d4jv5kmnp', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6k005yxi7dheo9lpoa', 'INV-2026-00003', 'PAID', '2026-04-20 00:00:00', '2026-05-04 00:00:00', 'GHS', 10874.00, 'PERCENTAGE', 0.00, 0.00, 1075.43, 0.00, 11829.73, 11829.73, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-04-21 00:00:00', '2026-04-22 00:00:00', '2026-05-04 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-04-20 00:00:00', '2026-09-17 16:16:39.464', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfebh008nxi7deh53x5iu', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6m005zxi7djbndzaq0', 'INV-2026-00004', 'PAID', '2026-05-05 00:00:00', '2026-06-04 00:00:00', 'GHS', 22942.00, 'PERCENTAGE', 0.00, 0.00, 2291.71, 0.00, 25208.81, 25208.81, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-05-06 00:00:00', '2026-05-07 00:00:00', '2026-05-16 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-05 00:00:00', '2026-09-17 16:16:39.485', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeca0091xi7dvoal6wma', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6q0060xi7dh0m5fxv6', 'INV-2026-00005', 'PAID', '2026-05-12 00:00:00', '2026-05-26 00:00:00', 'GHS', 23881.00, 'PERCENTAGE', 3.00, 698.12, 2257.25, 0.00, 24829.78, 24829.78, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-05-13 00:00:00', '2026-05-14 00:00:00', '2026-05-22 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-12 00:00:00', '2026-09-17 16:16:39.514', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfed6009fxi7ddr2fch5g', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6s0061xi7dci8v10qe', 'INV-2026-00006', 'PAID', '2026-05-12 00:00:00', '2026-05-26 00:00:00', 'GHS', 8067.00, 'PERCENTAGE', 0.00, 0.00, 773.24, 0.00, 8505.64, 8505.64, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-05-13 00:00:00', '2026-05-14 00:00:00', '2026-05-25 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-05-12 00:00:00', '2026-09-17 16:16:39.546', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfedq009pxi7dj512f3po', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6u0062xi7de4xegtki', 'INV-2026-00007', 'PAID', '2026-06-03 00:00:00', '2026-07-03 00:00:00', 'GHS', 4717.00, 'PERCENTAGE', 0.00, 0.00, 471.70, 0.00, 5188.70, 5188.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-04 00:00:00', '2026-06-05 00:00:00', '2026-06-07 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-03 00:00:00', '2026-09-17 16:16:39.566', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeec009zxi7d7qlwprdi', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6v0063xi7d2u45voj8', 'INV-2026-00008', 'PAID', '2026-06-05 00:00:00', '2026-07-05 00:00:00', 'GHS', 3284.00, 'PERCENTAGE', 0.00, 0.00, 317.54, 0.00, 3492.94, 3492.94, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-06 00:00:00', '2026-06-07 00:00:00', '2026-06-29 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-05 00:00:00', '2026-09-17 16:16:39.588', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeez00abxi7d6qhaa1yf', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6w0064xi7d8qto7xt1', 'INV-2026-00009', 'PAID', '2026-06-05 00:00:00', '2026-06-19 00:00:00', 'GHS', 11742.00, 'PERCENTAGE', 3.00, 351.45, 1136.36, 0.00, 12499.91, 12499.91, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-06-06 00:00:00', '2026-06-07 00:00:00', '2026-06-15 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-05 00:00:00', '2026-09-17 16:16:39.611', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfefm00anxi7dktvq1a5r', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6y0065xi7d5218zaog', 'INV-2026-00010', 'PAID', '2026-06-15 00:00:00', '2026-07-15 00:00:00', 'GHS', 18104.00, 'PERCENTAGE', 0.00, 0.00, 1747.15, 0.00, 19218.65, 19218.65, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-16 00:00:00', '2026-06-17 00:00:00', '2026-06-29 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-15 00:00:00', '2026-09-17 16:16:39.634', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeg800azxi7d74kdnsa7', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6g005wxi7dii6bekpm', 'INV-2026-00011', 'PAID', '2026-06-24 00:00:00', '2026-07-24 00:00:00', 'GHS', 3693.00, 'PERCENTAGE', 0.00, 0.00, 368.11, 0.00, 4049.21, 4049.21, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-25 00:00:00', '2026-06-26 00:00:00', '2026-07-04 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-06-24 00:00:00', '2026-09-17 16:16:39.656', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfegx00bdxi7d0l73uq4e', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6i005xxi7dj4aemiz1', 'INV-2026-00012', 'PAID', '2026-07-03 00:00:00', '2026-07-17 00:00:00', 'GHS', 25416.00, 'PERCENTAGE', 0.00, 0.00, 2423.68, 0.00, 26660.48, 26660.48, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-04 00:00:00', '2026-07-05 00:00:00', '2026-07-06 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-03 00:00:00', '2026-09-17 16:16:39.681', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfehp00brxi7ds3d8jv6u', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6k005yxi7dheo9lpoa', 'INV-2026-00013', 'PAID', '2026-07-04 00:00:00', '2026-07-18 00:00:00', 'GHS', 10807.00, 'PERCENTAGE', 3.00, 324.21, 1048.28, 0.00, 11531.07, 11531.07, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-05 00:00:00', '2026-07-06 00:00:00', '2026-07-10 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-04 00:00:00', '2026-09-17 16:16:39.709', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeic00c1xi7daoalnziq', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6m005zxi7djbndzaq0', 'INV-2026-00014', 'PAID', '2026-07-06 00:00:00', '2026-07-20 00:00:00', 'GHS', 20327.00, 'PERCENTAGE', 0.00, 0.00, 2032.70, 0.00, 22359.70, 22359.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-07 00:00:00', '2026-07-08 00:00:00', '2026-07-17 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-06 00:00:00', '2026-09-17 16:16:39.732', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeix00cbxi7dqa1y0e7j', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6q0060xi7dh0m5fxv6', 'INV-2026-00015', 'PAID', '2026-07-14 00:00:00', '2026-07-28 00:00:00', 'GHS', 12296.00, 'PERCENTAGE', 0.00, 0.00, 1229.60, 0.00, 13525.60, 13525.60, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-15 00:00:00', '2026-07-16 00:00:00', '2026-07-23 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-14 00:00:00', '2026-09-17 16:16:39.753', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfejo00cnxi7djhxdoaki', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6s0061xi7dci8v10qe', 'INV-2026-00016', 'PAID', '2026-07-30 00:00:00', '2026-08-29 00:00:00', 'GHS', 10809.00, 'PERCENTAGE', 0.00, 0.00, 1080.90, 0.00, 11889.90, 11889.90, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-07-31 00:00:00', '2026-08-01 00:00:00', '2026-08-07 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-07-30 00:00:00', '2026-09-17 16:16:39.78', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfekf00czxi7dpp88xlzf', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6u0062xi7de4xegtki', 'INV-2026-00017', 'PAID', '2026-08-02 00:00:00', '2026-09-01 00:00:00', 'GHS', 11037.00, 'PERCENTAGE', 3.00, 318.75, 1030.63, 0.00, 11336.93, 11336.93, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-08-03 00:00:00', '2026-08-04 00:00:00', '2026-08-31 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-02 00:00:00', '2026-09-17 16:16:39.807', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfel000d9xi7d99nbufls', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6v0063xi7d2u45voj8', 'INV-2026-00018', 'PAID', '2026-08-09 00:00:00', '2026-09-08 00:00:00', 'GHS', 44848.00, 'PERCENTAGE', 0.00, 0.00, 4477.31, 0.00, 49250.41, 49250.41, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-08-10 00:00:00', '2026-08-11 00:00:00', '2026-08-12 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-09 00:00:00', '2026-09-17 16:16:39.828', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfelm00dlxi7dj70mf7oh', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6w0064xi7d8qto7xt1', 'INV-2026-00019', 'PAID', '2026-08-18 00:00:00', '2026-09-01 00:00:00', 'GHS', 2841.00, 'PERCENTAGE', 0.00, 0.00, 284.10, 0.00, 3125.10, 3125.10, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-08-19 00:00:00', '2026-08-20 00:00:00', '2026-08-31 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-08-18 00:00:00', '2026-09-17 16:16:39.85', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfem100dtxi7dgf3hv7ey', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6y0065xi7d5218zaog', 'INV-2026-00020', 'DRAFT', '2026-09-01 00:00:00', '2026-09-15 00:00:00', 'GHS', 1484.00, 'PERCENTAGE', 0.00, 0.00, 148.40, 0.00, 1632.40, 0.00, 1632.40, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-01 00:00:00', '2026-09-17 16:16:39.865', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfem800dxxi7d7loqfdxe', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6g005wxi7dii6bekpm', 'INV-2026-00021', 'SENT', '2026-09-03 00:00:00', '2026-09-24 00:00:00', 'GHS', 4985.00, 'PERCENTAGE', 3.00, 149.55, 483.55, 0.00, 5319.00, 0.00, 5319.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 21 days of the invoice date.', NULL, NULL, NULL, '2026-09-04 00:00:00', NULL, NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-03 00:00:00', '2026-09-17 16:16:39.872', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfemo00e6xi7d4h5tje75', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6i005xxi7dj4aemiz1', 'INV-2026-00022', 'PAID', '2026-09-04 00:00:00', '2026-09-18 00:00:00', 'GHS', 3241.00, 'PERCENTAGE', 0.00, 0.00, 324.10, 0.00, 3565.10, 3565.10, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-05 00:00:00', '2026-09-06 00:00:00', '2026-09-07 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-04 00:00:00', '2026-09-17 16:16:39.888', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfen600egxi7di9khl9zb', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6k005yxi7dheo9lpoa', 'INV-2026-00023', 'VIEWED', '2026-09-06 00:00:00', '2026-10-06 00:00:00', 'GHS', 5401.00, 'PERCENTAGE', 0.00, 0.00, 534.33, 0.00, 5877.58, 0.00, 5877.58, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-07 00:00:00', '2026-09-08 00:00:00', NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-06 00:00:00', '2026-09-17 16:16:39.906', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfenk00epxi7dmau4gs3u', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6m005zxi7djbndzaq0', 'INV-2026-00024', 'CANCELLED', '2026-09-07 00:00:00', '2026-10-07 00:00:00', 'GHS', 8428.00, 'PERCENTAGE', 0.00, 0.00, 810.67, 0.00, 8917.37, 0.00, 8917.37, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-08 00:00:00', NULL, NULL, '2026-09-11 00:00:00', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-07 00:00:00', '2026-09-17 16:16:39.92', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfenr00euxi7dq5usropr', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6q0060xi7dh0m5fxv6', 'INV-2026-00025', 'PAID', '2026-09-09 00:00:00', '2026-09-23 00:00:00', 'GHS', 5542.00, 'PERCENTAGE', 3.00, 166.26, 537.57, 0.00, 5913.31, 5913.31, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-10 00:00:00', '2026-09-11 00:00:00', '2026-09-13 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-09 00:00:00', '2026-09-17 16:16:39.927', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeob00f4xi7d4ss8nqwm', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6s0061xi7dci8v10qe', 'INV-2026-00026', 'PARTIALLY_PAID', '2026-09-11 00:00:00', '2026-10-11 00:00:00', 'GHS', 3115.00, 'PERCENTAGE', 0.00, 0.00, 311.50, 0.00, 3426.50, 1370.60, 2055.90, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-12 00:00:00', '2026-09-13 00:00:00', NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-11 00:00:00', '2026-09-17 16:16:39.947', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeos00fexi7dk2bv8eo8', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6u0062xi7de4xegtki', 'INV-2026-00027', 'PAID', '2026-09-12 00:00:00', '2026-10-12 00:00:00', 'GHS', 9906.00, 'PERCENTAGE', 0.00, 0.00, 969.95, 0.00, 10669.40, 10669.40, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-13 00:00:00', '2026-09-14 00:00:00', '2026-09-16 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-12 00:00:00', '2026-09-17 16:16:39.964', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfepb00foxi7dwck7aw2n', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6v0063xi7d2u45voj8', 'INV-2026-00028', 'OVERDUE', '2026-09-14 00:00:00', '2026-09-28 00:00:00', 'GHS', 5984.00, 'PERCENTAGE', 0.00, 0.00, 598.40, 0.00, 6582.40, 0.00, 6582.40, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-15 00:00:00', '2026-09-16 00:00:00', NULL, NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-14 00:00:00', '2026-09-17 16:16:39.983', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfepm00fvxi7d0n73mgtd', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6w0064xi7d8qto7xt1', 'INV-2026-00029', 'PAID', '2026-09-15 00:00:00', '2026-09-29 00:00:00', 'GHS', 9615.00, 'PERCENTAGE', 3.00, 280.86, 908.11, 0.00, 9989.20, 9989.20, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-16 00:00:00', '2026-09-17 00:00:00', '2026-09-18 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-15 00:00:00', '2026-09-17 16:16:39.994', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeq700g7xi7d9kry6ibd', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'cmu5qfe6y0065xi7d5218zaog', 'INV-2026-00030', 'PAID', '2026-09-17 00:00:00', '2026-10-17 00:00:00', 'GHS', 2426.00, 'PERCENTAGE', 0.00, 0.00, 242.60, 0.00, 2668.60, 2668.60, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-18 00:00:00', '2026-09-19 00:00:00', '2026-10-15 00:00:00', NULL, 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 00:00:00', '2026-09-17 16:16:40.015', NULL);


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe9f007qxi7d0kfavx5c', 'cmu5qfe9e007pxi7denfuoelb', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 5.000, 'unit', 34.00, 0.000, 10.000, 170.00, 0.00, 17.00, 187.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe9f007rxi7d0rwjhe2w', 'cmu5qfe9e007pxi7denfuoelb', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 11.000, 'unit', 399.00, 5.000, 10.000, 4389.00, 219.45, 416.96, 4586.51, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe9f007sxi7djm49spbo', 'cmu5qfe9e007pxi7denfuoelb', 'cmu5qfe49004yxi7dtni24pdo', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 13.000, 'unit', 1685.00, 5.000, 10.000, 21905.00, 1095.25, 2080.98, 22890.73, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe9f007txi7dapermsod', 'cmu5qfe9e007pxi7denfuoelb', 'cmu5qfe4q0056xi7d7ilrhobv', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 2.000, 'unit', 249.00, 0.000, 10.000, 498.00, 0.00, 49.80, 547.80, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe9f007uxi7dt89glv7k', 'cmu5qfe9e007pxi7denfuoelb', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 5.000, 'hour', 125.00, 0.000, 10.000, 625.00, 0.00, 62.50, 687.50, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfead0084xi7dlljkord5', 'cmu5qfeac0083xi7dt0jtb2m4', 'cmu5qfe46004wxi7dzsbk6yl3', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 13.000, 'unit', 689.00, 0.000, 10.000, 8957.00, 0.00, 895.70, 9852.70, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfead0085xi7dcwop15r9', 'cmu5qfeac0083xi7dt0jtb2m4', 'cmu5qfe5k005ixi7dip14tjcb', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 5.000, 'unit', 84.00, 0.000, 10.000, 420.00, 0.00, 42.00, 462.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfead0086xi7d98ufoqz9', 'cmu5qfeac0083xi7dt0jtb2m4', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeaw008exi7dhwo3cocn', 'cmu5qfeaw008dxi7d4jv5kmnp', 'cmu5qfe57005cxi7d5gyzpj4n', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 9.000, 'unit', 845.00, 0.000, 10.000, 7605.00, 0.00, 760.50, 8365.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeaw008fxi7da1opk6vu', 'cmu5qfeaw008dxi7d4jv5kmnp', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 6.000, 'unit', 399.00, 5.000, 10.000, 2394.00, 119.70, 227.43, 2501.73, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeaw008gxi7dypmn15xk', 'cmu5qfeaw008dxi7d4jv5kmnp', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfebh008oxi7dvtxnoova', 'cmu5qfebh008nxi7deh53x5iu', 'cmu5qfe46004wxi7dzsbk6yl3', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 2.000, 'unit', 689.00, 0.000, 10.000, 1378.00, 0.00, 137.80, 1515.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfebh008pxi7diuudy8aq', 'cmu5qfebh008nxi7deh53x5iu', 'cmu5qfe57005cxi7d5gyzpj4n', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 12.000, 'unit', 845.00, 0.000, 10.000, 10140.00, 0.00, 1014.00, 11154.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfebh008qxi7dz32uvt2w', 'cmu5qfebh008nxi7deh53x5iu', 'cmu5qfe4q0056xi7d7ilrhobv', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 2.000, 'unit', 249.00, 5.000, 10.000, 498.00, 24.90, 47.31, 520.41, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfebi008rxi7dqjkugc0e', 'cmu5qfebh008nxi7deh53x5iu', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 14.000, 'unit', 749.00, 0.000, 10.000, 10486.00, 0.00, 1048.60, 11534.60, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfebi008sxi7d7l3e3xl0', 'cmu5qfebh008nxi7deh53x5iu', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 5.000, 'hour', 88.00, 0.000, 10.000, 440.00, 0.00, 44.00, 484.00, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfecb0092xi7dys5n053t', 'cmu5qfeca0091xi7dvoal6wma', 'cmu5qfe46004wxi7dzsbk6yl3', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 3.000, 'unit', 689.00, 5.000, 10.000, 2067.00, 103.35, 196.37, 2160.02, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfecb0093xi7d21tkz05g', 'cmu5qfeca0091xi7dvoal6wma', 'cmu5qfe4u0058xi7do392h6fr', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 9.000, 'unit', 1150.00, 0.000, 10.000, 10350.00, 0.00, 1035.00, 11385.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfecb0094xi7dglbuqvf8', 'cmu5qfeca0091xi7dvoal6wma', 'cmu5qfe57005cxi7d5gyzpj4n', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 12.000, 'unit', 845.00, 5.000, 10.000, 10140.00, 507.00, 963.30, 10596.30, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfecb0095xi7dd1erzhxm', 'cmu5qfeca0091xi7dvoal6wma', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 4.000, 'unit', 45.00, 0.000, 10.000, 180.00, 0.00, 18.00, 198.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfecb0096xi7d593su1hx', 'cmu5qfeca0091xi7dvoal6wma', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 13.000, 'hour', 88.00, 0.000, 10.000, 1144.00, 0.00, 114.40, 1258.40, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfed7009gxi7dotou6rrv', 'cmu5qfed6009fxi7ddr2fch5g', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 5.000, 10.000, 1106.00, 55.30, 105.07, 1155.77, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfed7009hxi7dxs9qky1g', 'cmu5qfed6009fxi7ddr2fch5g', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 14.000, 'unit', 399.00, 5.000, 10.000, 5586.00, 279.30, 530.67, 5837.37, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfed7009ixi7d8uu3d908', 'cmu5qfed6009fxi7ddr2fch5g', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 11.000, 'hour', 125.00, 0.000, 10.000, 1375.00, 0.00, 137.50, 1512.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfedr009qxi7dp8c36rhe', 'cmu5qfedq009pxi7dj512f3po', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfedr009rxi7d3obstjfm', 'cmu5qfedq009pxi7dj512f3po', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 7.000, 'unit', 459.00, 0.000, 10.000, 3213.00, 0.00, 321.30, 3534.30, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfedr009sxi7d2fspzwtk', 'cmu5qfedq009pxi7dj512f3po', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 13.000, 'hour', 88.00, 0.000, 10.000, 1144.00, 0.00, 114.40, 1258.40, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeed00a0xi7dsxiq9s3z', 'cmu5qfeec009zxi7d7qlwprdi', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 12.000, 'unit', 34.00, 0.000, 10.000, 408.00, 0.00, 40.80, 448.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeed00a1xi7dxlpyv6vb', 'cmu5qfeec009zxi7d7qlwprdi', 'cmu5qfe4q0056xi7d7ilrhobv', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 8.000, 'unit', 249.00, 5.000, 10.000, 1992.00, 99.60, 189.24, 2081.64, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeed00a2xi7dkuukzxo1', 'cmu5qfeec009zxi7d7qlwprdi', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 4.000, 'unit', 45.00, 5.000, 10.000, 180.00, 9.00, 17.10, 188.10, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeed00a3xi7d7winpth6', 'cmu5qfeec009zxi7d7qlwprdi', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 8.000, 'hour', 88.00, 0.000, 10.000, 704.00, 0.00, 70.40, 774.40, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeez00acxi7dj7juhui9', 'cmu5qfeez00abxi7d6qhaa1yf', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 5.000, 10.000, 540.00, 27.00, 51.30, 564.30, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeez00adxi7dchk3281t', 'cmu5qfeez00abxi7d6qhaa1yf', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 10.000, 'unit', 34.00, 0.000, 10.000, 340.00, 0.00, 34.00, 374.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeez00aexi7dpol2tui9', 'cmu5qfeez00abxi7d6qhaa1yf', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 13.000, 'unit', 749.00, 0.000, 10.000, 9737.00, 0.00, 973.70, 10710.70, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeez00afxi7d2pmxy35p', 'cmu5qfeez00abxi7d6qhaa1yf', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 9.000, 'hour', 125.00, 0.000, 10.000, 1125.00, 0.00, 112.50, 1237.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfefn00aoxi7dxoakfqd4', 'cmu5qfefm00anxi7dktvq1a5r', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 10.000, 'unit', 399.00, 0.000, 10.000, 3990.00, 0.00, 399.00, 4389.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfefn00apxi7ds6dfl5hw', 'cmu5qfefm00anxi7dktvq1a5r', 'cmu5qfe5f005gxi7d65bfsb6g', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 6.000, 'unit', 119.00, 0.000, 10.000, 714.00, 0.00, 71.40, 785.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfefn00aqxi7d7i9drvoh', 'cmu5qfefm00anxi7dktvq1a5r', 'cmu5qfe4u0058xi7do392h6fr', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 11.000, 'unit', 1150.00, 5.000, 10.000, 12650.00, 632.50, 1201.75, 13219.25, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfefn00arxi7d43lrzsxq', 'cmu5qfefm00anxi7dktvq1a5r', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 6.000, 'hour', 125.00, 0.000, 10.000, 750.00, 0.00, 75.00, 825.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeg900b0xi7dxryavqww', 'cmu5qfeg800azxi7d74kdnsa7', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 7.000, 'unit', 34.00, 5.000, 10.000, 238.00, 11.90, 22.61, 248.71, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeg900b1xi7dc023re23', 'cmu5qfeg800azxi7d74kdnsa7', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 0.000, 10.000, 540.00, 0.00, 54.00, 594.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeg900b2xi7d4icurpvc', 'cmu5qfeg800azxi7d74kdnsa7', 'cmu5qfe5c005exi7dx1fv80s5', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 5.000, 'unit', 289.00, 0.000, 10.000, 1445.00, 0.00, 144.50, 1589.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeg900b3xi7d3qea8lyh', 'cmu5qfeg800azxi7d74kdnsa7', 'cmu5qfe5f005gxi7d65bfsb6g', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 5.000, 'unit', 119.00, 0.000, 10.000, 595.00, 0.00, 59.50, 654.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeg900b4xi7d3xea078l', 'cmu5qfeg800azxi7d74kdnsa7', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfegy00bexi7dvgr1fa5r', 'cmu5qfegx00bdxi7d0l73uq4e', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 0.000, 10.000, 1106.00, 0.00, 110.60, 1216.60, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfegy00bfxi7dnp47ly4c', 'cmu5qfegx00bdxi7d0l73uq4e', 'cmu5qfe49004yxi7dtni24pdo', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 11.000, 'unit', 1685.00, 5.000, 10.000, 18535.00, 926.75, 1760.83, 19369.08, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfegy00bgxi7d95ffvqgb', 'cmu5qfegx00bdxi7d0l73uq4e', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 11.000, 'unit', 459.00, 5.000, 10.000, 5049.00, 252.45, 479.66, 5276.21, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfegy00bhxi7dz1mm40gg', 'cmu5qfegx00bdxi7d0l73uq4e', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 11.000, 'unit', 34.00, 0.000, 10.000, 374.00, 0.00, 37.40, 411.40, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfegy00bixi7dq9lgomys', 'cmu5qfegx00bdxi7d0l73uq4e', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfehq00bsxi7djbohknw6', 'cmu5qfehp00brxi7ds3d8jv6u', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 8.000, 'unit', 79.00, 0.000, 10.000, 632.00, 0.00, 63.20, 695.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfehq00btxi7ddqk1rygh', 'cmu5qfehp00brxi7ds3d8jv6u', 'cmu5qfe57005cxi7d5gyzpj4n', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 11.000, 'unit', 845.00, 0.000, 10.000, 9295.00, 0.00, 929.50, 10224.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfehq00buxi7d95w6k2df', 'cmu5qfehp00brxi7ds3d8jv6u', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeic00c2xi7dirgqovti', 'cmu5qfeic00c1xi7daoalnziq', 'cmu5qfe49004yxi7dtni24pdo', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 8.000, 'unit', 1685.00, 0.000, 10.000, 13480.00, 0.00, 1348.00, 14828.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeic00c3xi7dcl5zkkm3', 'cmu5qfeic00c1xi7daoalnziq', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 13.000, 'unit', 459.00, 0.000, 10.000, 5967.00, 0.00, 596.70, 6563.70, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeic00c4xi7d3nm8x16e', 'cmu5qfeic00c1xi7daoalnziq', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeix00ccxi7dvce7f3c2', 'cmu5qfeix00cbxi7dqa1y0e7j', 'cmu5qfe5c005exi7dx1fv80s5', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 9.000, 'unit', 289.00, 0.000, 10.000, 2601.00, 0.00, 260.10, 2861.10, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeix00cdxi7dochlpq4g', 'cmu5qfeix00cbxi7dqa1y0e7j', 'cmu5qfe4z005axi7dl1bjteys', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 9.000, 'unit', 165.00, 0.000, 10.000, 1485.00, 0.00, 148.50, 1633.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeix00cexi7d2awxo654', 'cmu5qfeix00cbxi7dqa1y0e7j', 'cmu5qfe46004wxi7dzsbk6yl3', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 10.000, 'unit', 689.00, 0.000, 10.000, 6890.00, 0.00, 689.00, 7579.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeix00cfxi7dsjsssdot', 'cmu5qfeix00cbxi7dqa1y0e7j', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfejp00coxi7djxlb0jof', 'cmu5qfejo00cnxi7djhxdoaki', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfejp00cpxi7duvhf3x8e', 'cmu5qfejo00cnxi7djhxdoaki', 'cmu5qfe5k005ixi7dip14tjcb', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 4.000, 'unit', 84.00, 0.000, 10.000, 336.00, 0.00, 33.60, 369.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfejp00cqxi7doegrdos0', 'cmu5qfejo00cnxi7djhxdoaki', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 12.000, 'unit', 749.00, 0.000, 10.000, 8988.00, 0.00, 898.80, 9886.80, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfejp00crxi7dplpa6ue7', 'cmu5qfejo00cnxi7djhxdoaki', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 9.000, 'hour', 125.00, 0.000, 10.000, 1125.00, 0.00, 112.50, 1237.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfekg00d0xi7d255jm4jc', 'cmu5qfekf00czxi7dpp88xlzf', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 11.000, 'unit', 749.00, 5.000, 10.000, 8239.00, 411.95, 782.71, 8609.76, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfekg00d1xi7dxkkfaaty', 'cmu5qfekf00czxi7dpp88xlzf', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 2.000, 'unit', 399.00, 0.000, 10.000, 798.00, 0.00, 79.80, 877.80, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfekg00d2xi7dagauck8q', 'cmu5qfekf00czxi7dpp88xlzf', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 16.000, 'hour', 125.00, 0.000, 10.000, 2000.00, 0.00, 200.00, 2200.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfel100daxi7da7f38zsg', 'cmu5qfel000d9xi7d99nbufls', 'cmu5qfe5f005gxi7d65bfsb6g', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 2.000, 'unit', 119.00, 0.000, 10.000, 238.00, 0.00, 23.80, 261.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfel100dbxi7dy58dn7nj', 'cmu5qfel000d9xi7d99nbufls', 'cmu5qfe5r005mxi7dqttogrcw', 'Phone Booth Single', 'Single-occupancy acoustic pod with ventilation and lighting.', 8.000, 'unit', 5290.00, 0.000, 10.000, 42320.00, 0.00, 4232.00, 46552.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfel100dcxi7do8j82n1w', 'cmu5qfel000d9xi7d99nbufls', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 2.000, 'unit', 749.00, 5.000, 10.000, 1498.00, 74.90, 142.31, 1565.41, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfel100ddxi7dk19pa0h7', 'cmu5qfel000d9xi7d99nbufls', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 9.000, 'hour', 88.00, 0.000, 10.000, 792.00, 0.00, 79.20, 871.20, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeln00dmxi7drg7729mt', 'cmu5qfelm00dlxi7dj70mf7oh', 'cmu5qfe4d0050xi7dxa7k9i8v', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 5.000, 'unit', 445.00, 0.000, 10.000, 2225.00, 0.00, 222.50, 2447.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeln00dnxi7dn99sd2xq', 'cmu5qfelm00dlxi7dj70mf7oh', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 7.000, 'hour', 88.00, 0.000, 10.000, 616.00, 0.00, 61.60, 677.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfem200duxi7d46ytmbdx', 'cmu5qfem100dtxi7dgf3hv7ey', 'cmu5qfe5k005ixi7dip14tjcb', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 3.000, 'unit', 84.00, 0.000, 10.000, 252.00, 0.00, 25.20, 277.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfem200dvxi7doy8ry4jy', 'cmu5qfem100dtxi7dgf3hv7ey', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 14.000, 'hour', 88.00, 0.000, 10.000, 1232.00, 0.00, 123.20, 1355.20, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfem900dyxi7dk439vjpl', 'cmu5qfem800dxxi7d7loqfdxe', 'cmu5qfe5k005ixi7dip14tjcb', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 10.000, 'unit', 84.00, 0.000, 10.000, 840.00, 0.00, 84.00, 924.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfem900dzxi7de6pwxg7l', 'cmu5qfem800dxxi7d7loqfdxe', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 4.000, 'unit', 79.00, 0.000, 10.000, 316.00, 0.00, 31.60, 347.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfem900e0xi7d8a8zl7i9', 'cmu5qfem800dxxi7d7loqfdxe', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 7.000, 'unit', 459.00, 0.000, 10.000, 3213.00, 0.00, 321.30, 3534.30, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfem900e1xi7dgij7jpbd', 'cmu5qfem800dxxi7d7loqfdxe', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 7.000, 'hour', 88.00, 0.000, 10.000, 616.00, 0.00, 61.60, 677.60, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfemp00e7xi7dbzce8r6e', 'cmu5qfemo00e6xi7d4h5tje75', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 3.000, 'unit', 45.00, 0.000, 10.000, 135.00, 0.00, 13.50, 148.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfemp00e8xi7dela3q2mj', 'cmu5qfemo00e6xi7d4h5tje75', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 6.000, 'unit', 459.00, 0.000, 10.000, 2754.00, 0.00, 275.40, 3029.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfemp00e9xi7dzs0ph830', 'cmu5qfemo00e6xi7d4h5tje75', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfen700ehxi7dmrhf09ju', 'cmu5qfen600egxi7di9khl9zb', 'cmu5qfe4z005axi7dl1bjteys', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 7.000, 'unit', 165.00, 5.000, 10.000, 1155.00, 57.75, 109.73, 1206.98, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfen700eixi7dumivdmtk', 'cmu5qfen600egxi7di9khl9zb', 'cmu5qfe46004wxi7dzsbk6yl3', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 4.000, 'unit', 689.00, 0.000, 10.000, 2756.00, 0.00, 275.60, 3031.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfen700ejxi7df8q944hb', 'cmu5qfen600egxi7di9khl9zb', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 5.000, 'unit', 34.00, 0.000, 10.000, 170.00, 0.00, 17.00, 187.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfen700ekxi7dxvk7jlj4', 'cmu5qfen600egxi7di9khl9zb', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfenl00eqxi7dirzkigos', 'cmu5qfenk00epxi7dmau4gs3u', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 14.000, 'unit', 459.00, 5.000, 10.000, 6426.00, 321.30, 610.47, 6715.17, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfenl00erxi7d194dduks', 'cmu5qfenk00epxi7dmau4gs3u', 'cmu5qfe4z005axi7dl1bjteys', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 10.000, 'unit', 165.00, 0.000, 10.000, 1650.00, 0.00, 165.00, 1815.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfenl00esxi7d4zge651b', 'cmu5qfenk00epxi7dmau4gs3u', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfenr00evxi7d3mmw6kzd', 'cmu5qfenr00euxi7dq5usropr', 'cmu5qfe5c005exi7dx1fv80s5', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 5.000, 'unit', 289.00, 0.000, 10.000, 1445.00, 0.00, 144.50, 1589.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfenr00ewxi7d0hnehw5k', 'cmu5qfenr00euxi7dq5usropr', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 5.000, 'unit', 749.00, 0.000, 10.000, 3745.00, 0.00, 374.50, 4119.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfenr00exxi7d0qzfvt9d', 'cmu5qfenr00euxi7dq5usropr', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeoc00f5xi7drwleadze', 'cmu5qfeob00f4xi7d4ss8nqwm', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 13.000, 'unit', 34.00, 0.000, 10.000, 442.00, 0.00, 44.20, 486.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeoc00f6xi7dcv67rhea', 'cmu5qfeob00f4xi7d4ss8nqwm', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 2.000, 'unit', 399.00, 0.000, 10.000, 798.00, 0.00, 79.80, 877.80, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeoc00f7xi7dv9tcr8qq', 'cmu5qfeob00f4xi7d4ss8nqwm', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 15.000, 'hour', 125.00, 0.000, 10.000, 1875.00, 0.00, 187.50, 2062.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeot00ffxi7d5f4x8vwq', 'cmu5qfeos00fexi7dk2bv8eo8', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 9.000, 'unit', 459.00, 5.000, 10.000, 4131.00, 206.55, 392.45, 4316.90, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeot00fgxi7dgkqkel1p', 'cmu5qfeos00fexi7dk2bv8eo8', 'cmu5qfe4d0050xi7dxa7k9i8v', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 11.000, 'unit', 445.00, 0.000, 10.000, 4895.00, 0.00, 489.50, 5384.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeot00fhxi7dn3r8dz7m', 'cmu5qfeos00fexi7dk2bv8eo8', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepc00fpxi7dkyfue4ey', 'cmu5qfepb00foxi7dwck7aw2n', 'cmu5qfe4d0050xi7dxa7k9i8v', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 8.000, 'unit', 445.00, 0.000, 10.000, 3560.00, 0.00, 356.00, 3916.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepc00fqxi7dp2tmzjcy', 'cmu5qfepb00foxi7dwck7aw2n', 'cmu5qfe5k005ixi7dip14tjcb', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 11.000, 'unit', 84.00, 0.000, 10.000, 924.00, 0.00, 92.40, 1016.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepc00frxi7dvl9293m8', 'cmu5qfepb00foxi7dwck7aw2n', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepn00fwxi7dvp6tci77', 'cmu5qfepm00fvxi7d0n73mgtd', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 10.000, 'unit', 399.00, 5.000, 10.000, 3990.00, 199.50, 379.05, 4169.55, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepn00fxxi7dx1raqlvq', 'cmu5qfepm00fvxi7d0n73mgtd', 'cmu5qfe5f005gxi7d65bfsb6g', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 9.000, 'unit', 119.00, 5.000, 10.000, 1071.00, 53.55, 101.75, 1119.20, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepn00fyxi7dsqt2809r', 'cmu5qfepm00fvxi7d0n73mgtd', 'cmu5qfe5c005exi7dx1fv80s5', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 11.000, 'unit', 289.00, 0.000, 10.000, 3179.00, 0.00, 317.90, 3496.90, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfepn00fzxi7d5qj1dai3', 'cmu5qfepm00fvxi7d0n73mgtd', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 11.000, 'hour', 125.00, 0.000, 10.000, 1375.00, 0.00, 137.50, 1512.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeq800g8xi7dfv4ro5r8', 'cmu5qfeq700g7xi7d9kry6ibd', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 0.000, 10.000, 1106.00, 0.00, 110.60, 1216.60, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfeq800g9xi7dmme82nai', 'cmu5qfeq700g7xi7d9kry6ibd', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 1);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu5qff0500m4xi7du8zapafa', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'INVOICE_OVERDUE', 'INV-2026-00028 is past due', 'Owen Pritchard has not settled this invoice. Consider sending a reminder.', '/invoices/cmu5qfepb00foxi7dwck7aw2n', NULL, '2026-09-17 16:16:40.373');
INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu5qff0500m5xi7dql8x2fk7', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'LOW_STOCK', 'Three products are below their reorder point', 'Draughtsman Stool, Corner Workstation 1800 and Acoustic Ceiling Baffle need restocking.', '/inventory', NULL, '2026-09-17 16:16:40.373');
INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu5qff0500m6xi7dzt6xunfk', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'PAYMENT_RECEIVED', 'Payment received', 'A bank transfer has been matched to an open invoice.', '/payments', '2026-09-16 16:16:38.464', '2026-09-17 16:16:40.373');


--
-- Data for Name: number_sequences; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu5qfe7e006bxi7didpgistg', 'cmu5qfdzr0037xi7djkemxwps', 'quotation', 2026, 8, '2026-09-17 16:16:39.394');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu5qfeqk00gexi7dj06k4wqr', 'cmu5qfdzr0037xi7djkemxwps', 'expense', 2026, 40, '2026-09-17 16:16:40.258');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu5qfeyg00kqxi7d22801rlf', 'cmu5qfdzr0037xi7djkemxwps', 'payroll', 2026, 5, '2026-09-17 16:16:40.328');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu5qfe98007oxi7d4bmkae3s', 'cmu5qfdzr0037xi7djkemxwps', 'invoice', 2026, 30, '2026-09-17 16:16:40.011');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu5qfe9z007zxi7d5amcurm9', 'cmu5qfdzr0037xi7djkemxwps', 'payment', 2026, 25, '2026-09-17 16:16:40.02');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdzr0037xi7djkemxwps', 'owner', 'Owner', 'Unrestricted access, including billing and organization deletion.', true, '2026-09-17 16:16:39.07', '2026-09-17 16:16:39.07');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdzr0037xi7djkemxwps', 'admin', 'Administrator', 'Full access to every module and to user management.', true, '2026-09-17 16:16:39.082', '2026-09-17 16:16:39.082');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdzr0037xi7djkemxwps', 'manager', 'Manager', 'Runs day-to-day operations across sales, purchasing, inventory and projects.', true, '2026-09-17 16:16:39.09', '2026-09-17 16:16:39.09');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdzr0037xi7djkemxwps', 'accountant', 'Accountant', 'Owns finance: expenses, payments, accounts, payroll and reporting.', true, '2026-09-17 16:16:39.096', '2026-09-17 16:16:39.096');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdzr0037xi7djkemxwps', 'sales', 'Sales', 'Works the pipeline: customers, quotations, invoices and payments.', true, '2026-09-17 16:16:39.101', '2026-09-17 16:16:39.101');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdzr0037xi7djkemxwps', 'employee', 'Employee', 'Self-service access to assigned projects, tasks and timesheets.', true, '2026-09-17 16:16:39.105', '2026-09-17 16:16:39.105');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfe1v003xxi7dlcrq5rip', 'owner', 'Owner', 'Unrestricted access, including billing and organization deletion.', true, '2026-09-17 16:16:39.142', '2026-09-17 16:16:39.142');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfe1v003xxi7dlcrq5rip', 'admin', 'Administrator', 'Full access to every module and to user management.', true, '2026-09-17 16:16:39.152', '2026-09-17 16:16:39.152');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfe1v003xxi7dlcrq5rip', 'manager', 'Manager', 'Runs day-to-day operations across sales, purchasing, inventory and projects.', true, '2026-09-17 16:16:39.163', '2026-09-17 16:16:39.163');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfe1v003xxi7dlcrq5rip', 'accountant', 'Accountant', 'Owns finance: expenses, payments, accounts, payroll and reporting.', true, '2026-09-17 16:16:39.172', '2026-09-17 16:16:39.172');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfe1v003xxi7dlcrq5rip', 'sales', 'Sales', 'Works the pipeline: customers, quotations, invoices and payments.', true, '2026-09-17 16:16:39.178', '2026-09-17 16:16:39.178');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfe1v003xxi7dlcrq5rip', 'employee', 'Employee', 'Self-service access to assigned projects, tasks and timesheets.', true, '2026-09-17 16:16:39.183', '2026-09-17 16:16:39.183');


--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe10003fxi7duzaontfn', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfdxz0000xi7dmfw8krvy', 'cmu5qfdzy0039xi7dy713enkx', NULL, 'ACTIVE', true, NULL, '2026-09-17 16:16:39.107', '2026-09-17 16:16:39.108', '2026-09-17 16:16:39.108', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1h003sxi7ddc41q646', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfdy60001xi7dqvhm0z2x', 'cmu5qfe0i003bxi7dply9nil8', NULL, 'ACTIVE', false, NULL, '2025-07-17 16:16:38.464', '2026-09-17 16:16:39.125', '2026-09-17 16:16:39.125', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1h003txi7d70nh1r8h', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfdy60002xi7df3nss1y1', 'cmu5qfe0o003cxi7dddjdquni', NULL, 'ACTIVE', false, NULL, '2025-11-17 16:16:38.464', '2026-09-17 16:16:39.125', '2026-09-17 16:16:39.125', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1h003uxi7dm4nioum0', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfdy60003xi7d4wwldzbi', 'cmu5qfe0t003dxi7dcij76bqy', NULL, 'ACTIVE', false, NULL, '2024-06-17 16:16:38.464', '2026-09-17 16:16:39.125', '2026-09-17 16:16:39.125', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe1h003vxi7dem1jxbgw', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfdy60004xi7drb9ya0a4', 'cmu5qfe0x003exi7ddxfmp1me', NULL, 'ACTIVE', false, NULL, '2026-06-17 16:16:38.464', '2026-09-17 16:16:39.125', '2026-09-17 16:16:39.125', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfe360045xi7d6i6nds4q', 'cmu5qfe1v003xxi7dlcrq5rip', 'cmu5qfe1r003wxi7d0yq561yw', 'cmu5qfe1y003zxi7dfhojuk18', NULL, 'ACTIVE', true, NULL, '2026-09-17 16:16:39.185', '2026-09-17 16:16:39.186', '2026-09-17 16:16:39.186', NULL);


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfea20080xi7dvh3z1xdy', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00001', 'INCOMING', 'CHECK', 28032.54, 'GHS', '2026-03-28 00:00:00', 'INV-2026-00001/REM', 'Part payment on account ahead of the second delivery.', 'cmu5qfe6g005wxi7dii6bekpm', NULL, 'cmu5qfe9e007pxi7denfuoelb', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.434', '2026-09-17 16:16:39.434', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeam008axi7dnk00l207', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00002', 'INCOMING', 'CHECK', 11964.70, 'GHS', '2026-04-27 00:00:00', 'INV-2026-00002/REM', 'Part payment on account ahead of the second delivery.', 'cmu5qfe6i005xxi7dj4aemiz1', NULL, 'cmu5qfeac0083xi7dt0jtb2m4', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.454', '2026-09-17 16:16:39.454', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeb8008kxi7dznuqd2vk', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00003', 'INCOMING', 'BANK_TRANSFER', 11829.73, 'GHS', '2026-04-29 00:00:00', 'INV-2026-00003/REM', 'Card payment taken over the phone.', 'cmu5qfe6k005yxi7dheo9lpoa', NULL, 'cmu5qfeaw008dxi7d4jv5kmnp', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.476', '2026-09-17 16:16:39.476', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfec1008yxi7dmo4fa7y6', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00004', 'INCOMING', 'BANK_TRANSFER', 25208.81, 'GHS', '2026-06-03 00:00:00', 'INV-2026-00004/REM', 'Cleared after statement chase.', 'cmu5qfe6m005zxi7djbndzaq0', NULL, 'cmu5qfebh008nxi7deh53x5iu', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.505', '2026-09-17 16:16:39.505', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfecx009cxi7d9pkoglpp', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00005', 'INCOMING', 'CARD', 24829.78, 'GHS', '2026-05-15 00:00:00', 'INV-2026-00005/REM', 'Card payment taken over the phone.', 'cmu5qfe6q0060xi7dh0m5fxv6', NULL, 'cmu5qfeca0091xi7dvoal6wma', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.537', '2026-09-17 16:16:39.537', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfedh009mxi7d3s7mdt1v', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00006', 'INCOMING', 'CHECK', 8505.64, 'GHS', '2026-05-19 00:00:00', 'INV-2026-00006/REM', 'Part payment on account ahead of the second delivery.', 'cmu5qfe6s0061xi7dci8v10qe', NULL, 'cmu5qfed6009fxi7ddr2fch5g', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.557', '2026-09-17 16:16:39.557', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfee3009wxi7dc15p83ot', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00007', 'INCOMING', 'CHECK', 5188.70, 'GHS', '2026-06-17 00:00:00', 'INV-2026-00007/REM', 'Card payment taken over the phone.', 'cmu5qfe6u0062xi7de4xegtki', NULL, 'cmu5qfedq009pxi7dj512f3po', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.579', '2026-09-17 16:16:39.579', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeep00a8xi7dn7xehzpq', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00008', 'INCOMING', 'BANK_TRANSFER', 3492.94, 'GHS', '2026-06-15 00:00:00', 'INV-2026-00008/REM', 'Card payment taken over the phone.', 'cmu5qfe6v0063xi7d2u45voj8', NULL, 'cmu5qfeec009zxi7d7qlwprdi', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.601', '2026-09-17 16:16:39.601', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfefe00akxi7ddy5feycc', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00009', 'INCOMING', 'BANK_TRANSFER', 12499.91, 'GHS', '2026-06-09 00:00:00', 'INV-2026-00009/REM', 'Card payment taken over the phone.', 'cmu5qfe6w0064xi7d8qto7xt1', NULL, 'cmu5qfeez00abxi7d6qhaa1yf', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.626', '2026-09-17 16:16:39.626', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfefz00awxi7dciat6qay', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00010', 'INCOMING', 'CARD', 19218.65, 'GHS', '2026-07-11 00:00:00', 'INV-2026-00010/REM', 'Cleared after statement chase.', 'cmu5qfe6y0065xi7d5218zaog', NULL, 'cmu5qfefm00anxi7dktvq1a5r', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.647', '2026-09-17 16:16:39.647', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfegp00baxi7d5mjw9t2q', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00011', 'INCOMING', 'BANK_TRANSFER', 4049.21, 'GHS', '2026-07-13 00:00:00', 'INV-2026-00011/REM', 'Card payment taken over the phone.', 'cmu5qfe6g005wxi7dii6bekpm', NULL, 'cmu5qfeg800azxi7d74kdnsa7', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.673', '2026-09-17 16:16:39.673', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfehf00boxi7ds5u0nt14', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00012', 'INCOMING', 'BANK_TRANSFER', 26660.48, 'GHS', '2026-07-13 00:00:00', 'INV-2026-00012/REM', 'Settled in full within terms.', 'cmu5qfe6i005xxi7dj4aemiz1', NULL, 'cmu5qfegx00bdxi7d0l73uq4e', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.699', '2026-09-17 16:16:39.699', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfei200byxi7dfkj7bdqe', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00013', 'INCOMING', 'BANK_TRANSFER', 11531.07, 'GHS', '2026-07-09 00:00:00', 'INV-2026-00013/REM', 'Card payment taken over the phone.', 'cmu5qfe6k005yxi7dheo9lpoa', NULL, 'cmu5qfehp00brxi7ds3d8jv6u', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.722', '2026-09-17 16:16:39.722', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfein00c8xi7d7gijht5g', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00014', 'INCOMING', 'CHECK', 22359.70, 'GHS', '2026-07-18 00:00:00', 'INV-2026-00014/REM', 'Settled in full within terms.', 'cmu5qfe6m005zxi7djbndzaq0', NULL, 'cmu5qfeic00c1xi7daoalnziq', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.743', '2026-09-17 16:16:39.743', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfejd00ckxi7d5rsnmmmt', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00015', 'INCOMING', 'BANK_TRANSFER', 13525.60, 'GHS', '2026-07-26 00:00:00', 'INV-2026-00015/REM', 'Cleared after statement chase.', 'cmu5qfe6q0060xi7dh0m5fxv6', NULL, 'cmu5qfeix00cbxi7dqa1y0e7j', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.769', '2026-09-17 16:16:39.769', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfek300cwxi7d5dsuad64', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00016', 'INCOMING', 'CARD', 11889.90, 'GHS', '2026-08-22 00:00:00', 'INV-2026-00016/REM', 'Bank transfer received, reference matched automatically.', 'cmu5qfe6s0061xi7dci8v10qe', NULL, 'cmu5qfejo00cnxi7djhxdoaki', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.795', '2026-09-17 16:16:39.795', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfekr00d6xi7dsoj0jhbg', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00017', 'INCOMING', 'CHECK', 11336.93, 'GHS', '2026-08-12 00:00:00', 'INV-2026-00017/REM', 'Cleared after statement chase.', 'cmu5qfe6u0062xi7de4xegtki', NULL, 'cmu5qfekf00czxi7dpp88xlzf', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.819', '2026-09-17 16:16:39.819', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfele00dixi7d4i55m1qg', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00018', 'INCOMING', 'CHECK', 49250.41, 'GHS', '2026-08-17 00:00:00', 'INV-2026-00018/REM', 'Bank transfer received, reference matched automatically.', 'cmu5qfe6v0063xi7d2u45voj8', NULL, 'cmu5qfel000d9xi7d99nbufls', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.842', '2026-09-17 16:16:39.842', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfelt00dqxi7dbpvrcy6s', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00019', 'INCOMING', 'BANK_TRANSFER', 3125.10, 'GHS', '2026-09-01 00:00:00', 'INV-2026-00019/REM', 'Cleared after statement chase.', 'cmu5qfe6w0064xi7d8qto7xt1', NULL, 'cmu5qfelm00dlxi7dj70mf7oh', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.857', '2026-09-17 16:16:39.857', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfemy00edxi7dj9p23sb4', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00020', 'INCOMING', 'CARD', 3565.10, 'GHS', '2026-09-18 00:00:00', 'INV-2026-00022/REM', 'Part payment on account ahead of the second delivery.', 'cmu5qfe6i005xxi7dj4aemiz1', NULL, 'cmu5qfemo00e6xi7d4h5tje75', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.898', '2026-09-17 16:16:39.898', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeo300f1xi7d70dk4nh2', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00021', 'INCOMING', 'BANK_TRANSFER', 5913.31, 'GHS', '2026-09-21 00:00:00', 'INV-2026-00025/REM', 'Cleared after statement chase.', 'cmu5qfe6q0060xi7dh0m5fxv6', NULL, 'cmu5qfenr00euxi7dq5usropr', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.939', '2026-09-17 16:16:39.939', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeol00fbxi7d5veudmxd', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00022', 'INCOMING', 'BANK_TRANSFER', 1370.60, 'GHS', '2026-09-24 00:00:00', 'INV-2026-00026/REM', 'Settled in full within terms.', 'cmu5qfe6s0061xi7dci8v10qe', NULL, 'cmu5qfeob00f4xi7d4ss8nqwm', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.957', '2026-09-17 16:16:39.957', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfep300flxi7d6bfkh5u0', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00023', 'INCOMING', 'BANK_TRANSFER', 10669.40, 'GHS', '2026-09-15 00:00:00', 'INV-2026-00027/REM', 'Cleared after statement chase.', 'cmu5qfe6u0062xi7de4xegtki', NULL, 'cmu5qfeos00fexi7dk2bv8eo8', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:39.975', '2026-09-17 16:16:39.975', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfepz00g4xi7dwimtjn9g', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00024', 'INCOMING', 'CARD', 9989.20, 'GHS', '2026-09-22 00:00:00', 'INV-2026-00029/REM', 'Settled in full within terms.', 'cmu5qfe6w0064xi7d8qto7xt1', NULL, 'cmu5qfepm00fvxi7d0n73mgtd', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:40.007', '2026-09-17 16:16:40.007', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeqe00gcxi7dekgo9i0d', 'cmu5qfdzr0037xi7djkemxwps', 'PAY-2026-00025', 'INCOMING', 'CARD', 2668.60, 'GHS', '2026-10-03 00:00:00', 'INV-2026-00030/REM', 'Settled in full within terms.', 'cmu5qfe6y0065xi7d5218zaog', NULL, 'cmu5qfeq700g7xi7d9kry6ibd', NULL, 'cmu5qfe18003ixi7d27rx7lkl', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-17 16:16:40.022', '2026-09-17 16:16:40.022', NULL);


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeyk00krxi7d57iatp36', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe700066xi7dt39q80ff', 'PR-2026-00001', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 7400.00, 592.00, 0.00, 900.00, 1406.00, 296.00, 7190.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 16:16:40.316', '2026-09-17 16:16:40.316', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeyo00ktxi7doxncqsm8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe730067xi7dkri6hdwe', 'PR-2026-00002', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 6600.00, 528.00, 0.00, 0.00, 1254.00, 264.00, 5610.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 16:16:40.32', '2026-09-17 16:16:40.32', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeyr00kvxi7db74ed9nk', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe750068xi7d176qjjdr', 'PR-2026-00003', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 6100.00, 488.00, 0.00, 0.00, 1159.00, 244.00, 5185.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 16:16:40.323', '2026-09-17 16:16:40.323', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeyv00kxxi7dvxjlbyu8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe770069xi7d7bmvwbty', 'PR-2026-00004', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 6850.00, 548.00, 0.00, 0.00, 1301.50, 274.00, 5822.50, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 16:16:40.327', '2026-09-17 16:16:40.327', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeyz00kzxi7dhas1fxhx', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe79006axi7ds4h9lild', 'PR-2026-00005', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 5400.00, 432.00, 0.00, 0.00, 1026.00, 216.00, 4590.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 16:16:40.331', '2026-09-17 16:16:40.331', NULL);


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0005xi7dv0uqhs65', 'dashboard.view', 'dashboard', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0006xi7d90yx6ect', 'dashboard.create', 'dashboard', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0007xi7ddnnshpbs', 'dashboard.edit', 'dashboard', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0008xi7dzgmvk4dp', 'dashboard.delete', 'dashboard', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0009xi7d6ims95k8', 'dashboard.export', 'dashboard', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000axi7dih1y0b60', 'invoices.view', 'invoices', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000bxi7dertb06in', 'invoices.create', 'invoices', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000cxi7dysn2xngs', 'invoices.edit', 'invoices', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000dxi7dgq8g7sy1', 'invoices.delete', 'invoices', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000exi7ddayv4t9q', 'invoices.export', 'invoices', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000fxi7dixr64owq', 'quotations.view', 'quotations', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000gxi7dggbmolm8', 'quotations.create', 'quotations', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000hxi7d7tswvie5', 'quotations.edit', 'quotations', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000ixi7dk9p1zqnw', 'quotations.delete', 'quotations', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000jxi7dhar7nhuu', 'quotations.export', 'quotations', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000kxi7dyf08yg2r', 'customers.view', 'customers', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000lxi7de2o40ow6', 'customers.create', 'customers', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000mxi7dkealhi4z', 'customers.edit', 'customers', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000nxi7djjvcodp4', 'customers.delete', 'customers', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000oxi7d3wu5pmie', 'customers.export', 'customers', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000pxi7dwmiwn7ts', 'payments.view', 'payments', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000qxi7d62nyzy8c', 'payments.create', 'payments', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000rxi7dbma8ro7y', 'payments.edit', 'payments', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000sxi7drhzq75qw', 'payments.delete', 'payments', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000txi7dtoula618', 'payments.export', 'payments', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000uxi7d0o76goyh', 'purchases.view', 'purchases', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000vxi7dfzt9xwc4', 'purchases.create', 'purchases', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000wxi7dp90t3yj5', 'purchases.edit', 'purchases', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000xxi7dsjx1p9t0', 'purchases.delete', 'purchases', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000yxi7d9jaak440', 'purchases.export', 'purchases', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze000zxi7dksq0dmpo', 'suppliers.view', 'suppliers', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0010xi7dnhnekpgf', 'suppliers.create', 'suppliers', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0011xi7dezfn4rnl', 'suppliers.edit', 'suppliers', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0012xi7d1df7d1oo', 'suppliers.delete', 'suppliers', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0013xi7dk1w5youo', 'suppliers.export', 'suppliers', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0014xi7d02l0blnt', 'bills.view', 'bills', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0015xi7d1djdvy6s', 'bills.create', 'bills', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0016xi7dk087k8xn', 'bills.edit', 'bills', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0017xi7dsszdc8d9', 'bills.delete', 'bills', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0018xi7da5aghwls', 'bills.export', 'bills', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0019xi7dja1fsddc', 'products.view', 'products', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001axi7ds5wuic5p', 'products.create', 'products', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001bxi7d7luv35sd', 'products.edit', 'products', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001cxi7d4it0cuas', 'products.delete', 'products', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001dxi7dex86tc1k', 'products.export', 'products', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001exi7d2qmk3jw9', 'inventory.view', 'inventory', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001fxi7dz5r6ovk6', 'inventory.create', 'inventory', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001gxi7dpeesmbdt', 'inventory.edit', 'inventory', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001hxi7dzck09m4e', 'inventory.delete', 'inventory', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001ixi7dlxby8dun', 'inventory.export', 'inventory', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001jxi7dhse5ctch', 'expenses.view', 'expenses', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001kxi7dei51g7bd', 'expenses.create', 'expenses', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001lxi7dz02z2smz', 'expenses.edit', 'expenses', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001mxi7dc7a96eiz', 'expenses.delete', 'expenses', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001nxi7dagzropc0', 'expenses.export', 'expenses', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001oxi7dtsf2vv63', 'accounts.view', 'accounts', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001pxi7dvzbk6dlh', 'accounts.create', 'accounts', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001qxi7dlttdsi1f', 'accounts.edit', 'accounts', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001rxi7dha1cpx5o', 'accounts.delete', 'accounts', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001sxi7dhjvlwvu4', 'accounts.export', 'accounts', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001txi7d639lkt98', 'transactions.view', 'transactions', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001uxi7dxhrxfkcs', 'transactions.create', 'transactions', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001vxi7drywpjpmb', 'transactions.edit', 'transactions', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001wxi7d2yue7c7q', 'transactions.delete', 'transactions', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001xxi7dcp9oskz2', 'transactions.export', 'transactions', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001yxi7dsoju80la', 'employees.view', 'employees', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze001zxi7dgfrrx0k0', 'employees.create', 'employees', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0020xi7dl0ckjh8q', 'employees.edit', 'employees', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0021xi7dap6k1fxh', 'employees.delete', 'employees', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0022xi7dst7szk3z', 'employees.export', 'employees', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0023xi7dltii4a68', 'payroll.view', 'payroll', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0024xi7dsv0sszzu', 'payroll.create', 'payroll', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0025xi7ds4m3ykbx', 'payroll.edit', 'payroll', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0026xi7dmaavsw94', 'payroll.delete', 'payroll', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0027xi7dopq2no3l', 'payroll.export', 'payroll', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0028xi7dn0uxb2w7', 'attendance.view', 'attendance', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0029xi7dezdovdy3', 'attendance.create', 'attendance', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002axi7dfoy2w7kx', 'attendance.edit', 'attendance', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002bxi7dr138rk4s', 'attendance.delete', 'attendance', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002cxi7d8g7xu3o0', 'attendance.export', 'attendance', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002dxi7dugkjhmkp', 'projects.view', 'projects', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002exi7d05pflcye', 'projects.create', 'projects', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002fxi7d7ka1qqan', 'projects.edit', 'projects', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002gxi7de6r552vn', 'projects.delete', 'projects', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002hxi7dxof7padv', 'projects.export', 'projects', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002ixi7dqqk8yix7', 'tasks.view', 'tasks', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002jxi7d8iajzmsz', 'tasks.create', 'tasks', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002kxi7duys04rpg', 'tasks.edit', 'tasks', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002lxi7dp39c9avt', 'tasks.delete', 'tasks', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002mxi7dt0jz4nsb', 'tasks.export', 'tasks', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002nxi7d7lm7iuo8', 'timesheets.view', 'timesheets', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002oxi7dfa0plchg', 'timesheets.create', 'timesheets', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002pxi7djbjyjpo3', 'timesheets.edit', 'timesheets', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002qxi7dfjqjl0ib', 'timesheets.delete', 'timesheets', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002rxi7dyabu3ngi', 'timesheets.export', 'timesheets', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002sxi7dk10mtxyl', 'reports.view', 'reports', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002txi7dbz90rst8', 'reports.create', 'reports', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002uxi7df66ik56v', 'reports.edit', 'reports', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002vxi7do4ngtuyd', 'reports.delete', 'reports', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002wxi7d7tn6s9l3', 'reports.export', 'reports', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002xxi7def24jwli', 'settings.view', 'settings', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002yxi7dee4m2hqe', 'settings.create', 'settings', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze002zxi7d4fl16hyt', 'settings.edit', 'settings', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0030xi7d610thnwt', 'settings.delete', 'settings', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0031xi7dizsrbt7n', 'settings.export', 'settings', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0032xi7dihgz6564', 'users.view', 'users', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0033xi7di9ox2h36', 'users.create', 'users', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0034xi7d7epdz95i', 'users.edit', 'users', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0035xi7dv77pdzmr', 'users.delete', 'users', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu5qfdze0036xi7dj10ja1hs', 'users.export', 'users', 'export', NULL);


--
-- Data for Name: platform_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfex900jrxi7dlpf6ng61', 'cmu5qfex800jqxi7dqmra88y5', 'cmu5qfe700066xi7dt39q80ff', 'Project lead', 95.00, '2026-09-17 16:16:40.268');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfex900jsxi7dx8j68toy', 'cmu5qfex800jqxi7dqmra88y5', 'cmu5qfe730067xi7dkri6hdwe', 'Contributor', 72.00, '2026-09-17 16:16:40.268');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfex900jtxi7dhiexjk68', 'cmu5qfex800jqxi7dqmra88y5', 'cmu5qfe750068xi7d176qjjdr', 'Contributor', 72.00, '2026-09-17 16:16:40.268');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfexe00jvxi7dlmj6i1ze', 'cmu5qfexd00juxi7dtm1vq7t9', 'cmu5qfe700066xi7dt39q80ff', 'Project lead', 95.00, '2026-09-17 16:16:40.273');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfexe00jwxi7dnh4vhyqj', 'cmu5qfexd00juxi7dtm1vq7t9', 'cmu5qfe730067xi7dkri6hdwe', 'Contributor', 72.00, '2026-09-17 16:16:40.273');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfexe00jxxi7d5fuuld8e', 'cmu5qfexd00juxi7dtm1vq7t9', 'cmu5qfe750068xi7d176qjjdr', 'Contributor', 72.00, '2026-09-17 16:16:40.273');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfexh00jzxi7dxo8hyuqe', 'cmu5qfexh00jyxi7ddv0o42kj', 'cmu5qfe700066xi7dt39q80ff', 'Project lead', 95.00, '2026-09-17 16:16:40.277');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfexh00k0xi7dye8e7dgq', 'cmu5qfexh00jyxi7ddv0o42kj', 'cmu5qfe730067xi7dkri6hdwe', 'Contributor', 72.00, '2026-09-17 16:16:40.277');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu5qfexh00k1xi7d7j383n6o', 'cmu5qfexh00jyxi7ddv0o42kj', 'cmu5qfe750068xi7d176qjjdr', 'Contributor', 72.00, '2026-09-17 16:16:40.277');


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7o006dxi7dnuko14oq', 'cmu5qfe7n006cxi7dwfja7wl5', 'cmu5qfe5o005kxi7dtn5cieaj', 'Acoustic Ceiling Baffle', 'Suspended vertical baffle, 1200×300mm.', 3.000, 'unit', 108.00, 0.000, 10.000, 324.00, 0.00, 32.40, 356.40, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7o006exi7d98myvehv', 'cmu5qfe7n006cxi7dwfja7wl5', 'cmu5qfe4z005axi7dl1bjteys', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 14.000, 'unit', 165.00, 0.000, 10.000, 2310.00, 0.00, 231.00, 2541.00, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7o006fxi7du5lgqk1v', 'cmu5qfe7n006cxi7dwfja7wl5', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 13.000, 'unit', 79.00, 5.000, 10.000, 1027.00, 51.35, 97.57, 1073.22, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7o006gxi7d8ff6kg7k', 'cmu5qfe7n006cxi7dwfja7wl5', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7o006hxi7dic0ynop6', 'cmu5qfe7n006cxi7dwfja7wl5', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7w006kxi7diibhesyo', 'cmu5qfe7v006jxi7d5qya2e64', 'cmu5qfe4z005axi7dl1bjteys', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 13.000, 'unit', 165.00, 0.000, 10.000, 2145.00, 0.00, 214.50, 2359.50, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7w006lxi7d5v29cuxu', 'cmu5qfe7v006jxi7d5qya2e64', 'cmu5qfe4d0050xi7dxa7k9i8v', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 6.000, 'unit', 445.00, 5.000, 10.000, 2670.00, 133.50, 253.65, 2790.15, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7w006mxi7d4x5ic9bz', 'cmu5qfe7v006jxi7d5qya2e64', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 9.000, 'unit', 79.00, 5.000, 10.000, 711.00, 35.55, 67.55, 743.00, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe7w006nxi7do9xdy24h', 'cmu5qfe7v006jxi7d5qya2e64', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 8.000, 'hour', 88.00, 0.000, 10.000, 704.00, 0.00, 70.40, 774.40, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe83006qxi7dszuxo8ik', 'cmu5qfe83006pxi7dixzu2xle', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 11.000, 'unit', 45.00, 0.000, 10.000, 495.00, 0.00, 49.50, 544.50, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe83006rxi7duvicvg7t', 'cmu5qfe83006pxi7dixzu2xle', 'cmu5qfe5k005ixi7dip14tjcb', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 12.000, 'unit', 84.00, 0.000, 10.000, 1008.00, 0.00, 100.80, 1108.80, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe83006sxi7dez47vmny', 'cmu5qfe83006pxi7dixzu2xle', 'cmu5qfe4z005axi7dl1bjteys', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 7.000, 'unit', 165.00, 0.000, 10.000, 1155.00, 0.00, 115.50, 1270.50, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe83006txi7dvlnek67w', 'cmu5qfe83006pxi7dixzu2xle', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 14.000, 'hour', 88.00, 0.000, 10.000, 1232.00, 0.00, 123.20, 1355.20, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8b006wxi7dx40g7md9', 'cmu5qfe8a006vxi7dahvc922w', 'cmu5qfe49004yxi7dtni24pdo', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 8.000, 'unit', 1685.00, 0.000, 10.000, 13480.00, 0.00, 1348.00, 14828.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8b006xxi7di5xz2bv7', 'cmu5qfe8a006vxi7dahvc922w', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 5.000, 'unit', 399.00, 5.000, 10.000, 1995.00, 99.75, 189.53, 2084.78, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8b006yxi7d5zykowut', 'cmu5qfe8a006vxi7dahvc922w', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 14.000, 'hour', 125.00, 0.000, 10.000, 1750.00, 0.00, 175.00, 1925.00, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8i0071xi7ds952d08n', 'cmu5qfe8h0070xi7d9ztchxue', 'cmu5qfe64005sxi7d0kk6zzww', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 9.000, 'unit', 34.00, 0.000, 10.000, 306.00, 0.00, 30.60, 336.60, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8i0072xi7dz7qen6ll', 'cmu5qfe8h0070xi7d9ztchxue', 'cmu5qfe46004wxi7dzsbk6yl3', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 12.000, 'unit', 689.00, 0.000, 10.000, 8268.00, 0.00, 826.80, 9094.80, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8i0073xi7dp5q21p84', 'cmu5qfe8h0070xi7d9ztchxue', 'cmu5qfe4j0052xi7d3ktapiml', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 4.000, 'unit', 399.00, 5.000, 10.000, 1596.00, 79.80, 151.62, 1667.82, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8i0074xi7dffqjhda2', 'cmu5qfe8h0070xi7d9ztchxue', 'cmu5qfe4m0054xi7ds0ibubz5', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 14.000, 'unit', 459.00, 5.000, 10.000, 6426.00, 321.30, 610.47, 6715.17, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8i0075xi7dquyfv315', 'cmu5qfe8h0070xi7d9ztchxue', 'cmu5qfe6c005uxi7dufd2m472', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8o0078xi7df86ror69', 'cmu5qfe8o0077xi7davql731h', 'cmu5qfe4u0058xi7do392h6fr', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 8.000, 'unit', 1150.00, 0.000, 10.000, 9200.00, 0.00, 920.00, 10120.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8o0079xi7dhtmmnmpn', 'cmu5qfe8o0077xi7davql731h', 'cmu5qfe49004yxi7dtni24pdo', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 10.000, 'unit', 1685.00, 0.000, 10.000, 16850.00, 0.00, 1685.00, 18535.00, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8o007axi7d2epphrmt', 'cmu5qfe8o0077xi7davql731h', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 9.000, 'hour', 88.00, 0.000, 10.000, 792.00, 0.00, 79.20, 871.20, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8w007dxi7doxzn307o', 'cmu5qfe8v007cxi7dj46ojl3s', 'cmu5qfe5r005mxi7dqttogrcw', 'Phone Booth Single', 'Single-occupancy acoustic pod with ventilation and lighting.', 5.000, 'unit', 5290.00, 0.000, 10.000, 26450.00, 0.00, 2645.00, 29095.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8w007exi7dwmu0n19g', 'cmu5qfe8v007cxi7dj46ojl3s', 'cmu5qfe5u005oxi7dwggqerb0', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 4.000, 'unit', 79.00, 0.000, 10.000, 316.00, 0.00, 31.60, 347.60, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8w007fxi7d1bfa38z1', 'cmu5qfe8v007cxi7dj46ojl3s', 'cmu5qfe5y005qxi7dmr1135qk', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 5.000, 10.000, 540.00, 27.00, 51.30, 564.30, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8w007gxi7d8dwij5cg', 'cmu5qfe8v007cxi7dj46ojl3s', 'cmu5qfe4u0058xi7do392h6fr', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 7.000, 'unit', 1150.00, 0.000, 10.000, 8050.00, 0.00, 805.00, 8855.00, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe8w007hxi7dl6k8jr9p', 'cmu5qfe8v007cxi7dj46ojl3s', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 6.000, 'hour', 88.00, 0.000, 10.000, 528.00, 0.00, 52.80, 580.80, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe95007kxi7dlezsmwhq', 'cmu5qfe94007jxi7drt9d1ird', 'cmu5qfe41004uxi7ddcursik2', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 13.000, 'unit', 749.00, 0.000, 10.000, 9737.00, 0.00, 973.70, 10710.70, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe95007lxi7dncqgggnt', 'cmu5qfe94007jxi7drt9d1ird', 'cmu5qfe5f005gxi7d65bfsb6g', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 5.000, 'unit', 119.00, 0.000, 10.000, 595.00, 0.00, 59.50, 654.50, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe95007mxi7d260atnt3', 'cmu5qfe94007jxi7drt9d1ird', 'cmu5qfe49004yxi7dtni24pdo', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 9.000, 'unit', 1685.00, 0.000, 10.000, 15165.00, 0.00, 1516.50, 16681.50, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu5qfe95007nxi7daji9xyc1', 'cmu5qfe94007jxi7drt9d1ird', 'cmu5qfe6e005vxi7djw02yt35', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 11.000, 'hour', 88.00, 0.000, 10.000, 968.00, 0.00, 96.80, 1064.80, 3);


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0006xi7d90yx6ect');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0007xi7ddnnshpbs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0008xi7dzgmvk4dp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000vxi7dfzt9xwc4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000wxi7dp90t3yj5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000xxi7dsjx1p9t0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000yxi7d9jaak440');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0010xi7dnhnekpgf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0011xi7dezfn4rnl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0012xi7d1df7d1oo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001axi7ds5wuic5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001bxi7d7luv35sd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001cxi7d4it0cuas');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001dxi7dex86tc1k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001fxi7dz5r6ovk6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001gxi7dpeesmbdt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001hxi7dzck09m4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001ixi7dlxby8dun');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001kxi7dei51g7bd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001lxi7dz02z2smz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001mxi7dc7a96eiz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001pxi7dvzbk6dlh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001qxi7dlttdsi1f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001rxi7dha1cpx5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001uxi7dxhrxfkcs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001vxi7drywpjpmb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001wxi7d2yue7c7q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001xxi7dcp9oskz2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze001zxi7dgfrrx0k0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0020xi7dl0ckjh8q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0021xi7dap6k1fxh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0023xi7dltii4a68');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0024xi7dsv0sszzu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0025xi7ds4m3ykbx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0026xi7dmaavsw94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0027xi7dopq2no3l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0029xi7dezdovdy3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002axi7dfoy2w7kx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002bxi7dr138rk4s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002cxi7d8g7xu3o0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002exi7d05pflcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002fxi7d7ka1qqan');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002gxi7de6r552vn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002hxi7dxof7padv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002txi7dbz90rst8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002uxi7df66ik56v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002vxi7do4ngtuyd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002xxi7def24jwli');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002yxi7dee4m2hqe');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze002zxi7d4fl16hyt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0030xi7d610thnwt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0031xi7dizsrbt7n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0032xi7dihgz6564');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0033xi7di9ox2h36');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0034xi7d7epdz95i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0035xi7dv77pdzmr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfdzy0039xi7dy713enkx', 'cmu5qfdze0036xi7dj10ja1hs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0006xi7d90yx6ect');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0007xi7ddnnshpbs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0008xi7dzgmvk4dp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000vxi7dfzt9xwc4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000wxi7dp90t3yj5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000xxi7dsjx1p9t0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000yxi7d9jaak440');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0010xi7dnhnekpgf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0011xi7dezfn4rnl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0012xi7d1df7d1oo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001axi7ds5wuic5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001bxi7d7luv35sd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001cxi7d4it0cuas');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001dxi7dex86tc1k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001fxi7dz5r6ovk6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001gxi7dpeesmbdt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001hxi7dzck09m4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001ixi7dlxby8dun');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001kxi7dei51g7bd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001lxi7dz02z2smz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001mxi7dc7a96eiz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001pxi7dvzbk6dlh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001qxi7dlttdsi1f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001rxi7dha1cpx5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001uxi7dxhrxfkcs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001vxi7drywpjpmb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001wxi7d2yue7c7q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001xxi7dcp9oskz2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze001zxi7dgfrrx0k0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0020xi7dl0ckjh8q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0021xi7dap6k1fxh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0023xi7dltii4a68');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0024xi7dsv0sszzu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0025xi7ds4m3ykbx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0026xi7dmaavsw94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0027xi7dopq2no3l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0029xi7dezdovdy3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002axi7dfoy2w7kx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002bxi7dr138rk4s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002cxi7d8g7xu3o0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002exi7d05pflcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002fxi7d7ka1qqan');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002gxi7de6r552vn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002hxi7dxof7padv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002txi7dbz90rst8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002uxi7df66ik56v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002vxi7do4ngtuyd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002xxi7def24jwli');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002yxi7dee4m2hqe');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze002zxi7d4fl16hyt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0030xi7d610thnwt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0031xi7dizsrbt7n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0032xi7dihgz6564');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0033xi7di9ox2h36');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0034xi7d7epdz95i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0035xi7dv77pdzmr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe09003axi7didkifa1x', 'cmu5qfdze0036xi7dj10ja1hs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000vxi7dfzt9xwc4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000wxi7dp90t3yj5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000xxi7dsjx1p9t0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000yxi7d9jaak440');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0010xi7dnhnekpgf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0011xi7dezfn4rnl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0012xi7d1df7d1oo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001axi7ds5wuic5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001bxi7d7luv35sd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001cxi7d4it0cuas');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001dxi7dex86tc1k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001fxi7dz5r6ovk6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001gxi7dpeesmbdt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001hxi7dzck09m4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001ixi7dlxby8dun');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002exi7d05pflcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002fxi7d7ka1qqan');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002gxi7de6r552vn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002hxi7dxof7padv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0i003bxi7dply9nil8', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001kxi7dei51g7bd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001lxi7dz02z2smz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001mxi7dc7a96eiz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001pxi7dvzbk6dlh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001qxi7dlttdsi1f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001rxi7dha1cpx5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001uxi7dxhrxfkcs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001vxi7drywpjpmb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001wxi7d2yue7c7q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001xxi7dcp9oskz2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0023xi7dltii4a68');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0024xi7dsv0sszzu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0025xi7ds4m3ykbx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0026xi7dmaavsw94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0027xi7dopq2no3l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0o003cxi7dddjdquni', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0t003dxi7dcij76bqy', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe0x003exi7ddxfmp1me', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0006xi7d90yx6ect');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0007xi7ddnnshpbs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0008xi7dzgmvk4dp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000vxi7dfzt9xwc4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000wxi7dp90t3yj5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000xxi7dsjx1p9t0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000yxi7d9jaak440');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0010xi7dnhnekpgf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0011xi7dezfn4rnl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0012xi7d1df7d1oo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001axi7ds5wuic5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001bxi7d7luv35sd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001cxi7d4it0cuas');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001dxi7dex86tc1k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001fxi7dz5r6ovk6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001gxi7dpeesmbdt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001hxi7dzck09m4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001ixi7dlxby8dun');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001kxi7dei51g7bd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001lxi7dz02z2smz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001mxi7dc7a96eiz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001pxi7dvzbk6dlh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001qxi7dlttdsi1f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001rxi7dha1cpx5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001uxi7dxhrxfkcs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001vxi7drywpjpmb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001wxi7d2yue7c7q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001xxi7dcp9oskz2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze001zxi7dgfrrx0k0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0020xi7dl0ckjh8q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0021xi7dap6k1fxh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0023xi7dltii4a68');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0024xi7dsv0sszzu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0025xi7ds4m3ykbx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0026xi7dmaavsw94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0027xi7dopq2no3l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0029xi7dezdovdy3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002axi7dfoy2w7kx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002bxi7dr138rk4s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002cxi7d8g7xu3o0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002exi7d05pflcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002fxi7d7ka1qqan');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002gxi7de6r552vn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002hxi7dxof7padv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002txi7dbz90rst8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002uxi7df66ik56v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002vxi7do4ngtuyd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002xxi7def24jwli');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002yxi7dee4m2hqe');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze002zxi7d4fl16hyt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0030xi7d610thnwt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0031xi7dizsrbt7n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0032xi7dihgz6564');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0033xi7di9ox2h36');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0034xi7d7epdz95i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0035xi7dv77pdzmr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe1y003zxi7dfhojuk18', 'cmu5qfdze0036xi7dj10ja1hs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0006xi7d90yx6ect');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0007xi7ddnnshpbs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0008xi7dzgmvk4dp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000vxi7dfzt9xwc4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000wxi7dp90t3yj5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000xxi7dsjx1p9t0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000yxi7d9jaak440');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0010xi7dnhnekpgf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0011xi7dezfn4rnl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0012xi7d1df7d1oo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001axi7ds5wuic5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001bxi7d7luv35sd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001cxi7d4it0cuas');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001dxi7dex86tc1k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001fxi7dz5r6ovk6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001gxi7dpeesmbdt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001hxi7dzck09m4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001ixi7dlxby8dun');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001kxi7dei51g7bd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001lxi7dz02z2smz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001mxi7dc7a96eiz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001pxi7dvzbk6dlh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001qxi7dlttdsi1f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001rxi7dha1cpx5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001uxi7dxhrxfkcs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001vxi7drywpjpmb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001wxi7d2yue7c7q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001xxi7dcp9oskz2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze001zxi7dgfrrx0k0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0020xi7dl0ckjh8q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0021xi7dap6k1fxh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0023xi7dltii4a68');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0024xi7dsv0sszzu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0025xi7ds4m3ykbx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0026xi7dmaavsw94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0027xi7dopq2no3l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0029xi7dezdovdy3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002axi7dfoy2w7kx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002bxi7dr138rk4s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002cxi7d8g7xu3o0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002exi7d05pflcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002fxi7d7ka1qqan');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002gxi7de6r552vn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002hxi7dxof7padv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002txi7dbz90rst8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002uxi7df66ik56v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002vxi7do4ngtuyd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002xxi7def24jwli');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002yxi7dee4m2hqe');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze002zxi7d4fl16hyt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0030xi7d610thnwt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0031xi7dizsrbt7n');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0032xi7dihgz6564');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0033xi7di9ox2h36');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0034xi7d7epdz95i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0035xi7dv77pdzmr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe280040xi7dqqdy7gjk', 'cmu5qfdze0036xi7dj10ja1hs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000vxi7dfzt9xwc4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000wxi7dp90t3yj5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000xxi7dsjx1p9t0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000yxi7d9jaak440');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0010xi7dnhnekpgf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0011xi7dezfn4rnl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0012xi7d1df7d1oo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001axi7ds5wuic5p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001bxi7d7luv35sd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001cxi7d4it0cuas');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001dxi7dex86tc1k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001fxi7dz5r6ovk6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001gxi7dpeesmbdt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001hxi7dzck09m4e');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001ixi7dlxby8dun');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002exi7d05pflcye');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002fxi7d7ka1qqan');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002gxi7de6r552vn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002hxi7dxof7padv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2j0041xi7dqy7jngs1', 'cmu5qfdze0028xi7dn0uxb2w7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001jxi7dhse5ctch');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001kxi7dei51g7bd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001lxi7dz02z2smz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001mxi7dc7a96eiz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001nxi7dagzropc0');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000rxi7dbma8ro7y');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000sxi7drhzq75qw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000txi7dtoula618');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001oxi7dtsf2vv63');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001pxi7dvzbk6dlh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001qxi7dlttdsi1f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001rxi7dha1cpx5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001sxi7dhjvlwvu4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001txi7d639lkt98');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001uxi7dxhrxfkcs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001vxi7drywpjpmb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001wxi7d2yue7c7q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001xxi7dcp9oskz2');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0014xi7d02l0blnt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0015xi7d1djdvy6s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0016xi7dk087k8xn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0017xi7dsszdc8d9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0018xi7da5aghwls');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0023xi7dltii4a68');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0024xi7dsv0sszzu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0025xi7ds4m3ykbx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0026xi7dmaavsw94');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0027xi7dopq2no3l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000zxi7dksq0dmpo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0013xi7dk1w5youo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001yxi7dsoju80la');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0022xi7dst7szk3z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze000uxi7d0o76goyh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2s0042xi7dk29jmfw5', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000lxi7de2o40ow6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000mxi7dkealhi4z');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000nxi7djjvcodp4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000oxi7d3wu5pmie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000fxi7dixr64owq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000gxi7dggbmolm8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000hxi7d7tswvie5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000ixi7dk9p1zqnw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000jxi7dhar7nhuu');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000axi7dih1y0b60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000bxi7dertb06in');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000cxi7dysn2xngs');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000dxi7dgq8g7sy1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000exi7ddayv4t9q');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000pxi7dwmiwn7ts');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze000qxi7d62nyzy8c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze0009xi7d6ims95k8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze002sxi7dk10mtxyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze002wxi7d7tn6s9l3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze001exi7d2qmk3jw9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe2y0043xi7dxqd4uxsl', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze0005xi7dv0uqhs65');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002dxi7dugkjhmkp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze000kxi7dyf08yg2r');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze0019xi7dja1fsddc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002ixi7dqqk8yix7');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002jxi7d8iajzmsz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002kxi7duys04rpg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002lxi7dp39c9avt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002mxi7dt0jz4nsb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002nxi7d7lm7iuo8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002oxi7dfa0plchg');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002pxi7djbjyjpo3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002qxi7dfjqjl0ib');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze002rxi7dyabu3ngi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu5qfe330044xi7drq74rmu9', 'cmu5qfdze0028xi7dn0uxb2w7');


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexk00k2xi7d04gl7f3w', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', 'Confirm final desk layout with facilities team', NULL, 'DONE', 'HIGH', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-08 16:16:38.464', '2026-09-08 16:16:38.464', 3.00, 0, '2026-09-17 16:16:40.28', '2026-09-17 16:16:40.28', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexm00k3xi7dmt5d8byu', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', 'Place order for 42 sit-stand frames', NULL, 'DONE', 'URGENT', 'cmu5qfdy60001xi7dqvhm0z2x', '2026-09-13 16:16:38.464', '2026-09-13 16:16:38.464', 2.00, 1, '2026-09-17 16:16:40.282', '2026-09-17 16:16:40.282', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexn00k4xi7dex6wvtk7', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', 'Schedule phase two install weekend', NULL, 'IN_PROGRESS', 'HIGH', 'cmu5qfdy60002xi7df3nss1y1', '2026-09-23 16:16:38.464', NULL, 4.00, 2, '2026-09-17 16:16:40.283', '2026-09-17 16:16:40.283', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexp00k5xi7dcfubsq23', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', 'Snag list walkthrough with client', NULL, 'TODO', 'MEDIUM', 'cmu5qfdy60003xi7d4wwldzbi', '2026-10-05 16:16:38.464', NULL, 5.00, 3, '2026-09-17 16:16:40.285', '2026-09-17 16:16:40.285', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexr00k6xi7d2thlcdiv', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', 'Acoustic survey of the open-plan bay', NULL, 'DONE', 'MEDIUM', 'cmu5qfdy60004xi7drb9ya0a4', '2026-09-05 16:16:38.464', '2026-09-05 16:16:38.464', 6.00, 4, '2026-09-17 16:16:40.287', '2026-09-17 16:16:40.287', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexs00k7xi7dsscr2txr', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', 'Present two-option furniture scheme', NULL, 'IN_REVIEW', 'HIGH', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-20 16:16:38.464', NULL, 9.00, 5, '2026-09-17 16:16:40.288', '2026-09-17 16:16:40.288', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexu00k8xi7dccu1yncj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', 'Confirm lead time on phone booths', NULL, 'BLOCKED', 'URGENT', 'cmu5qfdy60001xi7dqvhm0z2x', '2026-09-18 16:16:38.464', NULL, 1.50, 6, '2026-09-17 16:16:40.29', '2026-09-17 16:16:40.29', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexv00k9xi7ddnzsrd5l', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', 'Issue revised quotation after value engineering', NULL, 'TODO', 'MEDIUM', 'cmu5qfdy60002xi7df3nss1y1', '2026-09-28 16:16:38.464', NULL, 3.00, 7, '2026-09-17 16:16:40.291', '2026-09-17 16:16:40.291', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexx00kaxi7dle1zfflm', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexh00jyxi7ddv0o42kj', 'Final handover pack and warranties', NULL, 'DONE', 'LOW', 'cmu5qfdy60003xi7d4wwldzbi', '2026-08-02 16:16:38.464', '2026-08-02 16:16:38.464', 2.00, 8, '2026-09-17 16:16:40.293', '2026-09-17 16:16:40.293', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexy00kbxi7dd0oexmfo', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'Refresh the 2026 price list', NULL, 'IN_PROGRESS', 'MEDIUM', 'cmu5qfdy60004xi7drb9ya0a4', '2026-10-01 16:16:38.464', NULL, 8.00, 9, '2026-09-17 16:16:40.294', '2026-09-17 16:16:40.294', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfexz00kcxi7dk7p7mk3s', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'Chase overdue balances above 30 days', NULL, 'TODO', 'HIGH', 'cmu5qfdxz0000xi7dmfw8krvy', '2026-09-19 16:16:38.464', NULL, 2.00, 10, '2026-09-17 16:16:40.295', '2026-09-17 16:16:40.295', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfey100kdxi7dqdbk1wlo', 'cmu5qfdzr0037xi7djkemxwps', NULL, 'Stock count in the acoustics aisle', NULL, 'TODO', 'LOW', 'cmu5qfdy60001xi7dqvhm0z2x', '2026-10-08 16:16:38.464', NULL, 4.00, 11, '2026-09-17 16:16:40.297', '2026-09-17 16:16:40.297', NULL);


--
-- Data for Name: tax_rates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tax_rates (id, "organizationId", name, rate, "isDefault", "isCompound", "isActive", "createdAt", "updatedAt") VALUES ('cmu5qfe15003hxi7dkcwvz7sf', 'cmu5qfdzr0037xi7djkemxwps', 'VAT', 10.000, true, false, true, '2026-09-17 16:16:39.113', '2026-09-17 16:16:39.113');
INSERT INTO public.tax_rates (id, "organizationId", name, rate, "isDefault", "isCompound", "isActive", "createdAt", "updatedAt") VALUES ('cmu5qfe370047xi7dp74nk766', 'cmu5qfe1v003xxi7dlcrq5rip', 'VAT', 10.000, true, false, true, '2026-09-17 16:16:39.187', '2026-09-17 16:16:39.187');


--
-- Data for Name: timesheets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfey200kexi7dpki8gksy', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', NULL, 'cmu5qfe730067xi7dkri6hdwe', NULL, '2026-09-10', 7.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 16:16:40.298', '2026-09-17 16:16:40.298');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfey400kfxi7dof0ynpy2', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', NULL, 'cmu5qfe750068xi7d176qjjdr', NULL, '2026-09-03', 9.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 16:16:40.3', '2026-09-17 16:16:40.3');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfey600kgxi7d20r8ls2h', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', NULL, 'cmu5qfe770069xi7d7bmvwbty', NULL, '2026-08-27', 5.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 16:16:40.302', '2026-09-17 16:16:40.302');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfey700khxi7dme44gxv2', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfex800jqxi7dqmra88y5', NULL, 'cmu5qfe79006axi7ds4h9lild', NULL, '2026-08-20', 7.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 16:16:40.303', '2026-09-17 16:16:40.303');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfey800kixi7dqez5rhje', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', NULL, 'cmu5qfe730067xi7dkri6hdwe', NULL, '2026-09-10', 4.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 16:16:40.304', '2026-09-17 16:16:40.304');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfey900kjxi7dld3p530l', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', NULL, 'cmu5qfe750068xi7d176qjjdr', NULL, '2026-09-03', 9.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 16:16:40.305', '2026-09-17 16:16:40.305');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfeyb00kkxi7d2f1y9mj7', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', NULL, 'cmu5qfe770069xi7d7bmvwbty', NULL, '2026-08-27', 8.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 16:16:40.307', '2026-09-17 16:16:40.307');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfeyc00klxi7dxb3arsiv', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexd00juxi7dtm1vq7t9', NULL, 'cmu5qfe79006axi7ds4h9lild', NULL, '2026-08-20', 9.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 16:16:40.308', '2026-09-17 16:16:40.308');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfeyc00kmxi7d01qouu4h', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexh00jyxi7ddv0o42kj', NULL, 'cmu5qfe730067xi7dkri6hdwe', NULL, '2026-09-10', 8.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 16:16:40.308', '2026-09-17 16:16:40.308');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfeyd00knxi7d8lmfzspp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexh00jyxi7ddv0o42kj', NULL, 'cmu5qfe750068xi7d176qjjdr', NULL, '2026-09-03', 7.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 16:16:40.309', '2026-09-17 16:16:40.309');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfeye00koxi7dnoxqzbzl', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexh00jyxi7ddv0o42kj', NULL, 'cmu5qfe770069xi7d7bmvwbty', NULL, '2026-08-27', 4.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 16:16:40.31', '2026-09-17 16:16:40.31');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu5qfeyf00kpxi7d1bayptct', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfexh00jyxi7ddv0o42kj', NULL, 'cmu5qfe79006axi7ds4h9lild', NULL, '2026-08-20', 8.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 16:16:40.311', '2026-09-17 16:16:40.311');


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfea50081xi7dw12jivqk', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 28032.54, 'GHS', 'Payment received for INV-2026-00001', 'Sales', '2026-03-28 00:00:00', 'PAY-2026-00001', NULL, 'cmu5qfe9e007pxi7denfuoelb', NULL, 'cmu5qfea20080xi7dvh3z1xdy', NULL, 'cmu5qfe6g005wxi7dii6bekpm', NULL, NULL, '2026-09-17 16:16:39.437', '2026-09-17 16:16:39.437', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeao008bxi7d2v4lcqph', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 11964.70, 'GHS', 'Payment received for INV-2026-00002', 'Sales', '2026-04-27 00:00:00', 'PAY-2026-00002', NULL, 'cmu5qfeac0083xi7dt0jtb2m4', NULL, 'cmu5qfeam008axi7dnk00l207', NULL, 'cmu5qfe6i005xxi7dj4aemiz1', NULL, NULL, '2026-09-17 16:16:39.456', '2026-09-17 16:16:39.456', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeba008lxi7d9b5fdq56', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 11829.73, 'GHS', 'Payment received for INV-2026-00003', 'Sales', '2026-04-29 00:00:00', 'PAY-2026-00003', NULL, 'cmu5qfeaw008dxi7d4jv5kmnp', NULL, 'cmu5qfeb8008kxi7dznuqd2vk', NULL, 'cmu5qfe6k005yxi7dheo9lpoa', NULL, NULL, '2026-09-17 16:16:39.478', '2026-09-17 16:16:39.478', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfec3008zxi7dpk1b0ftw', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 25208.81, 'GHS', 'Payment received for INV-2026-00004', 'Sales', '2026-06-03 00:00:00', 'PAY-2026-00004', NULL, 'cmu5qfebh008nxi7deh53x5iu', NULL, 'cmu5qfec1008yxi7dmo4fa7y6', NULL, 'cmu5qfe6m005zxi7djbndzaq0', NULL, NULL, '2026-09-17 16:16:39.507', '2026-09-17 16:16:39.507', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfecz009dxi7dad36wkg5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 24829.78, 'GHS', 'Payment received for INV-2026-00005', 'Sales', '2026-05-15 00:00:00', 'PAY-2026-00005', NULL, 'cmu5qfeca0091xi7dvoal6wma', NULL, 'cmu5qfecx009cxi7d9pkoglpp', NULL, 'cmu5qfe6q0060xi7dh0m5fxv6', NULL, NULL, '2026-09-17 16:16:39.539', '2026-09-17 16:16:39.539', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfedj009nxi7d8lbda0ny', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 8505.64, 'GHS', 'Payment received for INV-2026-00006', 'Sales', '2026-05-19 00:00:00', 'PAY-2026-00006', NULL, 'cmu5qfed6009fxi7ddr2fch5g', NULL, 'cmu5qfedh009mxi7d3s7mdt1v', NULL, 'cmu5qfe6s0061xi7dci8v10qe', NULL, NULL, '2026-09-17 16:16:39.559', '2026-09-17 16:16:39.559', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfee5009xxi7dxuvfq4zs', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 5188.70, 'GHS', 'Payment received for INV-2026-00007', 'Sales', '2026-06-17 00:00:00', 'PAY-2026-00007', NULL, 'cmu5qfedq009pxi7dj512f3po', NULL, 'cmu5qfee3009wxi7dc15p83ot', NULL, 'cmu5qfe6u0062xi7de4xegtki', NULL, NULL, '2026-09-17 16:16:39.581', '2026-09-17 16:16:39.581', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeer00a9xi7d0t6yzc89', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 3492.94, 'GHS', 'Payment received for INV-2026-00008', 'Sales', '2026-06-15 00:00:00', 'PAY-2026-00008', NULL, 'cmu5qfeec009zxi7d7qlwprdi', NULL, 'cmu5qfeep00a8xi7dn7xehzpq', NULL, 'cmu5qfe6v0063xi7d2u45voj8', NULL, NULL, '2026-09-17 16:16:39.603', '2026-09-17 16:16:39.603', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeff00alxi7dq3k9w1qx', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 12499.91, 'GHS', 'Payment received for INV-2026-00009', 'Sales', '2026-06-09 00:00:00', 'PAY-2026-00009', NULL, 'cmu5qfeez00abxi7d6qhaa1yf', NULL, 'cmu5qfefe00akxi7ddy5feycc', NULL, 'cmu5qfe6w0064xi7d8qto7xt1', NULL, NULL, '2026-09-17 16:16:39.627', '2026-09-17 16:16:39.627', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeg100axxi7d1oie5zm5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 19218.65, 'GHS', 'Payment received for INV-2026-00010', 'Sales', '2026-07-11 00:00:00', 'PAY-2026-00010', NULL, 'cmu5qfefm00anxi7dktvq1a5r', NULL, 'cmu5qfefz00awxi7dciat6qay', NULL, 'cmu5qfe6y0065xi7d5218zaog', NULL, NULL, '2026-09-17 16:16:39.649', '2026-09-17 16:16:39.649', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfegq00bbxi7dmclwzbjp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 4049.21, 'GHS', 'Payment received for INV-2026-00011', 'Sales', '2026-07-13 00:00:00', 'PAY-2026-00011', NULL, 'cmu5qfeg800azxi7d74kdnsa7', NULL, 'cmu5qfegp00baxi7d5mjw9t2q', NULL, 'cmu5qfe6g005wxi7dii6bekpm', NULL, NULL, '2026-09-17 16:16:39.674', '2026-09-17 16:16:39.674', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfehh00bpxi7d1mbdjrp8', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 26660.48, 'GHS', 'Payment received for INV-2026-00012', 'Sales', '2026-07-13 00:00:00', 'PAY-2026-00012', NULL, 'cmu5qfegx00bdxi7d0l73uq4e', NULL, 'cmu5qfehf00boxi7ds5u0nt14', NULL, 'cmu5qfe6i005xxi7dj4aemiz1', NULL, NULL, '2026-09-17 16:16:39.701', '2026-09-17 16:16:39.701', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfei500bzxi7d3je79juu', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 11531.07, 'GHS', 'Payment received for INV-2026-00013', 'Sales', '2026-07-09 00:00:00', 'PAY-2026-00013', NULL, 'cmu5qfehp00brxi7ds3d8jv6u', NULL, 'cmu5qfei200byxi7dfkj7bdqe', NULL, 'cmu5qfe6k005yxi7dheo9lpoa', NULL, NULL, '2026-09-17 16:16:39.725', '2026-09-17 16:16:39.725', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeip00c9xi7dmj2km7xs', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 22359.70, 'GHS', 'Payment received for INV-2026-00014', 'Sales', '2026-07-18 00:00:00', 'PAY-2026-00014', NULL, 'cmu5qfeic00c1xi7daoalnziq', NULL, 'cmu5qfein00c8xi7d7gijht5g', NULL, 'cmu5qfe6m005zxi7djbndzaq0', NULL, NULL, '2026-09-17 16:16:39.745', '2026-09-17 16:16:39.745', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfejf00clxi7d8ycbhxo5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 13525.60, 'GHS', 'Payment received for INV-2026-00015', 'Sales', '2026-07-26 00:00:00', 'PAY-2026-00015', NULL, 'cmu5qfeix00cbxi7dqa1y0e7j', NULL, 'cmu5qfejd00ckxi7d5rsnmmmt', NULL, 'cmu5qfe6q0060xi7dh0m5fxv6', NULL, NULL, '2026-09-17 16:16:39.771', '2026-09-17 16:16:39.771', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfek500cxxi7dstcrfdbz', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 11889.90, 'GHS', 'Payment received for INV-2026-00016', 'Sales', '2026-08-22 00:00:00', 'PAY-2026-00016', NULL, 'cmu5qfejo00cnxi7djhxdoaki', NULL, 'cmu5qfek300cwxi7d5dsuad64', NULL, 'cmu5qfe6s0061xi7dci8v10qe', NULL, NULL, '2026-09-17 16:16:39.797', '2026-09-17 16:16:39.797', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfekt00d7xi7d4m4pw9cd', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 11336.93, 'GHS', 'Payment received for INV-2026-00017', 'Sales', '2026-08-12 00:00:00', 'PAY-2026-00017', NULL, 'cmu5qfekf00czxi7dpp88xlzf', NULL, 'cmu5qfekr00d6xi7dsoj0jhbg', NULL, 'cmu5qfe6u0062xi7de4xegtki', NULL, NULL, '2026-09-17 16:16:39.821', '2026-09-17 16:16:39.821', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfelg00djxi7d0lgyec2y', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 49250.41, 'GHS', 'Payment received for INV-2026-00018', 'Sales', '2026-08-17 00:00:00', 'PAY-2026-00018', NULL, 'cmu5qfel000d9xi7d99nbufls', NULL, 'cmu5qfele00dixi7d4i55m1qg', NULL, 'cmu5qfe6v0063xi7d2u45voj8', NULL, NULL, '2026-09-17 16:16:39.844', '2026-09-17 16:16:39.844', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfelv00drxi7ds1ssgc8v', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 3125.10, 'GHS', 'Payment received for INV-2026-00019', 'Sales', '2026-09-01 00:00:00', 'PAY-2026-00019', NULL, 'cmu5qfelm00dlxi7dj70mf7oh', NULL, 'cmu5qfelt00dqxi7dbpvrcy6s', NULL, 'cmu5qfe6w0064xi7d8qto7xt1', NULL, NULL, '2026-09-17 16:16:39.859', '2026-09-17 16:16:39.859', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfen000eexi7dadj4dh3x', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 3565.10, 'GHS', 'Payment received for INV-2026-00022', 'Sales', '2026-09-18 00:00:00', 'PAY-2026-00020', NULL, 'cmu5qfemo00e6xi7d4h5tje75', NULL, 'cmu5qfemy00edxi7dj9p23sb4', NULL, 'cmu5qfe6i005xxi7dj4aemiz1', NULL, NULL, '2026-09-17 16:16:39.9', '2026-09-17 16:16:39.9', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeo500f2xi7d2muxfygl', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 5913.31, 'GHS', 'Payment received for INV-2026-00025', 'Sales', '2026-09-21 00:00:00', 'PAY-2026-00021', NULL, 'cmu5qfenr00euxi7dq5usropr', NULL, 'cmu5qfeo300f1xi7d70dk4nh2', NULL, 'cmu5qfe6q0060xi7dh0m5fxv6', NULL, NULL, '2026-09-17 16:16:39.941', '2026-09-17 16:16:39.941', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeom00fcxi7d7fqjul7k', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 1370.60, 'GHS', 'Payment received for INV-2026-00026', 'Sales', '2026-09-24 00:00:00', 'PAY-2026-00022', NULL, 'cmu5qfeob00f4xi7d4ss8nqwm', NULL, 'cmu5qfeol00fbxi7d5veudmxd', NULL, 'cmu5qfe6s0061xi7dci8v10qe', NULL, NULL, '2026-09-17 16:16:39.958', '2026-09-17 16:16:39.958', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfep500fmxi7dp0ljyu0d', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 10669.40, 'GHS', 'Payment received for INV-2026-00027', 'Sales', '2026-09-15 00:00:00', 'PAY-2026-00023', NULL, 'cmu5qfeos00fexi7dk2bv8eo8', NULL, 'cmu5qfep300flxi7d6bfkh5u0', NULL, 'cmu5qfe6u0062xi7de4xegtki', NULL, NULL, '2026-09-17 16:16:39.977', '2026-09-17 16:16:39.977', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeq100g5xi7dvedit5ir', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 9989.20, 'GHS', 'Payment received for INV-2026-00029', 'Sales', '2026-09-22 00:00:00', 'PAY-2026-00024', NULL, 'cmu5qfepm00fvxi7d0n73mgtd', NULL, 'cmu5qfepz00g4xi7dwimtjn9g', NULL, 'cmu5qfe6w0064xi7d8qto7xt1', NULL, NULL, '2026-09-17 16:16:40.009', '2026-09-17 16:16:40.009', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeqg00gdxi7dazuaz7t1', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'INCOME', 2668.60, 'GHS', 'Payment received for INV-2026-00030', 'Sales', '2026-10-03 00:00:00', 'PAY-2026-00025', NULL, 'cmu5qfeq700g7xi7d9kry6ibd', NULL, 'cmu5qfeqe00gcxi7dekgo9i0d', NULL, 'cmu5qfe6y0065xi7d5218zaog', NULL, NULL, '2026-09-17 16:16:40.024', '2026-09-17 16:16:40.024', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeqq00ggxi7dhk39vgan', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -9240.00, 'GHS', 'Warehouse rent, quarterly', 'Rent & facilities', '2026-09-05 00:00:00', 'EXP-2026-00001', NULL, NULL, NULL, NULL, 'cmu5qfeqn00gfxi7daqvqvvxj', NULL, NULL, NULL, '2026-09-17 16:16:40.034', '2026-09-17 16:16:40.034', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeqw00gjxi7dybhaqe5r', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls', 'Travel', '2026-09-12 00:00:00', 'EXP-2026-00002', NULL, NULL, NULL, NULL, 'cmu5qfeqv00gixi7d4k2d0k7x', NULL, NULL, NULL, '2026-09-17 16:16:40.04', '2026-09-17 16:16:40.04', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfer400gmxi7dmxiwl8hl', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats)', 'Software & subscriptions', '2026-08-29 00:00:00', 'EXP-2026-00003', NULL, NULL, NULL, NULL, 'cmu5qfer300glxi7dvuhxthxx', NULL, NULL, NULL, '2026-09-17 16:16:40.048', '2026-09-17 16:16:40.048', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qferc00gpxi7dqmkulz9v', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3575.00, 'GHS', 'Trade show stand at Workspace Expo', 'Marketing', '2026-08-21 00:00:00', 'EXP-2026-00004', NULL, NULL, NULL, NULL, 'cmu5qfera00goxi7d36t83r4t', NULL, NULL, NULL, '2026-09-17 16:16:40.056', '2026-09-17 16:16:40.056', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qferq00gsxi7dm36v0g4c', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity', 'Utilities', '2026-09-09 00:00:00', 'EXP-2026-00005', NULL, NULL, NULL, NULL, 'cmu5qfern00grxi7dldqtzvt4', NULL, NULL, NULL, '2026-09-17 16:16:40.07', '2026-09-17 16:16:40.07', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qferx00gvxi7db09mohr7', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1298.00, 'GHS', 'Forklift annual service', 'Equipment', '2026-08-14 00:00:00', 'EXP-2026-00006', NULL, NULL, NULL, NULL, 'cmu5qferv00guxi7dxa8hv71z', NULL, NULL, NULL, '2026-09-17 16:16:40.077', '2026-09-17 16:16:40.077', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfes400gyxi7d1hggwmxp', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer', 'Professional services', '2026-09-02 00:00:00', 'EXP-2026-00007', NULL, NULL, NULL, NULL, 'cmu5qfes200gxxi7dkgx7za5t', NULL, NULL, NULL, '2026-09-17 16:16:40.084', '2026-09-17 16:16:40.084', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesb00h1xi7d7jf381qe', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -438.57, 'GHS', 'Packing materials and pallets', 'Office supplies', '2026-09-14 00:00:00', 'EXP-2026-00008', NULL, NULL, NULL, NULL, 'cmu5qfes900h0xi7d9zjnyvth', NULL, NULL, NULL, '2026-09-17 16:16:40.091', '2026-09-17 16:16:40.091', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesi00h4xi7dibr4zpnt', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -950.40, 'GHS', 'Installer team overnight accommodation', 'Travel', '2026-08-27 00:00:00', 'EXP-2026-00009', NULL, NULL, NULL, NULL, 'cmu5qfesg00h3xi7dc5g2ul0z', NULL, NULL, NULL, '2026-09-17 16:16:40.098', '2026-09-17 16:16:40.098', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesp00h7xi7dsdh3hpwe', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -2464.00, 'GHS', 'Liability insurance premium', 'Professional services', '2026-08-03 00:00:00', 'EXP-2026-00010', NULL, NULL, NULL, NULL, 'cmu5qfesn00h6xi7dsw79hms5', NULL, NULL, NULL, '2026-09-17 16:16:40.105', '2026-09-17 16:16:40.105', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfesw00haxi7dx89vixz4', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, current month', 'Rent & facilities', '2026-08-31 00:00:00', 'EXP-2026-00011', NULL, NULL, NULL, NULL, 'cmu5qfesv00h9xi7depuprkup', NULL, NULL, NULL, '2026-09-17 16:16:40.112', '2026-09-17 16:16:40.112', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfet300hdxi7decpaibhf', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), current month', 'Software & subscriptions', '2026-09-02 00:00:00', 'EXP-2026-00012', NULL, NULL, NULL, NULL, 'cmu5qfet100hcxi7d6m47mc6h', NULL, NULL, NULL, '2026-09-17 16:16:40.119', '2026-09-17 16:16:40.119', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfet800hgxi7d2g2vfqsi', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, current month', 'Utilities', '2026-09-06 00:00:00', 'EXP-2026-00013', NULL, NULL, NULL, NULL, 'cmu5qfet700hfxi7dxwxl2ztz', NULL, NULL, NULL, '2026-09-17 16:16:40.124', '2026-09-17 16:16:40.124', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfete00hjxi7d689ggs7v', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, current month', 'Professional services', '2026-09-04 00:00:00', 'EXP-2026-00014', NULL, NULL, NULL, NULL, 'cmu5qfetd00hixi7d8dhzk56u', NULL, NULL, NULL, '2026-09-17 16:16:40.13', '2026-09-17 16:16:40.13', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfetk00hmxi7dh2a8o99y', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, current month', 'Travel', '2026-09-02 00:00:00', 'EXP-2026-00015', NULL, NULL, NULL, NULL, 'cmu5qfeti00hlxi7d7cwq4w8s', NULL, NULL, NULL, '2026-09-17 16:16:40.136', '2026-09-17 16:16:40.136', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfetp00hpxi7d4x9p1tye', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 1 month ago', 'Rent & facilities', '2026-08-10 00:00:00', 'EXP-2026-00016', NULL, NULL, NULL, NULL, 'cmu5qfeto00hoxi7dthw9660n', NULL, NULL, NULL, '2026-09-17 16:16:40.141', '2026-09-17 16:16:40.141', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfett00hsxi7dfdjg84dl', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 1 month ago', 'Software & subscriptions', '2026-08-07 00:00:00', 'EXP-2026-00017', NULL, NULL, NULL, NULL, 'cmu5qfets00hrxi7dj2v01xyx', NULL, NULL, NULL, '2026-09-17 16:16:40.145', '2026-09-17 16:16:40.145', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfety00hvxi7dmjs5tl4m', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 1 month ago', 'Utilities', '2026-08-02 00:00:00', 'EXP-2026-00018', NULL, NULL, NULL, NULL, 'cmu5qfetx00huxi7d3bprddq8', NULL, NULL, NULL, '2026-09-17 16:16:40.15', '2026-09-17 16:16:40.15', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeu300hyxi7dw9j4x29i', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 1 month ago', 'Professional services', '2026-08-01 00:00:00', 'EXP-2026-00019', NULL, NULL, NULL, NULL, 'cmu5qfeu200hxxi7drxp57cda', NULL, NULL, NULL, '2026-09-17 16:16:40.155', '2026-09-17 16:16:40.155', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeu700i1xi7d875hy9la', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 1 month ago', 'Travel', '2026-08-16 00:00:00', 'EXP-2026-00020', NULL, NULL, NULL, NULL, 'cmu5qfeu600i0xi7dnb3edvg8', NULL, NULL, NULL, '2026-09-17 16:16:40.159', '2026-09-17 16:16:40.159', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeuc00i4xi7d5wa13bbe', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 2 months ago', 'Rent & facilities', '2026-07-06 00:00:00', 'EXP-2026-00021', NULL, NULL, NULL, NULL, 'cmu5qfeub00i3xi7dwf79arxh', NULL, NULL, NULL, '2026-09-17 16:16:40.164', '2026-09-17 16:16:40.164', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeuh00i7xi7dt4wc0c9e', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 2 months ago', 'Software & subscriptions', '2026-07-04 00:00:00', 'EXP-2026-00022', NULL, NULL, NULL, NULL, 'cmu5qfeug00i6xi7dz34p5ni8', NULL, NULL, NULL, '2026-09-17 16:16:40.169', '2026-09-17 16:16:40.169', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeum00iaxi7dflorrfea', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 2 months ago', 'Utilities', '2026-07-13 00:00:00', 'EXP-2026-00023', NULL, NULL, NULL, NULL, 'cmu5qfeul00i9xi7d2yavbw0f', NULL, NULL, NULL, '2026-09-17 16:16:40.174', '2026-09-17 16:16:40.174', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeur00idxi7dgjxk4w1a', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 2 months ago', 'Professional services', '2026-07-03 00:00:00', 'EXP-2026-00024', NULL, NULL, NULL, NULL, 'cmu5qfeuq00icxi7do4rj8os0', NULL, NULL, NULL, '2026-09-17 16:16:40.179', '2026-09-17 16:16:40.179', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeuw00igxi7d2swhvx6j', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 2 months ago', 'Travel', '2026-07-07 00:00:00', 'EXP-2026-00025', NULL, NULL, NULL, NULL, 'cmu5qfeuv00ifxi7dnp5ahpti', NULL, NULL, NULL, '2026-09-17 16:16:40.184', '2026-09-17 16:16:40.184', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfev100ijxi7d58it5vcs', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 3 months ago', 'Rent & facilities', '2026-06-03 00:00:00', 'EXP-2026-00026', NULL, NULL, NULL, NULL, 'cmu5qfev000iixi7d8iwuxa92', NULL, NULL, NULL, '2026-09-17 16:16:40.189', '2026-09-17 16:16:40.189', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfev600imxi7dm7i0mw1y', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 3 months ago', 'Software & subscriptions', '2026-05-31 00:00:00', 'EXP-2026-00027', NULL, NULL, NULL, NULL, 'cmu5qfev500ilxi7ddyq77j8q', NULL, NULL, NULL, '2026-09-17 16:16:40.194', '2026-09-17 16:16:40.194', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevc00ipxi7dmh4j85fx', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 3 months ago', 'Utilities', '2026-06-11 00:00:00', 'EXP-2026-00028', NULL, NULL, NULL, NULL, 'cmu5qfevb00ioxi7d5xdhl8b3', NULL, NULL, NULL, '2026-09-17 16:16:40.201', '2026-09-17 16:16:40.201', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevh00isxi7diq5mat97', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 3 months ago', 'Professional services', '2026-06-07 00:00:00', 'EXP-2026-00029', NULL, NULL, NULL, NULL, 'cmu5qfevg00irxi7di5uqmkk7', NULL, NULL, NULL, '2026-09-17 16:16:40.205', '2026-09-17 16:16:40.205', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevn00ivxi7dvxg1cais', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 3 months ago', 'Travel', '2026-06-02 00:00:00', 'EXP-2026-00030', NULL, NULL, NULL, NULL, 'cmu5qfevm00iuxi7dzfqmhl8y', NULL, NULL, NULL, '2026-09-17 16:16:40.211', '2026-09-17 16:16:40.211', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevs00iyxi7dfcdf06qq', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 4 months ago', 'Rent & facilities', '2026-05-13 00:00:00', 'EXP-2026-00031', NULL, NULL, NULL, NULL, 'cmu5qfevr00ixxi7dgyw5isl3', NULL, NULL, NULL, '2026-09-17 16:16:40.216', '2026-09-17 16:16:40.216', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfevx00j1xi7dyi30diqb', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 4 months ago', 'Software & subscriptions', '2026-05-07 00:00:00', 'EXP-2026-00032', NULL, NULL, NULL, NULL, 'cmu5qfevw00j0xi7d2cu0oumg', NULL, NULL, NULL, '2026-09-17 16:16:40.221', '2026-09-17 16:16:40.221', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfew200j4xi7dhi5go09m', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 4 months ago', 'Utilities', '2026-05-10 00:00:00', 'EXP-2026-00033', NULL, NULL, NULL, NULL, 'cmu5qfew100j3xi7ds9oygbf7', NULL, NULL, NULL, '2026-09-17 16:16:40.226', '2026-09-17 16:16:40.226', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfew700j7xi7dxcc1uhfd', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 4 months ago', 'Professional services', '2026-05-16 00:00:00', 'EXP-2026-00034', NULL, NULL, NULL, NULL, 'cmu5qfew600j6xi7d4g208s2b', NULL, NULL, NULL, '2026-09-17 16:16:40.231', '2026-09-17 16:16:40.231', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewc00jaxi7dobe9pdmc', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 4 months ago', 'Travel', '2026-05-03 00:00:00', 'EXP-2026-00035', NULL, NULL, NULL, NULL, 'cmu5qfewb00j9xi7dzqtrw4l0', NULL, NULL, NULL, '2026-09-17 16:16:40.236', '2026-09-17 16:16:40.236', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewh00jdxi7dv0zzox25', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 5 months ago', 'Rent & facilities', '2026-04-18 00:00:00', 'EXP-2026-00036', NULL, NULL, NULL, NULL, 'cmu5qfewg00jcxi7dndlq8abc', NULL, NULL, NULL, '2026-09-17 16:16:40.241', '2026-09-17 16:16:40.241', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewm00jgxi7dfy0dsnxk', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 5 months ago', 'Software & subscriptions', '2026-04-16 00:00:00', 'EXP-2026-00037', NULL, NULL, NULL, NULL, 'cmu5qfewl00jfxi7dtxhyy79u', NULL, NULL, NULL, '2026-09-17 16:16:40.246', '2026-09-17 16:16:40.246', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfewr00jjxi7dwkztc2hj', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 5 months ago', 'Utilities', '2026-04-16 00:00:00', 'EXP-2026-00038', NULL, NULL, NULL, NULL, 'cmu5qfewq00jixi7d7753jn6t', NULL, NULL, NULL, '2026-09-17 16:16:40.251', '2026-09-17 16:16:40.251', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfeww00jmxi7d2cuf6pv5', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003ixi7d27rx7lkl', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 5 months ago', 'Professional services', '2026-04-11 00:00:00', 'EXP-2026-00039', NULL, NULL, NULL, NULL, 'cmu5qfewv00jlxi7d4v05qmxe', NULL, NULL, NULL, '2026-09-17 16:16:40.256', '2026-09-17 16:16:40.256', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu5qfex200jpxi7dzrwzak49', 'cmu5qfdzr0037xi7djkemxwps', 'cmu5qfe18003jxi7dc88nh70f', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 5 months ago', 'Travel', '2026-04-11 00:00:00', 'EXP-2026-00040', NULL, NULL, NULL, NULL, 'cmu5qfex100joxi7dh9o80r5h', NULL, NULL, NULL, '2026-09-17 16:16:40.262', '2026-09-17 16:16:40.262', NULL);


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict ApoLEJREsoLhLAeBTdkk70Z8LrefUvHAoYSaGkr5X3rVTVuumDPvFMUHCfcZkG3

COMMIT;

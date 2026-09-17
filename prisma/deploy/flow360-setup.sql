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

-- ===== demo dataset =====
--
-- PostgreSQL database dump
--

\restrict 4EgGeSEtfkxsl6PVZhpFxdYEk3xXc4MTpM0Furupkhoey9WgM7iJ2ffKYNTb87X

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

INSERT INTO public.organizations (id, name, slug, "legalName", email, phone, website, "taxId", "logoUrl", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, timezone, industry, plan, "isActive", "createdAt", "updatedAt", "deletedAt", "requestedPlan", "subscriptionStatus", "trialEndsAt", "requestedBilling", "paystackCustomer", "paystackEmailToken", "paystackSubscription", "subscriptionEndsAt") VALUES ('cmu4u5eus0037jx7dx1af4of5', 'Northwind Supply Co.', 'northwind-supply-co', 'Northwind Supply Company LLC', 'accounts@northwindsupply.example', '+1 (415) 555-0200', 'https://northwindsupply.example', 'US-884-120-663', NULL, '1400 Cesar Chavez Street', 'Unit 22', 'San Francisco', 'CA', '94107', 'Ghana', 'GHS', 'Africa/Accra', 'Commercial interiors', 'business', true, '2026-09-17 01:13:05.908', '2026-09-17 01:13:05.976', NULL, NULL, 'trialing', '2026-10-05 01:13:05.335', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.organizations (id, name, slug, "legalName", email, phone, website, "taxId", "logoUrl", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, timezone, industry, plan, "isActive", "createdAt", "updatedAt", "deletedAt", "requestedPlan", "subscriptionStatus", "trialEndsAt", "requestedBilling", "paystackCustomer", "paystackEmailToken", "paystackSubscription", "subscriptionEndsAt") VALUES ('cmu4u5ewt003xjx7d38fw5vj4', 'Harbour Fitouts Ltd.', 'harbour-fitouts', NULL, 'hello@harbourfitouts.example', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Ghana', 'GHS', 'Africa/Accra', NULL, 'business', true, '2026-09-17 01:13:05.981', '2026-09-17 01:13:06.026', NULL, NULL, 'trialing', '2026-09-21 01:13:05.335', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5exy0048jx7dcj8y0l3j', 'cmu4u5ewt003xjx7d38fw5vj4', 'Main business account', 'BANK', NULL, NULL, 'GHS', 0.00, 0.00, NULL, true, true, '2026-09-17 01:13:06.022', '2026-09-17 01:13:06.022', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5exy0049jx7d7dmjb6lg', 'cmu4u5ewt003xjx7d38fw5vj4', 'Petty cash', 'CASH', NULL, NULL, 'GHS', 0.00, 0.00, NULL, false, true, '2026-09-17 01:13:06.022', '2026-09-17 01:13:06.022', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5eus0037jx7dx1af4of5', 'Main business account', 'BANK', NULL, NULL, 'GHS', 0.00, 288710.62, NULL, true, true, '2026-09-17 01:13:05.961', '2026-09-17 01:13:07.049', NULL);
INSERT INTO public.accounts (id, "organizationId", name, type, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", description, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ew9003jjx7dz9qtry7j', 'cmu4u5eus0037jx7dx1af4of5', 'Petty cash', 'CASH', NULL, NULL, 'GHS', 0.00, -11840.95, NULL, false, true, '2026-09-17 01:13:05.961', '2026-09-17 01:13:07.054', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu4u5et20000jx7dcz9ph7f0', 'owner@northwindsupply.example', 'Alex Moreno', '$2b$12$v5mZj074R/ndQErK6fxOa.D1liLn8GluCtmK0a9BuEpoAfD5qp69G', NULL, '+1 (415) 555-0201', 'Managing Director', '2026-09-17 01:13:05.335', NULL, true, '2026-09-17 01:13:05.846', '2026-09-17 01:13:05.846', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu4u5et90001jx7dqi719aiu', 'nadia@northwindsupply.example', 'Nadia Osei', '$2b$12$v5mZj074R/ndQErK6fxOa.D1liLn8GluCtmK0a9BuEpoAfD5qp69G', NULL, NULL, 'Head of Sales', '2026-09-17 01:13:05.335', NULL, true, '2026-09-17 01:13:05.853', '2026-09-17 01:13:05.853', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu4u5et90002jx7d1m0qar2v', 'clara@northwindsupply.example', 'Clara Nkemelu', '$2b$12$v5mZj074R/ndQErK6fxOa.D1liLn8GluCtmK0a9BuEpoAfD5qp69G', NULL, NULL, 'Management Accountant', '2026-09-17 01:13:05.335', NULL, true, '2026-09-17 01:13:05.853', '2026-09-17 01:13:05.853', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu4u5et90003jx7d1ok8xhqo', 'sophie@northwindsupply.example', 'Sophie Lang', '$2b$12$v5mZj074R/ndQErK6fxOa.D1liLn8GluCtmK0a9BuEpoAfD5qp69G', NULL, NULL, 'Interior Designer', '2026-09-17 01:13:05.335', NULL, true, '2026-09-17 01:13:05.853', '2026-09-17 01:13:05.853', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu4u5et90004jx7dzuzi8zue', 'ben@northwindsupply.example', 'Ben Ferraro', '$2b$12$v5mZj074R/ndQErK6fxOa.D1liLn8GluCtmK0a9BuEpoAfD5qp69G', NULL, NULL, 'Operations Manager', '2026-09-17 01:13:05.335', NULL, true, '2026-09-17 01:13:05.853', '2026-09-17 01:13:05.853', false);
INSERT INTO public.users (id, email, name, "passwordHash", "avatarUrl", phone, "jobTitle", "emailVerified", "lastLoginAt", "isActive", "createdAt", "updatedAt", "isPlatformAdmin") VALUES ('cmu4u5ewq003wjx7dp756moz6', 'rosa@harbourfitouts.example', 'Rosa Iglesias', '$2b$12$v5mZj074R/ndQErK6fxOa.D1liLn8GluCtmK0a9BuEpoAfD5qp69G', NULL, NULL, 'Founder', '2026-09-17 01:13:05.335', NULL, true, '2026-09-17 01:13:05.978', '2026-09-17 01:13:05.978', false);


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

INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f1g0066jx7dz2pxsag7', 'cmu4u5eus0037jx7dx1af4of5', 'EMP-0001', 'Nadia', 'Osei', 'nadia.osei@northwindsupply.example', '+1 (415) 555-0210', 'Sales', 'Head of Sales', 'FULL_TIME', 'ACTIVE', '2023-04-17 01:13:05.335', NULL, 7400.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 01:13:06.148', '2026-09-17 01:13:06.148', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f1i0067jx7dfiu3brhc', 'cmu4u5eus0037jx7dx1af4of5', 'EMP-0002', 'Ben', 'Ferraro', 'ben.ferraro@northwindsupply.example', '+1 (415) 555-0211', 'Operations', 'Operations Manager', 'FULL_TIME', 'ACTIVE', '2023-12-17 01:13:05.335', NULL, 6600.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 01:13:06.15', '2026-09-17 01:13:06.15', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f1k0068jx7d18wg3eq5', 'cmu4u5eus0037jx7dx1af4of5', 'EMP-0003', 'Clara', 'Nkemelu', 'clara.nkemelu@northwindsupply.example', '+1 (415) 555-0212', 'Finance', 'Management Accountant', 'FULL_TIME', 'ACTIVE', '2024-11-17 01:13:05.335', NULL, 6100.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 01:13:06.152', '2026-09-17 01:13:06.152', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f1m0069jx7dscghk1rq', 'cmu4u5eus0037jx7dx1af4of5', 'EMP-0004', 'Diego', 'Marín', 'diego.marin@northwindsupply.example', '+1 (415) 555-0213', 'Projects', 'Senior Project Manager', 'FULL_TIME', 'ACTIVE', '2025-04-17 01:13:05.335', NULL, 6850.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 01:13:06.154', '2026-09-17 01:13:06.154', NULL);
INSERT INTO public.employees (id, "organizationId", "employeeNumber", "firstName", "lastName", email, phone, department, "position", "employmentType", status, "hiredAt", "terminatedAt", "baseSalary", currency, "addressLine1", city, country, "bankAccount", "taxNumber", notes, "avatarUrl", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f1o006ajx7dmubkph58', 'cmu4u5eus0037jx7dx1af4of5', 'EMP-0005', 'Sophie', 'Lang', 'sophie.lang@northwindsupply.example', '+1 (415) 555-0214', 'Design', 'Interior Designer', 'FULL_TIME', 'ACTIVE', '2025-12-17 01:13:05.335', NULL, 5400.00, 'GHS', NULL, 'San Francisco', 'United States', NULL, NULL, NULL, NULL, '2026-09-17 01:13:06.156', '2026-09-17 01:13:06.156', NULL);


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fso00l0jx7d77quxd47', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.128', '2026-09-17 01:13:07.128');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsp00l1jx7dtr1jfoig', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.129', '2026-09-17 01:13:07.129');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsq00l2jx7dqbxjp1dm', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.13', '2026-09-17 01:13:07.13');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsr00l3jx7dbh9kavuj', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.131', '2026-09-17 01:13:07.131');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fss00l4jx7d7vxjar0t', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.132', '2026-09-17 01:13:07.132');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fst00l5jx7dzfpwp8au', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.133', '2026-09-17 01:13:07.133');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsu00l6jx7dpafeo56n', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.134', '2026-09-17 01:13:07.134');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsv00l7jx7d879mc3bm', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.135', '2026-09-17 01:13:07.135');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsw00l8jx7dzk5wi0k9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.136', '2026-09-17 01:13:07.136');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsx00l9jx7dcr9zado2', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.137', '2026-09-17 01:13:07.137');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsy00lajx7dhdilqkbn', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.138', '2026-09-17 01:13:07.138');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fsz00lbjx7das5k7uv1', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.139', '2026-09-17 01:13:07.139');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft000lcjx7deu3w34j6', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.14', '2026-09-17 01:13:07.14');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft100ldjx7doerg31s9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.141', '2026-09-17 01:13:07.141');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft300lejx7d4zpoa53i', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.143', '2026-09-17 01:13:07.143');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft400lfjx7d82t5tcf5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.144', '2026-09-17 01:13:07.144');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft500lgjx7dysd4uodf', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.145', '2026-09-17 01:13:07.145');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft600lhjx7dqeaw74bb', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.146', '2026-09-17 01:13:07.146');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft700lijx7d5nhwwh6v', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.147', '2026-09-17 01:13:07.147');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft800ljjx7dptvc0100', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.148', '2026-09-17 01:13:07.148');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ft900lkjx7d3wqp2ft9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.149', '2026-09-17 01:13:07.149');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fta00lljx7d1x9ian3m', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.15', '2026-09-17 01:13:07.15');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftb00lmjx7dtlktq90o', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.151', '2026-09-17 01:13:07.151');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftb00lnjx7dgs0v415a', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.151', '2026-09-17 01:13:07.151');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftc00lojx7d81njxtzh', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.152', '2026-09-17 01:13:07.152');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftd00lpjx7dusklyjoe', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.153', '2026-09-17 01:13:07.153');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fte00lqjx7drg7rgz91', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.154', '2026-09-17 01:13:07.154');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftf00lrjx7dmppcvr3u', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.155', '2026-09-17 01:13:07.155');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftg00lsjx7d1l4p0z7h', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.156', '2026-09-17 01:13:07.156');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fth00ltjx7dmwtgy01v', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.157', '2026-09-17 01:13:07.157');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fti00lujx7dg4ppr46b', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.158', '2026-09-17 01:13:07.158');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftj00lvjx7d87xuq6b3', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.159', '2026-09-17 01:13:07.159');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftj00lwjx7diq4dtszx', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-16', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.159', '2026-09-17 01:13:07.159');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftl00lxjx7dv1uyx6wv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-15', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.161', '2026-09-17 01:13:07.161');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftl00lyjx7dj02u8i5x', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-14', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.161', '2026-09-17 01:13:07.161');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftm00lzjx7drlpk35yz', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-11', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.162', '2026-09-17 01:13:07.162');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftn00m0jx7d4mb8m5a8', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-10', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.163', '2026-09-17 01:13:07.163');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5fto00m1jx7d2gy0gk6m', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-09', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.164', '2026-09-17 01:13:07.164');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftp00m2jx7dkbtmrkck', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-08', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.165', '2026-09-17 01:13:07.165');
INSERT INTO public.attendances (id, "organizationId", "employeeId", date, status, "checkIn", "checkOut", "hoursWorked", notes, "createdAt", "updatedAt") VALUES ('cmu4u5ftq00m3jx7dknj9qa6d', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', '2026-09-07', 'PRESENT', NULL, NULL, 8.00, NULL, '2026-09-17 01:13:07.166', '2026-09-17 01:13:07.166');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eye004pjx7du3sodwa5', 'cmu4u5eus0037jx7dx1af4of5', 'Kestrel Timber Works', 'Kestrel Timber Works Ltd.', 'orders@kestreltimber.example', '+1 (503) 555-0118', NULL, 'US-771-204-338', NULL, 'Portland', 'OR', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-17 01:13:06.038', '2026-09-17 01:13:06.038', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyg004qjx7dlik86d0c', 'cmu4u5eus0037jx7dx1af4of5', 'Vertex Seating', 'Vertex Seating Inc.', 'supply@vertexseating.example', '+1 (312) 555-0143', NULL, 'US-660-918-224', NULL, 'Chicago', 'IL', NULL, 'United States', 45, NULL, 'ACTIVE', '2026-09-17 01:13:06.04', '2026-09-17 01:13:06.04', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyi004rjx7d3dp7th1g', 'cmu4u5eus0037jx7dx1af4of5', 'Halcyon Acoustics', 'Halcyon Acoustics LLC', 'hello@halcyonacoustics.example', '+1 (206) 555-0177', NULL, NULL, NULL, 'Seattle', 'WA', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-17 01:13:06.042', '2026-09-17 01:13:06.042', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyj004sjx7dey0cc5m1', 'cmu4u5eus0037jx7dx1af4of5', 'Meridian Electrical Supply', 'Meridian Electrical Supply Co.', 'accounts@meridianelec.example', '+1 (415) 555-0192', NULL, NULL, NULL, 'Oakland', 'CA', NULL, 'United States', 21, NULL, 'ACTIVE', '2026-09-17 01:13:06.043', '2026-09-17 01:13:06.043', NULL, NULL);
INSERT INTO public.suppliers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", city, state, "postalCode", country, "paymentTermDays", notes, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyl004tjx7dtnmfhf3p', 'cmu4u5eus0037jx7dx1af4of5', 'Cobalt Metal Fabrication', 'Cobalt Metal Fabrication', 'sales@cobaltfab.example', '+1 (602) 555-0164', NULL, NULL, NULL, 'Phoenix', 'AZ', NULL, 'United States', 30, NULL, 'ACTIVE', '2026-09-17 01:13:06.045', '2026-09-17 01:13:06.045', NULL, NULL);


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ey7004jjx7dbp4kr3hu', 'cmu4u5eus0037jx7dx1af4of5', 'Workstations', 'Desks, benches and height-adjustable frames', NULL, NULL, '2026-09-17 01:13:06.031', '2026-09-17 01:13:06.031', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ey9004kjx7djiqljxdh', 'cmu4u5eus0037jx7dx1af4of5', 'Seating', 'Task chairs, stools and soft seating', NULL, NULL, '2026-09-17 01:13:06.033', '2026-09-17 01:13:06.033', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eya004ljx7d15v8hjgu', 'cmu4u5eus0037jx7dx1af4of5', 'Storage', 'Pedestals, lockers and shelving', NULL, NULL, '2026-09-17 01:13:06.034', '2026-09-17 01:13:06.034', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyb004mjx7d7okgyb9u', 'cmu4u5eus0037jx7dx1af4of5', 'Acoustics', 'Panels, screens and sound treatment', NULL, NULL, '2026-09-17 01:13:06.035', '2026-09-17 01:13:06.035', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyc004njx7d6chdm1o2', 'cmu4u5eus0037jx7dx1af4of5', 'Power & data', 'Cable management, sockets and modules', NULL, NULL, '2026-09-17 01:13:06.036', '2026-09-17 01:13:06.036', NULL, NULL);
INSERT INTO public.product_categories (id, "organizationId", name, description, color, "parentId", "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyd004ojx7d0h43k78a', 'cmu4u5eus0037jx7dx1af4of5', 'Services', 'Design, delivery and installation labour', NULL, NULL, '2026-09-17 01:13:06.037', '2026-09-17 01:13:06.037', NULL, NULL);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f03005kjx7dgr8244kw', 'cmu4u5eus0037jx7dx1af4of5', 'Acoustic Ceiling Baffle', 'AC-BAF-1200', NULL, 'Suspended vertical baffle, 1200×300mm.', 'GOOD', 'cmu4u5eyb004mjx7d7okgyb9u', 'cmu4u5eyi004rjx7d3dp7th1g', 'unit', 58.00, 108.00, 10.000, 96.000, 30.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.099', '2026-09-17 01:13:06.099', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0m005ujx7dtql2g740', 'cmu4u5eus0037jx7dx1af4of5', 'Space Planning & Design', 'SV-DESIGN', NULL, 'CAD space planning, furniture specification and 3D visuals.', 'SERVICE', 'cmu4u5eyd004ojx7d0h43k78a', NULL, 'hour', 0.00, 125.00, 10.000, 0.000, 0.000, false, NULL, 'ACTIVE', '2026-09-17 01:13:06.118', '2026-09-17 01:13:06.118', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0n005vjx7dzyfsm0x7', 'cmu4u5eus0037jx7dx1af4of5', 'Delivery & Installation', 'SV-INSTALL', NULL, 'Two-person install team, build, placement and waste removal.', 'SERVICE', 'cmu4u5eyd004ojx7d0h43k78a', NULL, 'hour', 0.00, 88.00, 10.000, 0.000, 0.000, false, NULL, 'ACTIVE', '2026-09-17 01:13:06.119', '2026-09-17 01:13:06.119', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eza0056jx7dgeagqkcc', 'cmu4u5eus0037jx7dx1af4of5', 'Draughtsman Stool', 'ST-DRFT-GRY', NULL, 'Height-adjustable stool with footring, grey fabric.', 'GOOD', 'cmu4u5ey9004kjx7djiqljxdh', 'cmu4u5eyg004qjx7dlik86d0c', 'unit', 132.00, 249.00, 10.000, 0.000, 6.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.07', '2026-09-17 01:13:06.421', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eym004ujx7dqir6zgiq', 'cmu4u5eus0037jx7dx1af4of5', 'Meridian Sit-Stand Desk 1600', 'WS-1600-OAK', NULL, 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 'GOOD', 'cmu4u5ey7004jjx7dbp4kr3hu', 'cmu4u5eye004pjx7du3sodwa5', 'unit', 412.00, 749.00, 10.000, 79.000, 10.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.046', '2026-09-17 01:13:06.74', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0i005sjx7d6aaht1g7', 'cmu4u5eus0037jx7dx1af4of5', 'Under-Desk Cable Tray 1200', 'PD-TRY-1200', NULL, 'Perforated steel cable tray with fixings.', 'GOOD', 'cmu4u5eyc004njx7d6chdm1o2', NULL, 'unit', 17.00, 34.00, 10.000, 517.000, 50.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.114', '2026-09-17 01:13:06.757', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eze0058jx7dphqgj7bn', 'cmu4u5eus0037jx7dx1af4of5', 'Alcove Soft Seating Two-Seat', 'ST-SOFT-2S', NULL, 'High-back two-seat booth in wool-blend upholstery.', 'GOOD', 'cmu4u5ey9004kjx7djiqljxdh', NULL, 'unit', 640.00, 1150.00, 10.000, 0.000, 3.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.074', '2026-09-17 01:13:06.472', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ez30052jx7dq9wpr7ak', 'cmu4u5eus0037jx7dx1af4of5', 'Vertex Ergo Task Chair', 'ST-ERGO-BLK', NULL, 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 'GOOD', 'cmu4u5ey9004kjx7djiqljxdh', 'cmu4u5eyg004qjx7dlik86d0c', 'unit', 218.00, 399.00, 10.000, 193.000, 20.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.063', '2026-09-17 01:13:06.804', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ez70054jx7doev7e1va', 'cmu4u5eus0037jx7dx1af4of5', 'Vertex Ergo Task Chair (Headrest)', 'ST-ERGO-HR', NULL, 'Ergo task chair with adjustable headrest.', 'GOOD', 'cmu4u5ey9004kjx7djiqljxdh', 'cmu4u5eyg004qjx7dlik86d0c', 'unit', 254.00, 459.00, 10.000, 59.000, 12.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.067', '2026-09-17 01:13:06.775', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ezw005gjx7dvaemkhdj', 'cmu4u5eus0037jx7dx1af4of5', 'Acoustic Desk Screen 1400', 'AC-SCR-1400', NULL, 'PET felt desk-mounted screen, 1400×400mm.', 'GOOD', 'cmu4u5eyb004mjx7d7okgyb9u', 'cmu4u5eyi004rjx7d3dp7th1g', 'unit', 62.00, 119.00, 10.000, 330.000, 30.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.092', '2026-09-17 01:13:06.807', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ezo005cjx7dg52dm6yu', 'cmu4u5eus0037jx7dx1af4of5', 'Personal Locker Bank of 6', 'SG-LOCK-6', NULL, 'Six-door locker bank with digital locks.', 'GOOD', 'cmu4u5eya004ljx7d15v8hjgu', 'cmu4u5eyl004tjx7dtnmfhf3p', 'unit', 470.00, 845.00, 10.000, 0.000, 5.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.084', '2026-09-17 01:13:06.541', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0e005qjx7d62frlrph', 'cmu4u5eus0037jx7dx1af4of5', 'Vertical Cable Spine', 'PD-CBL-SPN', NULL, 'Flexible spine routing cables from desk to floor box.', 'GOOD', 'cmu4u5eyc004njx7d6chdm1o2', 'cmu4u5eyj004sjx7dey0cc5m1', 'unit', 22.00, 45.00, 10.000, 333.000, 30.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.11', '2026-09-17 01:13:06.697', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ezt005ejx7dqkzle5xd', 'cmu4u5eus0037jx7dx1af4of5', 'Open Shelving Unit 1800', 'SG-SHLF-1800', NULL, 'Five-tier open shelving, powder-coated steel.', 'GOOD', 'cmu4u5eya004ljx7d15v8hjgu', NULL, 'unit', 156.00, 289.00, 10.000, 46.000, 8.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.089', '2026-09-17 01:13:06.809', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f07005mjx7d4akrl95w', 'cmu4u5eus0037jx7dx1af4of5', 'Phone Booth Single', 'AC-BOOTH-1P', NULL, 'Single-occupancy acoustic pod with ventilation and lighting.', 'GOOD', 'cmu4u5eyb004mjx7d7okgyb9u', NULL, 'unit', 3150.00, 5290.00, 10.000, 0.000, 2.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.103', '2026-09-17 01:13:06.644', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyv004yjx7db6weovxj', 'cmu4u5eus0037jx7dx1af4of5', 'Halden Bench Desk 4-Person', 'WS-BEN-4P', NULL, 'Four-person back-to-back bench with shared cable tray.', 'GOOD', 'cmu4u5ey7004jjx7dbp4kr3hu', 'cmu4u5eye004pjx7du3sodwa5', 'unit', 960.00, 1685.00, 10.000, 0.000, 4.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.055', '2026-09-17 01:13:06.557', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0a005ojx7dtfjj8acq', 'cmu4u5eus0037jx7dx1af4of5', 'Desktop Power Module 2×Socket', 'PD-PWR-2S', NULL, 'Clamp-on module with two sockets and two USB-C.', 'GOOD', 'cmu4u5eyc004njx7d6chdm1o2', 'cmu4u5eyj004sjx7dey0cc5m1', 'unit', 41.00, 79.00, 10.000, 466.000, 40.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.106', '2026-09-17 01:13:06.824', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ezh005ajx7dbhusx0b4', 'cmu4u5eus0037jx7dx1af4of5', 'Mobile Pedestal 3-Drawer', 'SG-PED-3D', NULL, 'Lockable steel pedestal on castors.', 'GOOD', 'cmu4u5eya004ljx7d15v8hjgu', 'cmu4u5eyl004tjx7dtnmfhf3p', 'unit', 88.00, 165.00, 10.000, 280.000, 25.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.077', '2026-09-17 01:13:06.716', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyr004wjx7d1ch2rblo', 'cmu4u5eus0037jx7dx1af4of5', 'Meridian Sit-Stand Desk 1400', 'WS-1400-OAK', NULL, 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 'GOOD', 'cmu4u5ey7004jjx7dbp4kr3hu', 'cmu4u5eye004pjx7du3sodwa5', 'unit', 378.00, 689.00, 10.000, 132.000, 10.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.051', '2026-09-17 01:13:06.719', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5eyz0050jx7degrc5roz', 'cmu4u5eus0037jx7dx1af4of5', 'Corner Workstation 1800', 'WS-CNR-1800', NULL, 'Fixed-height corner desk with modesty panel.', 'GOOD', 'cmu4u5ey7004jjx7dbp4kr3hu', NULL, 'unit', 246.00, 445.00, 10.000, 0.000, 8.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.059', '2026-09-17 01:13:06.794', NULL, NULL);
INSERT INTO public.products (id, "organizationId", name, sku, barcode, description, type, "categoryId", "supplierId", unit, "purchasePrice", "sellingPrice", "taxRate", "stockQuantity", "minStockLevel", "trackInventory", "imageUrl", status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f00005ijx7dy98677aa', 'cmu4u5eus0037jx7dx1af4of5', 'Acoustic Wall Panel 600×600', 'AC-PNL-600', NULL, 'Class A absorber panel, 40mm, concealed fixings.', 'GOOD', 'cmu4u5eyb004mjx7d7okgyb9u', 'cmu4u5eyi004rjx7d3dp7th1g', 'unit', 44.00, 84.00, 10.000, 810.000, 60.000, true, NULL, 'ACTIVE', '2026-09-17 01:13:06.096', '2026-09-17 01:13:06.796', NULL, NULL);


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: billing_events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.branches (id, "organizationId", name, code, "addressLine1", city, state, "postalCode", country, phone, email, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ew6003gjx7d9b7s67tm', 'cmu4u5eus0037jx7dx1af4of5', 'Head office', 'HQ', NULL, NULL, NULL, NULL, 'Ghana', NULL, NULL, true, true, '2026-09-17 01:13:05.958', '2026-09-17 01:13:05.958', NULL);
INSERT INTO public.branches (id, "organizationId", name, code, "addressLine1", city, state, "postalCode", country, phone, email, "isPrimary", "isActive", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5exw0046jx7dvwkth73s', 'cmu4u5ewt003xjx7d38fw5vj4', 'Head office', 'HQ', NULL, NULL, NULL, NULL, 'Ghana', NULL, NULL, true, true, '2026-09-17 01:13:06.02', '2026-09-17 01:13:06.02', NULL);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.company_settings (id, "organizationId", "invoicePrefix", "quotationPrefix", "paymentPrefix", "purchaseOrderPrefix", "numberPadding", "numberIncludeYear", "defaultPaymentTermDays", "defaultInvoiceNotes", "paymentInstructions", "invoiceFooter", "taxLabel", "defaultTaxRate", "pricesIncludeTax", "lowStockAlerts", "notifyOnInvoicePaid", "notifyOnLowStock", "notifyOnQuoteAccepted", "notifyOnOverdue", "primaryColor", "secondaryColor", "createdAt", "updatedAt") VALUES ('cmu4u5euu0038jx7dc0spktkk', 'cmu4u5eus0037jx7dx1af4of5', 'INV', 'QTE', 'PAY', 'PO', 5, true, 14, NULL, 'Please reference the invoice number with your payment so we can match it automatically.', 'Thank you for your business.', 'VAT', 10.000, false, true, true, true, true, true, NULL, NULL, '2026-09-17 01:13:05.908', '2026-09-17 01:13:05.908');
INSERT INTO public.company_settings (id, "organizationId", "invoicePrefix", "quotationPrefix", "paymentPrefix", "purchaseOrderPrefix", "numberPadding", "numberIncludeYear", "defaultPaymentTermDays", "defaultInvoiceNotes", "paymentInstructions", "invoiceFooter", "taxLabel", "defaultTaxRate", "pricesIncludeTax", "lowStockAlerts", "notifyOnInvoicePaid", "notifyOnLowStock", "notifyOnQuoteAccepted", "notifyOnOverdue", "primaryColor", "secondaryColor", "createdAt", "updatedAt") VALUES ('cmu4u5ewu003yjx7do1gbopvn', 'cmu4u5ewt003xjx7d38fw5vj4', 'INV', 'QTE', 'PAY', 'PO', 5, true, 14, NULL, 'Please reference the invoice number with your payment so we can match it automatically.', 'Thank you for your business.', 'VAT', 10.000, false, true, true, true, true, true, NULL, NULL, '2026-09-17 01:13:05.981', '2026-09-17 01:13:05.981');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5ey5004ijx7d2hfqpy7y', 'cmu4u5ewt003xjx7d38fw5vj4', 'Bay Marina Offices', 'Bay Marina Offices LLC', 'admin@baymarina.example', NULL, NULL, NULL, NULL, NULL, 'Sausalito', NULL, NULL, 'United States', NULL, NULL, 14, NULL, '{}', 'ACTIVE', '2026-09-17 01:13:06.029', '2026-09-17 01:13:06.029', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0q005wjx7d21lo13mf', 'cmu4u5eus0037jx7dx1af4of5', 'Priya Raghavan', 'Lumen Health Group', 'priya.raghavan@lumenhealth.example', '+1 (415) 555-0121', NULL, 'US-338-221-904', '2100 Folsom Street', NULL, 'San Francisco', 'CA', '94110', 'United States', NULL, NULL, 30, 'Rolling refit across four clinics. Purchase orders required on every invoice.', '{healthcare,"key account"}', 'ACTIVE', '2025-05-17 01:13:05.335', '2026-09-17 01:13:06.122', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0s005xjx7d4qi4ji6y', 'cmu4u5eus0037jx7dx1af4of5', 'Daniel Okonkwo', 'Fairview Legal Partners', 'd.okonkwo@fairviewlegal.example', '+1 (212) 555-0187', NULL, NULL, '48 Wall Street, Floor 11', NULL, 'New York', 'NY', '10005', 'United States', NULL, NULL, 14, 'Prefers quotations valid for 30 days. Pays reliably within terms.', '{"professional services"}', 'ACTIVE', '2025-02-17 01:13:05.335', '2026-09-17 01:13:06.124', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0u005yjx7d0wha4vi3', 'cmu4u5eus0037jx7dx1af4of5', 'Marta Delgado', 'Cobre Coffee Roasters', 'marta@cobrecoffee.example', '+1 (512) 555-0139', NULL, NULL, '910 East 6th Street', NULL, 'Austin', 'TX', '78702', 'United States', NULL, NULL, 14, 'Opening two new sites this year. Interested in acoustic panelling.', '{hospitality,growth}', 'ACTIVE', '2025-02-17 01:13:05.335', '2026-09-17 01:13:06.126', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f0w005zjx7ddaqejxe8', 'cmu4u5eus0037jx7dx1af4of5', 'Tom Whitfield', 'Northside Academy Trust', 'procurement@northsideacademy.example', '+1 (617) 555-0155', NULL, 'US-119-887-455', '300 Huntington Avenue', NULL, 'Boston', 'MA', '02115', 'United States', NULL, NULL, 45, 'Public sector terms. Invoices must quote the framework reference.', '{education,"public sector"}', 'ACTIVE', '2026-04-17 01:13:05.335', '2026-09-17 01:13:06.128', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f120060jx7du0ttfoyd', 'cmu4u5eus0037jx7dx1af4of5', 'Alice Chen', 'Bright Harbour Studios', 'alice.chen@brightharbour.example', '+1 (206) 555-0148', NULL, NULL, '77 Yesler Way', NULL, 'Seattle', 'WA', '98104', 'United States', NULL, NULL, 14, 'Design-led fitout. Signs off quickly but wants samples first.', '{creative}', 'ACTIVE', '2026-07-17 01:13:05.335', '2026-09-17 01:13:06.134', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f140061jx7dwarganau', 'cmu4u5eus0037jx7dx1af4of5', 'Samuel Boateng', 'Ridgeline Logistics', 's.boateng@ridgelinelogistics.example', '+1 (303) 555-0176', NULL, NULL, '4500 Havana Street', NULL, 'Denver', 'CO', '80239', 'United States', NULL, NULL, 30, 'Warehouse offices. Volume pricing agreed on storage lines.', '{logistics}', 'ACTIVE', '2025-09-17 01:13:05.335', '2026-09-17 01:13:06.136', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f190062jx7dig0iyu9c', 'cmu4u5eus0037jx7dx1af4of5', 'Hannah Lindqvist', 'Aster Biotech', 'hannah.l@asterbiotech.example', '+1 (858) 555-0193', NULL, 'US-502-663-118', '11255 Torrey Pines Road', NULL, 'San Diego', 'CA', '92121', 'United States', NULL, NULL, 30, 'Lab-adjacent office space. Strict delivery windows.', '{"life sciences","key account"}', 'ACTIVE', '2026-03-17 01:13:05.335', '2026-09-17 01:13:06.141', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f1a0063jx7dp40puznl', 'cmu4u5eus0037jx7dx1af4of5', 'Owen Pritchard', 'Grainger & Mills Accountants', 'owen@graingermills.example', '+1 (704) 555-0129', NULL, NULL, '620 South Tryon Street', NULL, 'Charlotte', 'NC', '28202', 'United States', NULL, NULL, 14, 'Small but repeat orders every quarter.', '{"professional services"}', 'ACTIVE', '2024-11-17 01:13:05.335', '2026-09-17 01:13:06.142', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f1c0064jx7drs17fqe5', 'cmu4u5eus0037jx7dx1af4of5', 'Yara Haddad', 'Solstice Fitness Collective', 'yara@solsticefitness.example', '+1 (305) 555-0161', NULL, NULL, '1801 Biscayne Boulevard', NULL, 'Miami', 'FL', '33132', 'United States', NULL, NULL, 21, 'Reception and staff areas only. Budget sensitive.', '{leisure}', 'ACTIVE', '2026-04-17 01:13:05.335', '2026-09-17 01:13:06.144', NULL, NULL);
INSERT INTO public.customers (id, "organizationId", name, "companyName", email, phone, website, "taxId", "addressLine1", "addressLine2", city, state, "postalCode", country, currency, "creditLimit", "paymentTermDays", notes, tags, status, "createdAt", "updatedAt", "deletedAt", "externalId") VALUES ('cmu4u5f1e0065jx7d2gkycotj', 'cmu4u5eus0037jx7dx1af4of5', 'Greg Salter', 'Mercer Property Group', 'g.salter@mercerproperty.example', '+1 (503) 555-0184', NULL, 'US-410-775-236', '1220 SW Morrison Street', NULL, 'Portland', 'OR', '97205', 'United States', NULL, NULL, 30, 'Fits out serviced offices. Slow payer, so chase at day 35.', '{"real estate"}', 'ACTIVE', '2024-07-17 01:13:05.335', '2026-09-17 01:13:06.146', NULL, NULL);


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003kjx7dxrvmwj5n', 'cmu4u5eus0037jx7dx1af4of5', 'Rent & facilities', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003ljx7d5s65fshy', 'cmu4u5eus0037jx7dx1af4of5', 'Software & subscriptions', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003mjx7dt6tbiaw6', 'cmu4u5eus0037jx7dx1af4of5', 'Travel', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003njx7dk84kdxyz', 'cmu4u5eus0037jx7dx1af4of5', 'Marketing', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003ojx7di8d56yip', 'cmu4u5eus0037jx7dx1af4of5', 'Professional services', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003pjx7drer4m415', 'cmu4u5eus0037jx7dx1af4of5', 'Utilities', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003qjx7doy7b9qa6', 'cmu4u5eus0037jx7dx1af4of5', 'Equipment', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewb003rjx7dkrpxbfnq', 'cmu4u5eus0037jx7dx1af4of5', 'Office supplies', NULL, NULL, '2026-09-17 01:13:05.963', '2026-09-17 01:13:05.963', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5exz004ajx7dnn70z4jr', 'cmu4u5ewt003xjx7d38fw5vj4', 'Rent & facilities', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5exz004bjx7dssxxo09w', 'cmu4u5ewt003xjx7d38fw5vj4', 'Software & subscriptions', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ey0004cjx7dua5gnhu9', 'cmu4u5ewt003xjx7d38fw5vj4', 'Travel', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ey0004djx7d1fe2706c', 'cmu4u5ewt003xjx7d38fw5vj4', 'Marketing', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ey0004ejx7d7de19ivk', 'cmu4u5ewt003xjx7d38fw5vj4', 'Professional services', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ey0004fjx7d7nd4mz3p', 'cmu4u5ewt003xjx7d38fw5vj4', 'Utilities', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ey0004gjx7dvysy104j', 'cmu4u5ewt003xjx7d38fw5vj4', 'Equipment', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);
INSERT INTO public.expense_categories (id, "organizationId", name, description, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ey0004hjx7dha7g8mp4', 'cmu4u5ewt003xjx7d38fw5vj4', 'Office supplies', NULL, NULL, '2026-09-17 01:13:06.023', '2026-09-17 01:13:06.023', NULL);


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqr00jqjx7d8sybgwoa', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0q005wjx7d21lo13mf', 'PRJ-LUMEN-01', 'Lumen Health, Mission Bay clinic refit', 'Full furniture package for a 42-desk clinical admin floor, phased over two weekends.', 'ACTIVE', '2026-06-17 01:13:05.335', '2026-11-17 01:13:05.335', 96000.00, 48806.40, 'GHS', 62, NULL, '2026-09-17 01:13:07.059', '2026-09-17 01:13:07.059', NULL);
INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqw00jujx7df7rd0ud6', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f190062jx7dig0iyu9c', 'PRJ-ASTER-01', 'Aster Biotech, Torrey Pines office expansion', 'New 28-person office adjacent to the lab, including acoustic treatment and two phone booths.', 'ACTIVE', '2026-08-17 01:13:05.335', '2027-01-17 01:13:05.335', 64000.00, 17843.20, 'GHS', 34, NULL, '2026-09-17 01:13:07.064', '2026-09-17 01:13:07.064', NULL);
INSERT INTO public.projects (id, "organizationId", "customerId", code, name, description, status, "startDate", "endDate", budget, spent, currency, progress, color, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqz00jyjx7d3gc4l8u6', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0u005yjx7d0wha4vi3', 'PRJ-COBRE-01', 'Cobre Coffee, East 6th flagship', 'Back-of-house office and staff room fitout alongside the new roastery build.', 'COMPLETED', '2026-02-17 01:13:05.335', '2026-07-17 01:13:05.335', 28500.00, 23370.00, 'GHS', 100, NULL, '2026-09-17 01:13:07.067', '2026-09-17 01:13:07.067', NULL);


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fkl00gfjx7d32dibtsa', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00001', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, quarterly', 'Warehouse rent, quarterly, recorded from supplier documentation.', 8400.00, 840.00, 9240.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-05 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-05 00:00:00', '2026-09-17 01:13:06.837', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fks00gijx7dvl5l8gus', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00002', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls', 'Delivery van fuel and tolls, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-09-12 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-12 00:00:00', '2026-09-17 01:13:06.844', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fkz00gljx7d5om19ahf', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00003', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats)', 'Design software licences (5 seats), recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-29 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-29 00:00:00', '2026-09-17 01:13:06.851', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fl600gojx7duseofmip', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00004', 'cmu4u5ewb003njx7dk84kdxyz', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Trade show stand at Workspace Expo', 'Trade show stand at Workspace Expo, recorded from supplier documentation.', 3250.00, 325.00, 3575.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-21 00:00:00', 'Workspace Expo Ltd.', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-21 00:00:00', '2026-09-17 01:13:06.858', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fld00grjx7ddp9cycgu', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00005', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity', 'Warehouse electricity, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-09 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-09 00:00:00', '2026-09-17 01:13:06.865', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fll00gujx7dysr22cdh', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00006', 'cmu4u5ewb003qjx7doy7b9qa6', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Forklift annual service', 'Forklift annual service, recorded from supplier documentation.', 1180.00, 118.00, 1298.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-14 00:00:00', 'Halton Materials Handling', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-14 00:00:00', '2026-09-17 01:13:06.873', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fls00gxjx7djy04osy6', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00007', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer', 'Accountancy retainer, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-02 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-02 00:00:00', '2026-09-17 01:13:06.88', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fly00h0jx7diybfo3u8', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00008', 'cmu4u5ewb003rjx7dkrpxbfnq', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Packing materials and pallets', 'Packing materials and pallets, recorded from supplier documentation.', 398.70, 39.87, 438.57, 'GHS', 'CARD', 'APPROVED', '2026-09-14 00:00:00', 'Crate & Wrap Supplies', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-14 00:00:00', '2026-09-17 01:13:06.886', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fm500h3jx7dsuxp74e9', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00009', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Installer team overnight accommodation', 'Installer team overnight accommodation, recorded from supplier documentation.', 864.00, 86.40, 950.40, 'GHS', 'CARD', 'APPROVED', '2026-08-27 00:00:00', 'Riverside Inn', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-27 00:00:00', '2026-09-17 01:13:06.893', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmc00h6jx7dke35gjc4', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00010', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Liability insurance premium', 'Liability insurance premium, recorded from supplier documentation.', 2240.00, 224.00, 2464.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-03 00:00:00', 'Ashworth Commercial Insurance', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-03 00:00:00', '2026-09-17 01:13:06.9', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmi00h9jx7d733qojrx', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00011', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, current month', 'Warehouse rent, current month, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-31 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-31 00:00:00', '2026-09-17 01:13:06.906', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmo00hcjx7db9vp3xwe', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00012', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats), current month', 'Design software licences (5 seats), current month, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-09-02 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-02 00:00:00', '2026-09-17 01:13:06.912', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmt00hfjx7drxkzk3gf', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00013', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity, current month', 'Warehouse electricity, current month, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-06 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-06 00:00:00', '2026-09-17 01:13:06.917', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmy00hijx7doqsv28et', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00014', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer, current month', 'Accountancy retainer, current month, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-09-04 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-04 00:00:00', '2026-09-17 01:13:06.922', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fn300hljx7dqq610exh', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00015', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls, current month', 'Delivery van fuel and tolls, current month, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-09-02 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-02 00:00:00', '2026-09-17 01:13:06.927', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fn800hojx7dhvccve1e', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00016', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, 1 month ago', 'Warehouse rent, 1 month ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-10 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-10 00:00:00', '2026-09-17 01:13:06.932', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fnd00hrjx7dri0gc3dt', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00017', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats), 1 month ago', 'Design software licences (5 seats), 1 month ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-08-07 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-07 00:00:00', '2026-09-17 01:13:06.937', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fni00hujx7d9r8jjqx8', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00018', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity, 1 month ago', 'Warehouse electricity, 1 month ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-02 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-02 00:00:00', '2026-09-17 01:13:06.942', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fnn00hxjx7d4kx3jlit', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00019', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer, 1 month ago', 'Accountancy retainer, 1 month ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-08-01 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-01 00:00:00', '2026-09-17 01:13:06.947', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fns00i0jx7dopywk53i', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00020', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls, 1 month ago', 'Delivery van fuel and tolls, 1 month ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-08-16 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-16 00:00:00', '2026-09-17 01:13:06.952', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fnx00i3jx7d2or8fde1', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00021', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, 2 months ago', 'Warehouse rent, 2 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-06 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-06 00:00:00', '2026-09-17 01:13:06.957', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fo200i6jx7dp13d0iqn', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00022', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats), 2 months ago', 'Design software licences (5 seats), 2 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-07-04 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-04 00:00:00', '2026-09-17 01:13:06.962', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fo700i9jx7dkjygvtwa', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00023', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity, 2 months ago', 'Warehouse electricity, 2 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-13 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-13 00:00:00', '2026-09-17 01:13:06.967', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5foc00icjx7dwey3a8j4', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00024', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer, 2 months ago', 'Accountancy retainer, 2 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-07-03 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-03 00:00:00', '2026-09-17 01:13:06.972', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5foh00ifjx7dcix1qywg', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00025', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls, 2 months ago', 'Delivery van fuel and tolls, 2 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-07-07 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-07 00:00:00', '2026-09-17 01:13:06.977', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fol00iijx7dvm7z8dbq', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00026', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, 3 months ago', 'Warehouse rent, 3 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-03 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-03 00:00:00', '2026-09-17 01:13:06.981', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5foq00iljx7dqgblviq6', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00027', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats), 3 months ago', 'Design software licences (5 seats), 3 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-05-31 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-31 00:00:00', '2026-09-17 01:13:06.986', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fov00iojx7d6djb4r8g', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00028', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity, 3 months ago', 'Warehouse electricity, 3 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-11 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-11 00:00:00', '2026-09-17 01:13:06.991', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5foz00irjx7dka8dqszn', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00029', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer, 3 months ago', 'Accountancy retainer, 3 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-06-07 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-07 00:00:00', '2026-09-17 01:13:06.995', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fp600iujx7dn1acu013', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00030', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls, 3 months ago', 'Delivery van fuel and tolls, 3 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-06-02 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-02 00:00:00', '2026-09-17 01:13:07.002', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpb00ixjx7da22dhbbq', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00031', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, 4 months ago', 'Warehouse rent, 4 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-13 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-13 00:00:00', '2026-09-17 01:13:07.007', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fph00j0jx7d1vlin6a4', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00032', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats), 4 months ago', 'Design software licences (5 seats), 4 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-05-07 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-07 00:00:00', '2026-09-17 01:13:07.013', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpm00j3jx7d5bcxysd0', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00033', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity, 4 months ago', 'Warehouse electricity, 4 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-10 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-10 00:00:00', '2026-09-17 01:13:07.018', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpq00j6jx7d62uaduli', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00034', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer, 4 months ago', 'Accountancy retainer, 4 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-05-16 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-16 00:00:00', '2026-09-17 01:13:07.022', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpv00j9jx7d7wpf1gb4', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00035', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls, 4 months ago', 'Delivery van fuel and tolls, 4 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-05-03 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-03 00:00:00', '2026-09-17 01:13:07.027', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fq000jcjx7dgn2q5xsb', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00036', 'cmu4u5ewb003kjx7dxrvmwj5n', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse rent, 5 months ago', 'Warehouse rent, 5 months ago, recorded from supplier documentation.', 2800.00, 280.00, 3080.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-18 00:00:00', 'Bayfront Industrial Estates', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-18 00:00:00', '2026-09-17 01:13:07.032', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fq500jfjx7dtcqr4hco', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00037', 'cmu4u5ewb003ljx7d5s65fshy', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Design software licences (5 seats), 5 months ago', 'Design software licences (5 seats), 5 months ago, recorded from supplier documentation.', 745.00, 74.50, 819.50, 'GHS', 'CARD', 'APPROVED', '2026-04-16 00:00:00', 'Formline CAD', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-16 00:00:00', '2026-09-17 01:13:07.037', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqa00jijx7dqdmzocp5', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00038', 'cmu4u5ewb003pjx7drer4m415', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Warehouse electricity, 5 months ago', 'Warehouse electricity, 5 months ago, recorded from supplier documentation.', 486.15, 48.62, 534.77, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-16 00:00:00', 'Pacific Grid Energy', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-16 00:00:00', '2026-09-17 01:13:07.042', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqe00jljx7dmym2ykml', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00039', 'cmu4u5ewb003ojx7di8d56yip', NULL, NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'Accountancy retainer, 5 months ago', 'Accountancy retainer, 5 months ago, recorded from supplier documentation.', 1450.00, 145.00, 1595.00, 'GHS', 'BANK_TRANSFER', 'APPROVED', '2026-04-11 00:00:00', 'Grainger & Mills Accountants', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-11 00:00:00', '2026-09-17 01:13:07.046', NULL);
INSERT INTO public.expenses (id, "organizationId", number, "categoryId", "supplierId", "projectId", "accountId", title, description, amount, "taxAmount", total, currency, method, status, "spentAt", "vendorName", reference, "receiptUrl", "receiptName", billable, "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqk00jojx7dzagceg2u', 'cmu4u5eus0037jx7dx1af4of5', 'EXP-2026-00040', 'cmu4u5ewb003mjx7dt6tbiaw6', NULL, NULL, 'cmu4u5ew9003jjx7dz9qtry7j', 'Delivery van fuel and tolls, 5 months ago', 'Delivery van fuel and tolls, 5 months ago, recorded from supplier documentation.', 612.40, 61.24, 673.64, 'GHS', 'CARD', 'APPROVED', '2026-04-11 00:00:00', 'Fleet Fuel Card', NULL, NULL, NULL, false, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-11 00:00:00', '2026-09-17 01:13:07.052', NULL);


--
-- Data for Name: import_runs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5eyp004vjx7dwmv6pv7y', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'STOCK_IN', 136.000, 136.000, 412.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.049');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5eyt004xjx7dunlcncak', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyr004wjx7d1ch2rblo', 'STOCK_IN', 164.000, 164.000, 378.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.053');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5eyx004zjx7du20kavxz', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyv004yjx7db6weovxj', 'STOCK_IN', 32.000, 32.000, 960.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.057');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ez10051jx7dr4d1r9mj', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyz0050jx7degrc5roz', 'STOCK_IN', 24.000, 24.000, 246.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.061');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ez50053jx7dw08u5ye9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'STOCK_IN', 248.000, 248.000, 218.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.065');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ez90055jx7dj3as21gy', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'STOCK_IN', 112.000, 112.000, 254.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.069');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ezc0057jx7drco51gb9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eza0056jx7dgeagqkcc', 'STOCK_IN', 12.000, 12.000, 132.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.072');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ezf0059jx7d8ivxb9em', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eze0058jx7dphqgj7bn', 'STOCK_IN', 20.000, 20.000, 640.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.075');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ezj005bjx7dxgy1ieil', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezh005ajx7dbhusx0b4', 'STOCK_IN', 296.000, 296.000, 88.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.079');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ezr005djx7daomr92oz', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezo005cjx7dg52dm6yu', 'STOCK_IN', 44.000, 44.000, 470.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.087');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ezu005fjx7dq5i5los1', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezt005ejx7dqkzle5xd', 'STOCK_IN', 76.000, 76.000, 156.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.09');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ezy005hjx7dzf4ggyax', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezw005gjx7dvaemkhdj', 'STOCK_IN', 352.000, 352.000, 62.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.094');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f01005jjx7duhtrpf74', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f00005ijx7dy98677aa', 'STOCK_IN', 840.000, 840.000, 44.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.097');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f05005ljx7dx0di5rbk', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f03005kjx7dgr8244kw', 'STOCK_IN', 96.000, 96.000, 58.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.101');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f08005njx7d1hqo4oh4', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f07005mjx7d4akrl95w', 'STOCK_IN', 8.000, 8.000, 3150.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.104');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f0c005pjx7dvaafynv5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0a005ojx7dtfjj8acq', 'STOCK_IN', 520.000, 520.000, 41.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.108');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f0h005rjx7dap6p9g2b', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'STOCK_IN', 384.000, 384.000, 22.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.113');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f0k005tjx7dlzuv1u5t', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'STOCK_IN', 580.000, 580.000, 17.00, NULL, NULL, NULL, 'Opening stock balance', '2026-01-17 01:13:05.335', NULL, '2026-09-17 01:13:06.116');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f3z007vjx7dv0bndv3t', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -5.000, 575.000, NULL, 'INV-2026-00001', 'invoice', 'cmu4u5f3s007pjx7dwwuc4n3j', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 01:13:06.239');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f43007wjx7d2dli7nja', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -11.000, 237.000, NULL, 'INV-2026-00001', 'invoice', 'cmu4u5f3s007pjx7dwwuc4n3j', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 01:13:06.243');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f47007xjx7df44who1w', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyv004yjx7db6weovxj', 'SALE', -13.000, 19.000, NULL, 'INV-2026-00001', 'invoice', 'cmu4u5f3s007pjx7dwwuc4n3j', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 01:13:06.247');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f4a007yjx7d3hv4g5it', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eza0056jx7dgeagqkcc', 'SALE', -2.000, 10.000, NULL, 'INV-2026-00001', 'invoice', 'cmu4u5f3s007pjx7dwwuc4n3j', 'Sold on INV-2026-00001', '2026-03-25 00:00:00', NULL, '2026-09-17 01:13:06.25');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f4v0087jx7dnumkujlb', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyr004wjx7d1ch2rblo', 'SALE', -13.000, 151.000, NULL, 'INV-2026-00002', 'invoice', 'cmu4u5f4q0083jx7drthx1yom', 'Sold on INV-2026-00002', '2026-04-04 00:00:00', NULL, '2026-09-17 01:13:06.271');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f4x0088jx7doint4v4a', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f00005ijx7dy98677aa', 'SALE', -5.000, 835.000, NULL, 'INV-2026-00002', 'invoice', 'cmu4u5f4q0083jx7drthx1yom', 'Sold on INV-2026-00002', '2026-04-04 00:00:00', NULL, '2026-09-17 01:13:06.273');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f5g008hjx7d857vauxk', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezo005cjx7dg52dm6yu', 'SALE', -9.000, 35.000, NULL, 'INV-2026-00003', 'invoice', 'cmu4u5f5a008djx7dbizevi8k', 'Sold on INV-2026-00003', '2026-04-20 00:00:00', NULL, '2026-09-17 01:13:06.292');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f5j008ijx7dfh9bb40a', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -6.000, 231.000, NULL, 'INV-2026-00003', 'invoice', 'cmu4u5f5a008djx7dbizevi8k', 'Sold on INV-2026-00003', '2026-04-20 00:00:00', NULL, '2026-09-17 01:13:06.295');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f61008tjx7drtxkuki8', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyr004wjx7d1ch2rblo', 'SALE', -2.000, 149.000, NULL, 'INV-2026-00004', 'invoice', 'cmu4u5f5w008njx7dwt4gsrnn', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 01:13:06.313');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f64008ujx7d4mzawr0b', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezo005cjx7dg52dm6yu', 'SALE', -12.000, 23.000, NULL, 'INV-2026-00004', 'invoice', 'cmu4u5f5w008njx7dwt4gsrnn', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 01:13:06.316');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f67008vjx7dis32ttt0', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eza0056jx7dgeagqkcc', 'SALE', -2.000, 8.000, NULL, 'INV-2026-00004', 'invoice', 'cmu4u5f5w008njx7dwt4gsrnn', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 01:13:06.319');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f6c008wjx7dlgwgy1et', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'SALE', -14.000, 122.000, NULL, 'INV-2026-00004', 'invoice', 'cmu4u5f5w008njx7dwt4gsrnn', 'Sold on INV-2026-00004', '2026-05-05 00:00:00', NULL, '2026-09-17 01:13:06.324');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f6w0097jx7djs2ott6x', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyr004wjx7d1ch2rblo', 'SALE', -3.000, 146.000, NULL, 'INV-2026-00005', 'invoice', 'cmu4u5f6r0091jx7d6w0f9ddd', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 01:13:06.344');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f6z0098jx7drrik2owx', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eze0058jx7dphqgj7bn', 'SALE', -9.000, 11.000, NULL, 'INV-2026-00005', 'invoice', 'cmu4u5f6r0091jx7d6w0f9ddd', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 01:13:06.347');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f710099jx7dmrairhkv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezo005cjx7dg52dm6yu', 'SALE', -12.000, 11.000, NULL, 'INV-2026-00005', 'invoice', 'cmu4u5f6r0091jx7d6w0f9ddd', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 01:13:06.349');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f75009ajx7diw1if12d', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -4.000, 380.000, NULL, 'INV-2026-00005', 'invoice', 'cmu4u5f6r0091jx7d6w0f9ddd', 'Sold on INV-2026-00005', '2026-05-12 00:00:00', NULL, '2026-09-17 01:13:06.353');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f7q009jjx7dujtm94sv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0a005ojx7dtfjj8acq', 'SALE', -14.000, 506.000, NULL, 'INV-2026-00006', 'invoice', 'cmu4u5f7l009fjx7dno49sdyc', 'Sold on INV-2026-00006', '2026-05-12 00:00:00', NULL, '2026-09-17 01:13:06.374');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f7u009kjx7dlznz99ce', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -14.000, 217.000, NULL, 'INV-2026-00006', 'invoice', 'cmu4u5f7l009fjx7dno49sdyc', 'Sold on INV-2026-00006', '2026-05-12 00:00:00', NULL, '2026-09-17 01:13:06.378');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f8c009tjx7dmvi3nrf9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -8.000, 372.000, NULL, 'INV-2026-00007', 'invoice', 'cmu4u5f88009pjx7dwy937no0', 'Sold on INV-2026-00007', '2026-06-03 00:00:00', NULL, '2026-09-17 01:13:06.396');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f8i009ujx7d3n7abtwb', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'SALE', -7.000, 105.000, NULL, 'INV-2026-00007', 'invoice', 'cmu4u5f88009pjx7dwy937no0', 'Sold on INV-2026-00007', '2026-06-03 00:00:00', NULL, '2026-09-17 01:13:06.402');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f9000a4jx7d9jv0hpap', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -12.000, 563.000, NULL, 'INV-2026-00008', 'invoice', 'cmu4u5f8v009zjx7doea9r8ua', 'Sold on INV-2026-00008', '2026-06-05 00:00:00', NULL, '2026-09-17 01:13:06.42');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f9200a5jx7dqkwt17p5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eza0056jx7dgeagqkcc', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00008', 'invoice', 'cmu4u5f8v009zjx7doea9r8ua', 'Sold on INV-2026-00008', '2026-06-05 00:00:00', NULL, '2026-09-17 01:13:06.422');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f9500a6jx7dtl00g446', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -4.000, 368.000, NULL, 'INV-2026-00008', 'invoice', 'cmu4u5f8v009zjx7doea9r8ua', 'Sold on INV-2026-00008', '2026-06-05 00:00:00', NULL, '2026-09-17 01:13:06.425');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f9n00agjx7dwyugtiiy', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -12.000, 356.000, NULL, 'INV-2026-00009', 'invoice', 'cmu4u5f9j00abjx7d8gpkt9r6', 'Sold on INV-2026-00009', '2026-06-05 00:00:00', NULL, '2026-09-17 01:13:06.443');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f9r00ahjx7dj8fqslpn', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -10.000, 553.000, NULL, 'INV-2026-00009', 'invoice', 'cmu4u5f9j00abjx7d8gpkt9r6', 'Sold on INV-2026-00009', '2026-06-05 00:00:00', NULL, '2026-09-17 01:13:06.447');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5f9t00aijx7diu9wz9n9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'SALE', -13.000, 109.000, NULL, 'INV-2026-00009', 'invoice', 'cmu4u5f9j00abjx7d8gpkt9r6', 'Sold on INV-2026-00009', '2026-06-05 00:00:00', NULL, '2026-09-17 01:13:06.449');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fac00asjx7ddsfdkxnp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -10.000, 207.000, NULL, 'INV-2026-00010', 'invoice', 'cmu4u5fa600anjx7dpho68io8', 'Sold on INV-2026-00010', '2026-06-15 00:00:00', NULL, '2026-09-17 01:13:06.468');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5faf00atjx7dz1ag8s8s', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezw005gjx7dvaemkhdj', 'SALE', -6.000, 346.000, NULL, 'INV-2026-00010', 'invoice', 'cmu4u5fa600anjx7dpho68io8', 'Sold on INV-2026-00010', '2026-06-15 00:00:00', NULL, '2026-09-17 01:13:06.471');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fai00aujx7d8d51w10i', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eze0058jx7dphqgj7bn', 'SALE', -11.000, 0.000, NULL, 'INV-2026-00010', 'invoice', 'cmu4u5fa600anjx7dpho68io8', 'Sold on INV-2026-00010', '2026-06-15 00:00:00', NULL, '2026-09-17 01:13:06.474');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5faz00b5jx7ddnqql3l7', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -7.000, 546.000, NULL, 'INV-2026-00011', 'invoice', 'cmu4u5fav00azjx7de5yji16e', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 01:13:06.491');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fb100b6jx7ddjkh903q', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -12.000, 344.000, NULL, 'INV-2026-00011', 'invoice', 'cmu4u5fav00azjx7de5yji16e', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 01:13:06.493');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fb400b7jx7dohd0b1di', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezt005ejx7dqkzle5xd', 'SALE', -5.000, 71.000, NULL, 'INV-2026-00011', 'invoice', 'cmu4u5fav00azjx7de5yji16e', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 01:13:06.496');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fb800b8jx7dvzmp8781', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezw005gjx7dvaemkhdj', 'SALE', -5.000, 341.000, NULL, 'INV-2026-00011', 'invoice', 'cmu4u5fav00azjx7de5yji16e', 'Sold on INV-2026-00011', '2026-06-24 00:00:00', NULL, '2026-09-17 01:13:06.5');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fbp00bjjx7d78h4y97s', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0a005ojx7dtfjj8acq', 'SALE', -14.000, 492.000, NULL, 'INV-2026-00012', 'invoice', 'cmu4u5fbl00bdjx7df15zpnmf', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 01:13:06.517');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fbr00bkjx7d5x5f8yx7', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyv004yjx7db6weovxj', 'SALE', -11.000, 8.000, NULL, 'INV-2026-00012', 'invoice', 'cmu4u5fbl00bdjx7df15zpnmf', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 01:13:06.519');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fbu00bljx7dj8w2s7rz', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'SALE', -11.000, 94.000, NULL, 'INV-2026-00012', 'invoice', 'cmu4u5fbl00bdjx7df15zpnmf', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 01:13:06.522');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fbw00bmjx7ddn3r0nck', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -11.000, 535.000, NULL, 'INV-2026-00012', 'invoice', 'cmu4u5fbl00bdjx7df15zpnmf', 'Sold on INV-2026-00012', '2026-07-03 00:00:00', NULL, '2026-09-17 01:13:06.524');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fcc00bvjx7dez55v8dx', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0a005ojx7dtfjj8acq', 'SALE', -8.000, 484.000, NULL, 'INV-2026-00013', 'invoice', 'cmu4u5fc800brjx7dq1dkp4hp', 'Sold on INV-2026-00013', '2026-07-04 00:00:00', NULL, '2026-09-17 01:13:06.54');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fce00bwjx7dnx2bkine', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezo005cjx7dg52dm6yu', 'SALE', -11.000, 0.000, NULL, 'INV-2026-00013', 'invoice', 'cmu4u5fc800brjx7dq1dkp4hp', 'Sold on INV-2026-00013', '2026-07-04 00:00:00', NULL, '2026-09-17 01:13:06.542');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fcu00c5jx7d3o6f4p7n', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyv004yjx7db6weovxj', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00014', 'invoice', 'cmu4u5fcq00c1jx7dyzukvvig', 'Sold on INV-2026-00014', '2026-07-06 00:00:00', NULL, '2026-09-17 01:13:06.558');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fcx00c6jx7daj2uypw7', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'SALE', -13.000, 81.000, NULL, 'INV-2026-00014', 'invoice', 'cmu4u5fcq00c1jx7dyzukvvig', 'Sold on INV-2026-00014', '2026-07-06 00:00:00', NULL, '2026-09-17 01:13:06.561');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fdd00cgjx7dehcmrgvr', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezt005ejx7dqkzle5xd', 'SALE', -9.000, 62.000, NULL, 'INV-2026-00015', 'invoice', 'cmu4u5fd800cbjx7dlwg0dqfr', 'Sold on INV-2026-00015', '2026-07-14 00:00:00', NULL, '2026-09-17 01:13:06.577');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fdf00chjx7dtzl0ps2r', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezh005ajx7dbhusx0b4', 'SALE', -9.000, 287.000, NULL, 'INV-2026-00015', 'invoice', 'cmu4u5fd800cbjx7dlwg0dqfr', 'Sold on INV-2026-00015', '2026-07-14 00:00:00', NULL, '2026-09-17 01:13:06.579');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fdi00cijx7dvxyp6l1p', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyr004wjx7d1ch2rblo', 'SALE', -10.000, 136.000, NULL, 'INV-2026-00015', 'invoice', 'cmu4u5fd800cbjx7dlwg0dqfr', 'Sold on INV-2026-00015', '2026-07-14 00:00:00', NULL, '2026-09-17 01:13:06.582');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fdz00csjx7dfkdwuybg', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -8.000, 336.000, NULL, 'INV-2026-00016', 'invoice', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'Sold on INV-2026-00016', '2026-07-30 00:00:00', NULL, '2026-09-17 01:13:06.599');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fe200ctjx7ddh7lnlcp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f00005ijx7dy98677aa', 'SALE', -4.000, 831.000, NULL, 'INV-2026-00016', 'invoice', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'Sold on INV-2026-00016', '2026-07-30 00:00:00', NULL, '2026-09-17 01:13:06.602');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fe400cujx7dkt6e7xho', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'SALE', -12.000, 97.000, NULL, 'INV-2026-00016', 'invoice', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'Sold on INV-2026-00016', '2026-07-30 00:00:00', NULL, '2026-09-17 01:13:06.604');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fem00d3jx7dre5606s5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'SALE', -11.000, 86.000, NULL, 'INV-2026-00017', 'invoice', 'cmu4u5feh00czjx7df5gb3qfu', 'Sold on INV-2026-00017', '2026-08-02 00:00:00', NULL, '2026-09-17 01:13:06.622');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fer00d4jx7dddgd02q9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -2.000, 205.000, NULL, 'INV-2026-00017', 'invoice', 'cmu4u5feh00czjx7df5gb3qfu', 'Sold on INV-2026-00017', '2026-08-02 00:00:00', NULL, '2026-09-17 01:13:06.627');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ff700dejx7danh68wz2', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezw005gjx7dvaemkhdj', 'SALE', -2.000, 339.000, NULL, 'INV-2026-00018', 'invoice', 'cmu4u5ff300d9jx7dhdva9d0t', 'Sold on INV-2026-00018', '2026-08-09 00:00:00', NULL, '2026-09-17 01:13:06.643');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ff900dfjx7dnkxli1za', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f07005mjx7d4akrl95w', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00018', 'invoice', 'cmu4u5ff300d9jx7dhdva9d0t', 'Sold on INV-2026-00018', '2026-08-09 00:00:00', NULL, '2026-09-17 01:13:06.645');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ffc00dgjx7d8um2gn2p', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'SALE', -2.000, 84.000, NULL, 'INV-2026-00018', 'invoice', 'cmu4u5ff300d9jx7dhdva9d0t', 'Sold on INV-2026-00018', '2026-08-09 00:00:00', NULL, '2026-09-17 01:13:06.648');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5ffr00dojx7dxnnam9cw', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyz0050jx7degrc5roz', 'SALE', -5.000, 19.000, NULL, 'INV-2026-00019', 'invoice', 'cmu4u5ffn00dljx7ddo4glrf0', 'Sold on INV-2026-00019', '2026-08-18 00:00:00', NULL, '2026-09-17 01:13:06.663');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fgc00e2jx7druoax8qd', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f00005ijx7dy98677aa', 'SALE', -10.000, 821.000, NULL, 'INV-2026-00021', 'invoice', 'cmu4u5fg800dxjx7df8is60rx', 'Sold on INV-2026-00021', '2026-09-03 00:00:00', NULL, '2026-09-17 01:13:06.684');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fgf00e3jx7d9y0stq8n', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0a005ojx7dtfjj8acq', 'SALE', -4.000, 480.000, NULL, 'INV-2026-00021', 'invoice', 'cmu4u5fg800dxjx7df8is60rx', 'Sold on INV-2026-00021', '2026-09-03 00:00:00', NULL, '2026-09-17 01:13:06.687');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fgh00e4jx7dqm7924ip', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'SALE', -7.000, 74.000, NULL, 'INV-2026-00021', 'invoice', 'cmu4u5fg800dxjx7df8is60rx', 'Sold on INV-2026-00021', '2026-09-03 00:00:00', NULL, '2026-09-17 01:13:06.689');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fgr00eajx7d02j7zqyv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0e005qjx7d62frlrph', 'SALE', -3.000, 333.000, NULL, 'INV-2026-00022', 'invoice', 'cmu4u5fgn00e6jx7dzty15xb8', 'Sold on INV-2026-00022', '2026-09-04 00:00:00', NULL, '2026-09-17 01:13:06.699');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fgt00ebjx7drw9t28qv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'SALE', -6.000, 68.000, NULL, 'INV-2026-00022', 'invoice', 'cmu4u5fgn00e6jx7dzty15xb8', 'Sold on INV-2026-00022', '2026-09-04 00:00:00', NULL, '2026-09-17 01:13:06.701');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fha00eljx7dj8kk1jmf', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezh005ajx7dbhusx0b4', 'SALE', -7.000, 280.000, NULL, 'INV-2026-00023', 'invoice', 'cmu4u5fh600egjx7dw4hx3d7p', 'Sold on INV-2026-00023', '2026-09-06 00:00:00', NULL, '2026-09-17 01:13:06.718');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fhd00emjx7dev0po7sg', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyr004wjx7d1ch2rblo', 'SALE', -4.000, 132.000, NULL, 'INV-2026-00023', 'invoice', 'cmu4u5fh600egjx7dw4hx3d7p', 'Sold on INV-2026-00023', '2026-09-06 00:00:00', NULL, '2026-09-17 01:13:06.721');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fhg00enjx7d0xlth6vm', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -5.000, 530.000, NULL, 'INV-2026-00023', 'invoice', 'cmu4u5fh600egjx7dw4hx3d7p', 'Sold on INV-2026-00023', '2026-09-06 00:00:00', NULL, '2026-09-17 01:13:06.724');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fhv00eyjx7dppbmcvr5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezt005ejx7dqkzle5xd', 'SALE', -5.000, 57.000, NULL, 'INV-2026-00025', 'invoice', 'cmu4u5fhr00eujx7dc14cj576', 'Sold on INV-2026-00025', '2026-09-09 00:00:00', NULL, '2026-09-17 01:13:06.739');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fhy00ezjx7dxeq7pj3d', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eym004ujx7dqir6zgiq', 'SALE', -5.000, 79.000, NULL, 'INV-2026-00025', 'invoice', 'cmu4u5fhr00eujx7dc14cj576', 'Sold on INV-2026-00025', '2026-09-09 00:00:00', NULL, '2026-09-17 01:13:06.742');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fie00f8jx7dwd6yhayy', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0i005sjx7d6aaht1g7', 'SALE', -13.000, 517.000, NULL, 'INV-2026-00026', 'invoice', 'cmu4u5fib00f4jx7d0vw8tugu', 'Sold on INV-2026-00026', '2026-09-11 00:00:00', NULL, '2026-09-17 01:13:06.759');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fih00f9jx7d8w0eqzcv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -2.000, 203.000, NULL, 'INV-2026-00026', 'invoice', 'cmu4u5fib00f4jx7d0vw8tugu', 'Sold on INV-2026-00026', '2026-09-11 00:00:00', NULL, '2026-09-17 01:13:06.761');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fiw00fijx7d92lj5565', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez70054jx7doev7e1va', 'SALE', -9.000, 59.000, NULL, 'INV-2026-00027', 'invoice', 'cmu4u5fis00fejx7dl1n9m0ng', 'Sold on INV-2026-00027', '2026-09-12 00:00:00', NULL, '2026-09-17 01:13:06.776');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fj100fjjx7d2ijhy981', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyz0050jx7degrc5roz', 'SALE', -11.000, 8.000, NULL, 'INV-2026-00027', 'invoice', 'cmu4u5fis00fejx7dl1n9m0ng', 'Sold on INV-2026-00027', '2026-09-12 00:00:00', NULL, '2026-09-17 01:13:06.781');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fjf00fsjx7dminbrmr9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5eyz0050jx7degrc5roz', 'SALE', -8.000, 0.000, NULL, 'INV-2026-00028', 'invoice', 'cmu4u5fjc00fojx7dpayufq7v', 'Sold on INV-2026-00028', '2026-09-14 00:00:00', NULL, '2026-09-17 01:13:06.795');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fjh00ftjx7d4gtmi00c', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f00005ijx7dy98677aa', 'SALE', -11.000, 810.000, NULL, 'INV-2026-00028', 'invoice', 'cmu4u5fjc00fojx7dpayufq7v', 'Sold on INV-2026-00028', '2026-09-14 00:00:00', NULL, '2026-09-17 01:13:06.798');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fjq00g0jx7d9b6ila04', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ez30052jx7dq9wpr7ak', 'SALE', -10.000, 193.000, NULL, 'INV-2026-00029', 'invoice', 'cmu4u5fjm00fvjx7ds393itg9', 'Sold on INV-2026-00029', '2026-09-15 00:00:00', NULL, '2026-09-17 01:13:06.806');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fjs00g1jx7di4ze8tfs', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezw005gjx7dvaemkhdj', 'SALE', -9.000, 330.000, NULL, 'INV-2026-00029', 'invoice', 'cmu4u5fjm00fvjx7ds393itg9', 'Sold on INV-2026-00029', '2026-09-15 00:00:00', NULL, '2026-09-17 01:13:06.808');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fju00g2jx7duckfg8ye', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ezt005ejx7dqkzle5xd', 'SALE', -11.000, 46.000, NULL, 'INV-2026-00029', 'invoice', 'cmu4u5fjm00fvjx7ds393itg9', 'Sold on INV-2026-00029', '2026-09-15 00:00:00', NULL, '2026-09-17 01:13:06.81');
INSERT INTO public.inventory_transactions (id, "organizationId", "productId", type, quantity, "balanceAfter", "unitCost", reference, "referenceType", "referenceId", reason, "occurredAt", "createdById", "createdAt") VALUES ('cmu4u5fka00gajx7dagh54fus', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0a005ojx7dtfjj8acq', 'SALE', -14.000, 466.000, NULL, 'INV-2026-00030', 'invoice', 'cmu4u5fk600g7jx7do0d0eyph', 'Sold on INV-2026-00030', '2026-09-17 00:00:00', NULL, '2026-09-17 01:13:06.826');


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f22006cjx7dqedeeuh2', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0q005wjx7d21lo13mf', 'QTE-2026-00001', 'ACCEPTED', '2026-07-09 01:13:05.335', '2026-08-08 01:13:05.335', 'GHS', 4896.00, 'PERCENTAGE', 5.00, 242.23, 460.24, 5062.66, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-10 01:13:05.335', '2026-07-14 01:13:05.335', NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-09 01:13:05.335', '2026-09-17 01:13:06.17', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f2a006jjx7d0ypvuic9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0s005xjx7d4qi4ji6y', 'QTE-2026-00002', 'SENT', '2026-08-01 01:13:05.335', '2026-08-31 01:13:05.335', 'GHS', 6230.00, 'PERCENTAGE', 0.00, 0.00, 606.09, 6667.04, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-02 01:13:05.335', NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-01 01:13:05.335', '2026-09-17 01:13:06.178', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f2h006pjx7d3olygi8n', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0u005yjx7d0wha4vi3', 'QTE-2026-00003', 'DRAFT', '2026-08-22 01:13:05.335', '2026-09-21 01:13:05.335', 'GHS', 3890.00, 'PERCENTAGE', 0.00, 0.00, 389.00, 4279.00, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', NULL, NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-22 01:13:05.335', '2026-09-17 01:13:06.185', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f2o006vjx7dlc9m7a13', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f0w005zjx7ddaqejxe8', 'QTE-2026-00004', 'REJECTED', '2026-07-15 01:13:05.335', '2026-08-14 01:13:05.335', 'GHS', 17225.00, 'PERCENTAGE', 5.00, 856.26, 1626.90, 17895.89, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-07-16 01:13:05.335', NULL, '2026-07-21 01:13:05.335', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-15 01:13:05.335', '2026-09-17 01:13:06.192', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f2w0070jx7dxds5vyqw', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f120060jx7du0ttfoyd', 'QTE-2026-00005', 'SENT', '2026-09-09 01:13:05.335', '2026-10-09 01:13:05.335', 'GHS', 18096.00, 'PERCENTAGE', 0.00, 0.00, 1769.49, 19464.39, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-09-10 01:13:05.335', NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-09 01:13:05.335', '2026-09-17 01:13:06.2', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f320077jx7dbtl2iuw0', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f140061jx7dwarganau', 'QTE-2026-00006', 'EXPIRED', '2026-07-31 01:13:05.335', '2026-08-30 01:13:05.335', 'GHS', 26842.00, 'PERCENTAGE', 0.00, 0.00, 2684.20, 29526.20, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-01 01:13:05.335', NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-31 01:13:05.335', '2026-09-17 01:13:06.206', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f39007cjx7df8nffbet', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f190062jx7dig0iyu9c', 'QTE-2026-00007', 'ACCEPTED', '2026-06-25 01:13:05.335', '2026-07-25 01:13:05.335', 'GHS', 35884.00, 'PERCENTAGE', 5.00, 1792.85, 3406.42, 37470.57, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-06-26 01:13:05.335', '2026-07-04 01:13:05.335', NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-25 01:13:05.335', '2026-09-17 01:13:06.213', NULL);
INSERT INTO public.quotations (id, "organizationId", "customerId", number, status, "issueDate", "expiryDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", total, notes, terms, "sentAt", "acceptedAt", "rejectedAt", "convertedAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f3j007jjx7dd3hrtvu2', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1a0063jx7dp40puznl', 'QTE-2026-00008', 'SENT', '2026-08-09 01:13:05.335', '2026-09-08 01:13:05.335', 'GHS', 26465.00, 'PERCENTAGE', 0.00, 0.00, 2646.50, 29111.50, 'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.', 'Valid for 30 days. 50% deposit on order, balance on completion.', '2026-08-10 01:13:05.335', NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-09 01:13:05.335', '2026-09-17 01:13:06.223', NULL);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f3s007pjx7dwwuc4n3j', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0q005wjx7d21lo13mf', 'INV-2026-00001', 'PAID', '2026-03-25 00:00:00', '2026-04-08 00:00:00', 'GHS', 27587.00, 'PERCENTAGE', 3.00, 788.17, 2548.41, 0.00, 28032.54, 28032.54, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-03-26 00:00:00', '2026-03-27 00:00:00', '2026-04-03 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-03-25 00:00:00', '2026-09-17 01:13:06.232', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f4q0083jx7drthx1yom', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0s005xjx7d4qi4ji6y', 'INV-2026-00002', 'PAID', '2026-04-04 00:00:00', '2026-05-04 00:00:00', 'GHS', 10877.00, 'PERCENTAGE', 0.00, 0.00, 1087.70, 0.00, 11964.70, 11964.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-04-05 00:00:00', '2026-04-06 00:00:00', '2026-05-02 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-04 00:00:00', '2026-09-17 01:13:06.266', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f5a008djx7dbizevi8k', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0u005yjx7d0wha4vi3', 'INV-2026-00003', 'PAID', '2026-04-20 00:00:00', '2026-05-04 00:00:00', 'GHS', 10874.00, 'PERCENTAGE', 0.00, 0.00, 1075.43, 0.00, 11829.73, 11829.73, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-04-21 00:00:00', '2026-04-22 00:00:00', '2026-05-04 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-04-20 00:00:00', '2026-09-17 01:13:06.286', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f5w008njx7dwt4gsrnn', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0w005zjx7ddaqejxe8', 'INV-2026-00004', 'PAID', '2026-05-05 00:00:00', '2026-06-04 00:00:00', 'GHS', 22942.00, 'PERCENTAGE', 0.00, 0.00, 2291.71, 0.00, 25208.81, 25208.81, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-05-06 00:00:00', '2026-05-07 00:00:00', '2026-05-16 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-05 00:00:00', '2026-09-17 01:13:06.308', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f6r0091jx7d6w0f9ddd', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f120060jx7du0ttfoyd', 'INV-2026-00005', 'PAID', '2026-05-12 00:00:00', '2026-05-26 00:00:00', 'GHS', 23881.00, 'PERCENTAGE', 3.00, 698.12, 2257.25, 0.00, 24829.78, 24829.78, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-05-13 00:00:00', '2026-05-14 00:00:00', '2026-05-22 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-12 00:00:00', '2026-09-17 01:13:06.339', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f7l009fjx7dno49sdyc', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f140061jx7dwarganau', 'INV-2026-00006', 'PAID', '2026-05-12 00:00:00', '2026-05-26 00:00:00', 'GHS', 8067.00, 'PERCENTAGE', 0.00, 0.00, 773.24, 0.00, 8505.64, 8505.64, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-05-13 00:00:00', '2026-05-14 00:00:00', '2026-05-25 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-05-12 00:00:00', '2026-09-17 01:13:06.369', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f88009pjx7dwy937no0', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f190062jx7dig0iyu9c', 'INV-2026-00007', 'PAID', '2026-06-03 00:00:00', '2026-07-03 00:00:00', 'GHS', 4717.00, 'PERCENTAGE', 0.00, 0.00, 471.70, 0.00, 5188.70, 5188.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-04 00:00:00', '2026-06-05 00:00:00', '2026-06-07 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-03 00:00:00', '2026-09-17 01:13:06.392', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f8v009zjx7doea9r8ua', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1a0063jx7dp40puznl', 'INV-2026-00008', 'PAID', '2026-06-05 00:00:00', '2026-07-05 00:00:00', 'GHS', 3284.00, 'PERCENTAGE', 0.00, 0.00, 317.54, 0.00, 3492.94, 3492.94, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-06 00:00:00', '2026-06-07 00:00:00', '2026-06-29 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-05 00:00:00', '2026-09-17 01:13:06.415', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f9j00abjx7d8gpkt9r6', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1c0064jx7drs17fqe5', 'INV-2026-00009', 'PAID', '2026-06-05 00:00:00', '2026-06-19 00:00:00', 'GHS', 11742.00, 'PERCENTAGE', 3.00, 351.45, 1136.36, 0.00, 12499.91, 12499.91, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-06-06 00:00:00', '2026-06-07 00:00:00', '2026-06-15 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-05 00:00:00', '2026-09-17 01:13:06.439', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fa600anjx7dpho68io8', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1e0065jx7d2gkycotj', 'INV-2026-00010', 'PAID', '2026-06-15 00:00:00', '2026-07-15 00:00:00', 'GHS', 18104.00, 'PERCENTAGE', 0.00, 0.00, 1747.15, 0.00, 19218.65, 19218.65, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-16 00:00:00', '2026-06-17 00:00:00', '2026-06-29 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-15 00:00:00', '2026-09-17 01:13:06.462', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fav00azjx7de5yji16e', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0q005wjx7d21lo13mf', 'INV-2026-00011', 'PAID', '2026-06-24 00:00:00', '2026-07-24 00:00:00', 'GHS', 3693.00, 'PERCENTAGE', 0.00, 0.00, 368.11, 0.00, 4049.21, 4049.21, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-06-25 00:00:00', '2026-06-26 00:00:00', '2026-07-04 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-06-24 00:00:00', '2026-09-17 01:13:06.487', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fbl00bdjx7df15zpnmf', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0s005xjx7d4qi4ji6y', 'INV-2026-00012', 'PAID', '2026-07-03 00:00:00', '2026-07-17 00:00:00', 'GHS', 25416.00, 'PERCENTAGE', 0.00, 0.00, 2423.68, 0.00, 26660.48, 26660.48, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-04 00:00:00', '2026-07-05 00:00:00', '2026-07-06 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-03 00:00:00', '2026-09-17 01:13:06.513', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fc800brjx7dq1dkp4hp', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0u005yjx7d0wha4vi3', 'INV-2026-00013', 'PAID', '2026-07-04 00:00:00', '2026-07-18 00:00:00', 'GHS', 10807.00, 'PERCENTAGE', 3.00, 324.21, 1048.28, 0.00, 11531.07, 11531.07, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-05 00:00:00', '2026-07-06 00:00:00', '2026-07-10 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-04 00:00:00', '2026-09-17 01:13:06.536', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fcq00c1jx7dyzukvvig', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0w005zjx7ddaqejxe8', 'INV-2026-00014', 'PAID', '2026-07-06 00:00:00', '2026-07-20 00:00:00', 'GHS', 20327.00, 'PERCENTAGE', 0.00, 0.00, 2032.70, 0.00, 22359.70, 22359.70, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-07 00:00:00', '2026-07-08 00:00:00', '2026-07-17 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-06 00:00:00', '2026-09-17 01:13:06.554', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fd800cbjx7dlwg0dqfr', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f120060jx7du0ttfoyd', 'INV-2026-00015', 'PAID', '2026-07-14 00:00:00', '2026-07-28 00:00:00', 'GHS', 12296.00, 'PERCENTAGE', 0.00, 0.00, 1229.60, 0.00, 13525.60, 13525.60, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-07-15 00:00:00', '2026-07-16 00:00:00', '2026-07-23 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-14 00:00:00', '2026-09-17 01:13:06.572', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fdu00cnjx7dn3g1h9ei', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f140061jx7dwarganau', 'INV-2026-00016', 'PAID', '2026-07-30 00:00:00', '2026-08-29 00:00:00', 'GHS', 10809.00, 'PERCENTAGE', 0.00, 0.00, 1080.90, 0.00, 11889.90, 11889.90, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-07-31 00:00:00', '2026-08-01 00:00:00', '2026-08-07 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-07-30 00:00:00', '2026-09-17 01:13:06.594', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5feh00czjx7df5gb3qfu', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f190062jx7dig0iyu9c', 'INV-2026-00017', 'PAID', '2026-08-02 00:00:00', '2026-09-01 00:00:00', 'GHS', 11037.00, 'PERCENTAGE', 3.00, 318.75, 1030.63, 0.00, 11336.93, 11336.93, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-08-03 00:00:00', '2026-08-04 00:00:00', '2026-08-31 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-02 00:00:00', '2026-09-17 01:13:06.617', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ff300d9jx7dhdva9d0t', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1a0063jx7dp40puznl', 'INV-2026-00018', 'PAID', '2026-08-09 00:00:00', '2026-09-08 00:00:00', 'GHS', 44848.00, 'PERCENTAGE', 0.00, 0.00, 4477.31, 0.00, 49250.41, 49250.41, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-08-10 00:00:00', '2026-08-11 00:00:00', '2026-08-12 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-09 00:00:00', '2026-09-17 01:13:06.639', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ffn00dljx7ddo4glrf0', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1c0064jx7drs17fqe5', 'INV-2026-00019', 'PAID', '2026-08-18 00:00:00', '2026-09-01 00:00:00', 'GHS', 2841.00, 'PERCENTAGE', 0.00, 0.00, 284.10, 0.00, 3125.10, 3125.10, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-08-19 00:00:00', '2026-08-20 00:00:00', '2026-08-31 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-08-18 00:00:00', '2026-09-17 01:13:06.659', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fg100dtjx7dmkrjibam', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1e0065jx7d2gkycotj', 'INV-2026-00020', 'DRAFT', '2026-09-01 00:00:00', '2026-09-15 00:00:00', 'GHS', 1484.00, 'PERCENTAGE', 0.00, 0.00, 148.40, 0.00, 1632.40, 0.00, 1632.40, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-01 00:00:00', '2026-09-17 01:13:06.673', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fg800dxjx7df8is60rx', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0q005wjx7d21lo13mf', 'INV-2026-00021', 'SENT', '2026-09-03 00:00:00', '2026-09-24 00:00:00', 'GHS', 4985.00, 'PERCENTAGE', 3.00, 149.55, 483.55, 0.00, 5319.00, 0.00, 5319.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 21 days of the invoice date.', NULL, NULL, NULL, '2026-09-04 00:00:00', NULL, NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-03 00:00:00', '2026-09-17 01:13:06.68', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fgn00e6jx7dzty15xb8', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0s005xjx7d4qi4ji6y', 'INV-2026-00022', 'PAID', '2026-09-04 00:00:00', '2026-09-18 00:00:00', 'GHS', 3241.00, 'PERCENTAGE', 0.00, 0.00, 324.10, 0.00, 3565.10, 3565.10, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-05 00:00:00', '2026-09-06 00:00:00', '2026-09-07 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-04 00:00:00', '2026-09-17 01:13:06.695', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fh600egjx7dw4hx3d7p', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0u005yjx7d0wha4vi3', 'INV-2026-00023', 'VIEWED', '2026-09-06 00:00:00', '2026-10-06 00:00:00', 'GHS', 5401.00, 'PERCENTAGE', 0.00, 0.00, 534.33, 0.00, 5877.58, 0.00, 5877.58, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-07 00:00:00', '2026-09-08 00:00:00', NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-06 00:00:00', '2026-09-17 01:13:06.714', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fhk00epjx7d4pzbm9kw', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f0w005zjx7ddaqejxe8', 'INV-2026-00024', 'CANCELLED', '2026-09-07 00:00:00', '2026-10-07 00:00:00', 'GHS', 8428.00, 'PERCENTAGE', 0.00, 0.00, 810.67, 0.00, 8917.37, 0.00, 8917.37, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-08 00:00:00', NULL, NULL, '2026-09-11 00:00:00', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-07 00:00:00', '2026-09-17 01:13:06.728', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fhr00eujx7dc14cj576', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f120060jx7du0ttfoyd', 'INV-2026-00025', 'PAID', '2026-09-09 00:00:00', '2026-09-23 00:00:00', 'GHS', 5542.00, 'PERCENTAGE', 3.00, 166.26, 537.57, 0.00, 5913.31, 5913.31, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-10 00:00:00', '2026-09-11 00:00:00', '2026-09-13 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-09 00:00:00', '2026-09-17 01:13:06.735', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fib00f4jx7d0vw8tugu', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f140061jx7dwarganau', 'INV-2026-00026', 'PARTIALLY_PAID', '2026-09-11 00:00:00', '2026-10-11 00:00:00', 'GHS', 3115.00, 'PERCENTAGE', 0.00, 0.00, 311.50, 0.00, 3426.50, 1370.60, 2055.90, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-12 00:00:00', '2026-09-13 00:00:00', NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-11 00:00:00', '2026-09-17 01:13:06.755', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fis00fejx7dl1n9m0ng', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f190062jx7dig0iyu9c', 'INV-2026-00027', 'PAID', '2026-09-12 00:00:00', '2026-10-12 00:00:00', 'GHS', 9906.00, 'PERCENTAGE', 0.00, 0.00, 969.95, 0.00, 10669.40, 10669.40, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-13 00:00:00', '2026-09-14 00:00:00', '2026-09-16 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-12 00:00:00', '2026-09-17 01:13:06.772', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fjc00fojx7dpayufq7v', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1a0063jx7dp40puznl', 'INV-2026-00028', 'OVERDUE', '2026-09-14 00:00:00', '2026-09-28 00:00:00', 'GHS', 5984.00, 'PERCENTAGE', 0.00, 0.00, 598.40, 0.00, 6582.40, 0.00, 6582.40, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-15 00:00:00', '2026-09-16 00:00:00', NULL, NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-14 00:00:00', '2026-09-17 01:13:06.792', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fjm00fvjx7ds393itg9', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1c0064jx7drs17fqe5', 'INV-2026-00029', 'PAID', '2026-09-15 00:00:00', '2026-09-29 00:00:00', 'GHS', 9615.00, 'PERCENTAGE', 3.00, 280.86, 908.11, 0.00, 9989.20, 9989.20, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 14 days of the invoice date.', NULL, NULL, NULL, '2026-09-16 00:00:00', '2026-09-17 00:00:00', '2026-09-18 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-15 00:00:00', '2026-09-17 01:13:06.802', NULL);
INSERT INTO public.invoices (id, "organizationId", "branchId", "customerId", number, status, "issueDate", "dueDate", currency, subtotal, "discountType", "discountValue", "discountAmount", "taxAmount", "shippingAmount", total, "amountPaid", "balanceDue", notes, terms, reference, "quotationId", "projectId", "sentAt", "viewedAt", "paidAt", "cancelledAt", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fk600g7jx7do0d0eyph', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'cmu4u5f1e0065jx7d2gkycotj', 'INV-2026-00030', 'PAID', '2026-09-17 00:00:00', '2026-10-17 00:00:00', 'GHS', 2426.00, 'PERCENTAGE', 0.00, 0.00, 242.60, 0.00, 2668.60, 2668.60, 0.00, 'Thank you for your order. Please quote the invoice number with payment.', 'Payment due within 30 days of the invoice date.', NULL, NULL, NULL, '2026-09-18 00:00:00', '2026-09-19 00:00:00', '2026-10-15 00:00:00', NULL, 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 00:00:00', '2026-09-17 01:13:06.822', NULL);


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3t007qjx7dk3s22g1t', 'cmu4u5f3s007pjx7dwwuc4n3j', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 5.000, 'unit', 34.00, 0.000, 10.000, 170.00, 0.00, 17.00, 187.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3t007rjx7d3g1kbdhk', 'cmu4u5f3s007pjx7dwwuc4n3j', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 11.000, 'unit', 399.00, 5.000, 10.000, 4389.00, 219.45, 416.96, 4586.51, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3t007sjx7d60nihg77', 'cmu4u5f3s007pjx7dwwuc4n3j', 'cmu4u5eyv004yjx7db6weovxj', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 13.000, 'unit', 1685.00, 5.000, 10.000, 21905.00, 1095.25, 2080.98, 22890.73, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3t007tjx7d0yhgvqhu', 'cmu4u5f3s007pjx7dwwuc4n3j', 'cmu4u5eza0056jx7dgeagqkcc', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 2.000, 'unit', 249.00, 0.000, 10.000, 498.00, 0.00, 49.80, 547.80, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3t007ujx7dhcrasiqa', 'cmu4u5f3s007pjx7dwwuc4n3j', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 5.000, 'hour', 125.00, 0.000, 10.000, 625.00, 0.00, 62.50, 687.50, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f4r0084jx7dopc1g3xv', 'cmu4u5f4q0083jx7drthx1yom', 'cmu4u5eyr004wjx7d1ch2rblo', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 13.000, 'unit', 689.00, 0.000, 10.000, 8957.00, 0.00, 895.70, 9852.70, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f4r0085jx7dtpbv1v5g', 'cmu4u5f4q0083jx7drthx1yom', 'cmu4u5f00005ijx7dy98677aa', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 5.000, 'unit', 84.00, 0.000, 10.000, 420.00, 0.00, 42.00, 462.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f4r0086jx7d3ykofa05', 'cmu4u5f4q0083jx7drthx1yom', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5b008ejx7deuoteqvj', 'cmu4u5f5a008djx7dbizevi8k', 'cmu4u5ezo005cjx7dg52dm6yu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 9.000, 'unit', 845.00, 0.000, 10.000, 7605.00, 0.00, 760.50, 8365.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5b008fjx7d7auf7f3w', 'cmu4u5f5a008djx7dbizevi8k', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 6.000, 'unit', 399.00, 5.000, 10.000, 2394.00, 119.70, 227.43, 2501.73, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5b008gjx7d0dazkcaw', 'cmu4u5f5a008djx7dbizevi8k', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5x008ojx7d9l2xzbfa', 'cmu4u5f5w008njx7dwt4gsrnn', 'cmu4u5eyr004wjx7d1ch2rblo', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 2.000, 'unit', 689.00, 0.000, 10.000, 1378.00, 0.00, 137.80, 1515.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5x008pjx7dzufji2e4', 'cmu4u5f5w008njx7dwt4gsrnn', 'cmu4u5ezo005cjx7dg52dm6yu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 12.000, 'unit', 845.00, 0.000, 10.000, 10140.00, 0.00, 1014.00, 11154.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5x008qjx7du7aluf3x', 'cmu4u5f5w008njx7dwt4gsrnn', 'cmu4u5eza0056jx7dgeagqkcc', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 2.000, 'unit', 249.00, 5.000, 10.000, 498.00, 24.90, 47.31, 520.41, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5x008rjx7dbe1uvom8', 'cmu4u5f5w008njx7dwt4gsrnn', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 14.000, 'unit', 749.00, 0.000, 10.000, 10486.00, 0.00, 1048.60, 11534.60, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f5x008sjx7du2ybv42a', 'cmu4u5f5w008njx7dwt4gsrnn', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 5.000, 'hour', 88.00, 0.000, 10.000, 440.00, 0.00, 44.00, 484.00, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f6r0092jx7dstg7e5cm', 'cmu4u5f6r0091jx7d6w0f9ddd', 'cmu4u5eyr004wjx7d1ch2rblo', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 3.000, 'unit', 689.00, 5.000, 10.000, 2067.00, 103.35, 196.37, 2160.02, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f6r0093jx7dvlmhy9es', 'cmu4u5f6r0091jx7d6w0f9ddd', 'cmu4u5eze0058jx7dphqgj7bn', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 9.000, 'unit', 1150.00, 0.000, 10.000, 10350.00, 0.00, 1035.00, 11385.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f6r0094jx7d8hng9qc8', 'cmu4u5f6r0091jx7d6w0f9ddd', 'cmu4u5ezo005cjx7dg52dm6yu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 12.000, 'unit', 845.00, 5.000, 10.000, 10140.00, 507.00, 963.30, 10596.30, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f6r0095jx7d1bqvdjy3', 'cmu4u5f6r0091jx7d6w0f9ddd', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 4.000, 'unit', 45.00, 0.000, 10.000, 180.00, 0.00, 18.00, 198.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f6r0096jx7dplvfg3tl', 'cmu4u5f6r0091jx7d6w0f9ddd', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 13.000, 'hour', 88.00, 0.000, 10.000, 1144.00, 0.00, 114.40, 1258.40, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f7m009gjx7dl57vja5c', 'cmu4u5f7l009fjx7dno49sdyc', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 5.000, 10.000, 1106.00, 55.30, 105.07, 1155.77, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f7m009hjx7dg8yx5k5y', 'cmu4u5f7l009fjx7dno49sdyc', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 14.000, 'unit', 399.00, 5.000, 10.000, 5586.00, 279.30, 530.67, 5837.37, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f7m009ijx7dna08hku1', 'cmu4u5f7l009fjx7dno49sdyc', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 11.000, 'hour', 125.00, 0.000, 10.000, 1375.00, 0.00, 137.50, 1512.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f88009qjx7dyxax73sm', 'cmu4u5f88009pjx7dwy937no0', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f88009rjx7dsw7nphqj', 'cmu4u5f88009pjx7dwy937no0', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 7.000, 'unit', 459.00, 0.000, 10.000, 3213.00, 0.00, 321.30, 3534.30, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f88009sjx7dshcfapbo', 'cmu4u5f88009pjx7dwy937no0', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 13.000, 'hour', 88.00, 0.000, 10.000, 1144.00, 0.00, 114.40, 1258.40, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f8w00a0jx7d3hr14ps0', 'cmu4u5f8v009zjx7doea9r8ua', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 12.000, 'unit', 34.00, 0.000, 10.000, 408.00, 0.00, 40.80, 448.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f8w00a1jx7dh7uquee4', 'cmu4u5f8v009zjx7doea9r8ua', 'cmu4u5eza0056jx7dgeagqkcc', 'Draughtsman Stool', 'Height-adjustable stool with footring, grey fabric.', 8.000, 'unit', 249.00, 5.000, 10.000, 1992.00, 99.60, 189.24, 2081.64, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f8w00a2jx7dnmvgyd5s', 'cmu4u5f8v009zjx7doea9r8ua', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 4.000, 'unit', 45.00, 5.000, 10.000, 180.00, 9.00, 17.10, 188.10, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f8w00a3jx7dotsk8bkf', 'cmu4u5f8v009zjx7doea9r8ua', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 8.000, 'hour', 88.00, 0.000, 10.000, 704.00, 0.00, 70.40, 774.40, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f9j00acjx7dq2q5kevw', 'cmu4u5f9j00abjx7d8gpkt9r6', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 5.000, 10.000, 540.00, 27.00, 51.30, 564.30, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f9j00adjx7dwam533fs', 'cmu4u5f9j00abjx7d8gpkt9r6', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 10.000, 'unit', 34.00, 0.000, 10.000, 340.00, 0.00, 34.00, 374.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f9j00aejx7d4ghat7mv', 'cmu4u5f9j00abjx7d8gpkt9r6', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 13.000, 'unit', 749.00, 0.000, 10.000, 9737.00, 0.00, 973.70, 10710.70, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f9j00afjx7d5nmgujag', 'cmu4u5f9j00abjx7d8gpkt9r6', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 9.000, 'hour', 125.00, 0.000, 10.000, 1125.00, 0.00, 112.50, 1237.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fa800aojx7d0trwbvjp', 'cmu4u5fa600anjx7dpho68io8', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 10.000, 'unit', 399.00, 0.000, 10.000, 3990.00, 0.00, 399.00, 4389.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fa800apjx7dwreqg1ma', 'cmu4u5fa600anjx7dpho68io8', 'cmu4u5ezw005gjx7dvaemkhdj', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 6.000, 'unit', 119.00, 0.000, 10.000, 714.00, 0.00, 71.40, 785.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fa800aqjx7dfmochpfe', 'cmu4u5fa600anjx7dpho68io8', 'cmu4u5eze0058jx7dphqgj7bn', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 11.000, 'unit', 1150.00, 5.000, 10.000, 12650.00, 632.50, 1201.75, 13219.25, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fa800arjx7dkew255na', 'cmu4u5fa600anjx7dpho68io8', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 6.000, 'hour', 125.00, 0.000, 10.000, 750.00, 0.00, 75.00, 825.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fav00b0jx7dy9m9tp1t', 'cmu4u5fav00azjx7de5yji16e', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 7.000, 'unit', 34.00, 5.000, 10.000, 238.00, 11.90, 22.61, 248.71, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fav00b1jx7depw2obsb', 'cmu4u5fav00azjx7de5yji16e', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 0.000, 10.000, 540.00, 0.00, 54.00, 594.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fav00b2jx7dndeglirv', 'cmu4u5fav00azjx7de5yji16e', 'cmu4u5ezt005ejx7dqkzle5xd', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 5.000, 'unit', 289.00, 0.000, 10.000, 1445.00, 0.00, 144.50, 1589.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fav00b3jx7dsc7lk8uf', 'cmu4u5fav00azjx7de5yji16e', 'cmu4u5ezw005gjx7dvaemkhdj', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 5.000, 'unit', 119.00, 0.000, 10.000, 595.00, 0.00, 59.50, 654.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fav00b4jx7dy7c8jsp8', 'cmu4u5fav00azjx7de5yji16e', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fbl00bejx7dkv4ojn3v', 'cmu4u5fbl00bdjx7df15zpnmf', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 0.000, 10.000, 1106.00, 0.00, 110.60, 1216.60, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fbl00bfjx7df7jwixm6', 'cmu4u5fbl00bdjx7df15zpnmf', 'cmu4u5eyv004yjx7db6weovxj', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 11.000, 'unit', 1685.00, 5.000, 10.000, 18535.00, 926.75, 1760.83, 19369.08, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fbl00bgjx7d7bikys3o', 'cmu4u5fbl00bdjx7df15zpnmf', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 11.000, 'unit', 459.00, 5.000, 10.000, 5049.00, 252.45, 479.66, 5276.21, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fbl00bhjx7dej63xtt0', 'cmu4u5fbl00bdjx7df15zpnmf', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 11.000, 'unit', 34.00, 0.000, 10.000, 374.00, 0.00, 37.40, 411.40, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fbl00bijx7dsims8og2', 'cmu4u5fbl00bdjx7df15zpnmf', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 4);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fc800bsjx7duz0c3ctj', 'cmu4u5fc800brjx7dq1dkp4hp', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 8.000, 'unit', 79.00, 0.000, 10.000, 632.00, 0.00, 63.20, 695.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fc800btjx7drw719wnm', 'cmu4u5fc800brjx7dq1dkp4hp', 'cmu4u5ezo005cjx7dg52dm6yu', 'Personal Locker Bank of 6', 'Six-door locker bank with digital locks.', 11.000, 'unit', 845.00, 0.000, 10.000, 9295.00, 0.00, 929.50, 10224.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fc800bujx7dh28a1g5q', 'cmu4u5fc800brjx7dq1dkp4hp', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fcr00c2jx7d46efmsap', 'cmu4u5fcq00c1jx7dyzukvvig', 'cmu4u5eyv004yjx7db6weovxj', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 8.000, 'unit', 1685.00, 0.000, 10.000, 13480.00, 0.00, 1348.00, 14828.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fcr00c3jx7dy6k7d423', 'cmu4u5fcq00c1jx7dyzukvvig', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 13.000, 'unit', 459.00, 0.000, 10.000, 5967.00, 0.00, 596.70, 6563.70, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fcr00c4jx7duapl3stu', 'cmu4u5fcq00c1jx7dyzukvvig', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fd900ccjx7dusvytlku', 'cmu4u5fd800cbjx7dlwg0dqfr', 'cmu4u5ezt005ejx7dqkzle5xd', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 9.000, 'unit', 289.00, 0.000, 10.000, 2601.00, 0.00, 260.10, 2861.10, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fd900cdjx7d5iykqhgp', 'cmu4u5fd800cbjx7dlwg0dqfr', 'cmu4u5ezh005ajx7dbhusx0b4', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 9.000, 'unit', 165.00, 0.000, 10.000, 1485.00, 0.00, 148.50, 1633.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fd900cejx7d18l9thss', 'cmu4u5fd800cbjx7dlwg0dqfr', 'cmu4u5eyr004wjx7d1ch2rblo', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 10.000, 'unit', 689.00, 0.000, 10.000, 6890.00, 0.00, 689.00, 7579.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fd900cfjx7d1yotdfzy', 'cmu4u5fd800cbjx7dlwg0dqfr', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fdv00cojx7dv2ofvwdv', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fdv00cpjx7dizb1zk79', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'cmu4u5f00005ijx7dy98677aa', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 4.000, 'unit', 84.00, 0.000, 10.000, 336.00, 0.00, 33.60, 369.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fdv00cqjx7de13pyt8z', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 12.000, 'unit', 749.00, 0.000, 10.000, 8988.00, 0.00, 898.80, 9886.80, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fdv00crjx7dfwyp96xw', 'cmu4u5fdu00cnjx7dn3g1h9ei', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 9.000, 'hour', 125.00, 0.000, 10.000, 1125.00, 0.00, 112.50, 1237.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5feh00d0jx7dfws7t0cj', 'cmu4u5feh00czjx7df5gb3qfu', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 11.000, 'unit', 749.00, 5.000, 10.000, 8239.00, 411.95, 782.71, 8609.76, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5feh00d1jx7dkzclpq35', 'cmu4u5feh00czjx7df5gb3qfu', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 2.000, 'unit', 399.00, 0.000, 10.000, 798.00, 0.00, 79.80, 877.80, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5feh00d2jx7dlyikjy1q', 'cmu4u5feh00czjx7df5gb3qfu', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 16.000, 'hour', 125.00, 0.000, 10.000, 2000.00, 0.00, 200.00, 2200.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5ff300dajx7dw1hej3t2', 'cmu4u5ff300d9jx7dhdva9d0t', 'cmu4u5ezw005gjx7dvaemkhdj', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 2.000, 'unit', 119.00, 0.000, 10.000, 238.00, 0.00, 23.80, 261.80, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5ff300dbjx7dcldwkooj', 'cmu4u5ff300d9jx7dhdva9d0t', 'cmu4u5f07005mjx7d4akrl95w', 'Phone Booth Single', 'Single-occupancy acoustic pod with ventilation and lighting.', 8.000, 'unit', 5290.00, 0.000, 10.000, 42320.00, 0.00, 4232.00, 46552.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5ff300dcjx7dxlsi33xt', 'cmu4u5ff300d9jx7dhdva9d0t', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 2.000, 'unit', 749.00, 5.000, 10.000, 1498.00, 74.90, 142.31, 1565.41, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5ff300ddjx7d03bcoc0s', 'cmu4u5ff300d9jx7dhdva9d0t', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 9.000, 'hour', 88.00, 0.000, 10.000, 792.00, 0.00, 79.20, 871.20, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5ffo00dmjx7dtrzyf25a', 'cmu4u5ffn00dljx7ddo4glrf0', 'cmu4u5eyz0050jx7degrc5roz', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 5.000, 'unit', 445.00, 0.000, 10.000, 2225.00, 0.00, 222.50, 2447.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5ffo00dnjx7d9wc3y6ia', 'cmu4u5ffn00dljx7ddo4glrf0', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 7.000, 'hour', 88.00, 0.000, 10.000, 616.00, 0.00, 61.60, 677.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fg200dujx7de4zzx0aq', 'cmu4u5fg100dtjx7dmkrjibam', 'cmu4u5f00005ijx7dy98677aa', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 3.000, 'unit', 84.00, 0.000, 10.000, 252.00, 0.00, 25.20, 277.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fg200dvjx7d81tfxvuz', 'cmu4u5fg100dtjx7dmkrjibam', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 14.000, 'hour', 88.00, 0.000, 10.000, 1232.00, 0.00, 123.20, 1355.20, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fg900dyjx7dhoxpsb61', 'cmu4u5fg800dxjx7df8is60rx', 'cmu4u5f00005ijx7dy98677aa', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 10.000, 'unit', 84.00, 0.000, 10.000, 840.00, 0.00, 84.00, 924.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fg900dzjx7dnry8c5lx', 'cmu4u5fg800dxjx7df8is60rx', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 4.000, 'unit', 79.00, 0.000, 10.000, 316.00, 0.00, 31.60, 347.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fg900e0jx7duhl2ie6v', 'cmu4u5fg800dxjx7df8is60rx', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 7.000, 'unit', 459.00, 0.000, 10.000, 3213.00, 0.00, 321.30, 3534.30, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fg900e1jx7dw5nhrhaa', 'cmu4u5fg800dxjx7df8is60rx', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 7.000, 'hour', 88.00, 0.000, 10.000, 616.00, 0.00, 61.60, 677.60, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fgn00e7jx7dhe1im3qh', 'cmu4u5fgn00e6jx7dzty15xb8', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 3.000, 'unit', 45.00, 0.000, 10.000, 135.00, 0.00, 13.50, 148.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fgn00e8jx7dizdswnr0', 'cmu4u5fgn00e6jx7dzty15xb8', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 6.000, 'unit', 459.00, 0.000, 10.000, 2754.00, 0.00, 275.40, 3029.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fgn00e9jx7dum2i32p0', 'cmu4u5fgn00e6jx7dzty15xb8', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fh600ehjx7d5romtrpv', 'cmu4u5fh600egjx7dw4hx3d7p', 'cmu4u5ezh005ajx7dbhusx0b4', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 7.000, 'unit', 165.00, 5.000, 10.000, 1155.00, 57.75, 109.73, 1206.98, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fh600eijx7dwrcs5ztw', 'cmu4u5fh600egjx7dw4hx3d7p', 'cmu4u5eyr004wjx7d1ch2rblo', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 4.000, 'unit', 689.00, 0.000, 10.000, 2756.00, 0.00, 275.60, 3031.60, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fh600ejjx7dvi78bp5h', 'cmu4u5fh600egjx7dw4hx3d7p', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 5.000, 'unit', 34.00, 0.000, 10.000, 170.00, 0.00, 17.00, 187.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fh600ekjx7dbf7ekkh1', 'cmu4u5fh600egjx7dw4hx3d7p', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fhl00eqjx7dqzkz7qeh', 'cmu4u5fhk00epjx7d4pzbm9kw', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 14.000, 'unit', 459.00, 5.000, 10.000, 6426.00, 321.30, 610.47, 6715.17, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fhl00erjx7delw5w81d', 'cmu4u5fhk00epjx7d4pzbm9kw', 'cmu4u5ezh005ajx7dbhusx0b4', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 10.000, 'unit', 165.00, 0.000, 10.000, 1650.00, 0.00, 165.00, 1815.00, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fhl00esjx7d8vc5fqfk', 'cmu4u5fhk00epjx7d4pzbm9kw', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fhs00evjx7dy47krk44', 'cmu4u5fhr00eujx7dc14cj576', 'cmu4u5ezt005ejx7dqkzle5xd', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 5.000, 'unit', 289.00, 0.000, 10.000, 1445.00, 0.00, 144.50, 1589.50, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fhs00ewjx7d36ki2a2r', 'cmu4u5fhr00eujx7dc14cj576', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 5.000, 'unit', 749.00, 0.000, 10.000, 3745.00, 0.00, 374.50, 4119.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fhs00exjx7d2iczmjqv', 'cmu4u5fhr00eujx7dc14cj576', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 4.000, 'hour', 88.00, 0.000, 10.000, 352.00, 0.00, 35.20, 387.20, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fib00f5jx7dcx9krgaw', 'cmu4u5fib00f4jx7d0vw8tugu', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 13.000, 'unit', 34.00, 0.000, 10.000, 442.00, 0.00, 44.20, 486.20, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fib00f6jx7dlgwyu9f8', 'cmu4u5fib00f4jx7d0vw8tugu', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 2.000, 'unit', 399.00, 0.000, 10.000, 798.00, 0.00, 79.80, 877.80, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fib00f7jx7df4kowk99', 'cmu4u5fib00f4jx7d0vw8tugu', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 15.000, 'hour', 125.00, 0.000, 10.000, 1875.00, 0.00, 187.50, 2062.50, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fit00ffjx7d9v2y6zo5', 'cmu4u5fis00fejx7dl1n9m0ng', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 9.000, 'unit', 459.00, 5.000, 10.000, 4131.00, 206.55, 392.45, 4316.90, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fit00fgjx7dd6bqgqne', 'cmu4u5fis00fejx7dl1n9m0ng', 'cmu4u5eyz0050jx7degrc5roz', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 11.000, 'unit', 445.00, 0.000, 10.000, 4895.00, 0.00, 489.50, 5384.50, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fit00fhjx7dnlbkbz6g', 'cmu4u5fis00fejx7dl1n9m0ng', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 10.000, 'hour', 88.00, 0.000, 10.000, 880.00, 0.00, 88.00, 968.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjc00fpjx7dxm8xdltd', 'cmu4u5fjc00fojx7dpayufq7v', 'cmu4u5eyz0050jx7degrc5roz', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 8.000, 'unit', 445.00, 0.000, 10.000, 3560.00, 0.00, 356.00, 3916.00, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjc00fqjx7dsvbm1brs', 'cmu4u5fjc00fojx7dpayufq7v', 'cmu4u5f00005ijx7dy98677aa', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 11.000, 'unit', 84.00, 0.000, 10.000, 924.00, 0.00, 92.40, 1016.40, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjc00frjx7d0r6hmfcl', 'cmu4u5fjc00fojx7dpayufq7v', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjn00fwjx7do3iy5w9k', 'cmu4u5fjm00fvjx7ds393itg9', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 10.000, 'unit', 399.00, 5.000, 10.000, 3990.00, 199.50, 379.05, 4169.55, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjn00fxjx7dytia2893', 'cmu4u5fjm00fvjx7ds393itg9', 'cmu4u5ezw005gjx7dvaemkhdj', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 9.000, 'unit', 119.00, 5.000, 10.000, 1071.00, 53.55, 101.75, 1119.20, 1);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjn00fyjx7daghm9km8', 'cmu4u5fjm00fvjx7ds393itg9', 'cmu4u5ezt005ejx7dqkzle5xd', 'Open Shelving Unit 1800', 'Five-tier open shelving, powder-coated steel.', 11.000, 'unit', 289.00, 0.000, 10.000, 3179.00, 0.00, 317.90, 3496.90, 2);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fjn00fzjx7diouexy8r', 'cmu4u5fjm00fvjx7ds393itg9', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 11.000, 'hour', 125.00, 0.000, 10.000, 1375.00, 0.00, 137.50, 1512.50, 3);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fk600g8jx7dt4svl29h', 'cmu4u5fk600g7jx7do0d0eyph', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 14.000, 'unit', 79.00, 0.000, 10.000, 1106.00, 0.00, 110.60, 1216.60, 0);
INSERT INTO public.invoice_items (id, "invoiceId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5fk600g9jx7dkzn4p4ut', 'cmu4u5fk600g7jx7do0d0eyph', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 15.000, 'hour', 88.00, 0.000, 10.000, 1320.00, 0.00, 132.00, 1452.00, 1);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu4u5ftw00m4jx7ddgsy1j9c', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'INVOICE_OVERDUE', 'INV-2026-00028 is past due', 'Owen Pritchard has not settled this invoice. Consider sending a reminder.', '/invoices/cmu4u5fjc00fojx7dpayufq7v', NULL, '2026-09-17 01:13:07.172');
INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu4u5ftw00m5jx7d6qgcpzxt', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'LOW_STOCK', 'Three products are below their reorder point', 'Draughtsman Stool, Corner Workstation 1800 and Acoustic Ceiling Baffle need restocking.', '/inventory', NULL, '2026-09-17 01:13:07.172');
INSERT INTO public.notifications (id, "organizationId", "userId", type, title, body, href, "readAt", "createdAt") VALUES ('cmu4u5ftw00m6jx7dyxhefull', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'PAYMENT_RECEIVED', 'Payment received', 'A bank transfer has been matched to an open invoice.', '/payments', '2026-09-16 01:13:05.335', '2026-09-17 01:13:07.172');


--
-- Data for Name: number_sequences; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu4u5f1u006bjx7dg2z3xgjp', 'cmu4u5eus0037jx7dx1af4of5', 'quotation', 2026, 8, '2026-09-17 01:13:06.216');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu4u5fki00gejx7dnhevzrvr', 'cmu4u5eus0037jx7dx1af4of5', 'expense', 2026, 40, '2026-09-17 01:13:07.05');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu4u5fs100kqjx7d4x09vp0r', 'cmu4u5eus0037jx7dx1af4of5', 'payroll', 2026, 5, '2026-09-17 01:13:07.124');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu4u5f3m007ojx7d9sq4nyh0', 'cmu4u5eus0037jx7dx1af4of5', 'invoice', 2026, 30, '2026-09-17 01:13:06.818');
INSERT INTO public.number_sequences (id, "organizationId", "docType", year, current, "updatedAt") VALUES ('cmu4u5f4c007zjx7dxydho8rl', 'cmu4u5eus0037jx7dx1af4of5', 'payment', 2026, 25, '2026-09-17 01:13:06.826');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eus0037jx7dx1af4of5', 'owner', 'Owner', 'Unrestricted access, including billing and organization deletion.', true, '2026-09-17 01:13:05.914', '2026-09-17 01:13:05.914');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eus0037jx7dx1af4of5', 'admin', 'Administrator', 'Full access to every module and to user management.', true, '2026-09-17 01:13:05.924', '2026-09-17 01:13:05.924');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eus0037jx7dx1af4of5', 'manager', 'Manager', 'Runs day-to-day operations across sales, purchasing, inventory and projects.', true, '2026-09-17 01:13:05.933', '2026-09-17 01:13:05.933');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eus0037jx7dx1af4of5', 'accountant', 'Accountant', 'Owns finance: expenses, payments, accounts, payroll and reporting.', true, '2026-09-17 01:13:05.94', '2026-09-17 01:13:05.94');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eus0037jx7dx1af4of5', 'sales', 'Sales', 'Works the pipeline: customers, quotations, invoices and payments.', true, '2026-09-17 01:13:05.944', '2026-09-17 01:13:05.944');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eus0037jx7dx1af4of5', 'employee', 'Employee', 'Self-service access to assigned projects, tasks and timesheets.', true, '2026-09-17 01:13:05.952', '2026-09-17 01:13:05.952');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5ewt003xjx7d38fw5vj4', 'owner', 'Owner', 'Unrestricted access, including billing and organization deletion.', true, '2026-09-17 01:13:05.984', '2026-09-17 01:13:05.984');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5ewt003xjx7d38fw5vj4', 'admin', 'Administrator', 'Full access to every module and to user management.', true, '2026-09-17 01:13:05.992', '2026-09-17 01:13:05.992');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5ewt003xjx7d38fw5vj4', 'manager', 'Manager', 'Runs day-to-day operations across sales, purchasing, inventory and projects.', true, '2026-09-17 01:13:06', '2026-09-17 01:13:06');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5ewt003xjx7d38fw5vj4', 'accountant', 'Accountant', 'Owns finance: expenses, payments, accounts, payroll and reporting.', true, '2026-09-17 01:13:06.009', '2026-09-17 01:13:06.009');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5ewt003xjx7d38fw5vj4', 'sales', 'Sales', 'Works the pipeline: customers, quotations, invoices and payments.', true, '2026-09-17 01:13:06.013', '2026-09-17 01:13:06.013');
INSERT INTO public.roles (id, "organizationId", key, name, description, "isSystem", "createdAt", "updatedAt") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5ewt003xjx7d38fw5vj4', 'employee', 'Employee', 'Self-service access to assigned projects, tasks and timesheets.', true, '2026-09-17 01:13:06.017', '2026-09-17 01:13:06.017');


--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ew4003fjx7du1s13mtp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5et20000jx7dcz9ph7f0', 'cmu4u5euy0039jx7dmywf5too', NULL, 'ACTIVE', true, NULL, '2026-09-17 01:13:05.954', '2026-09-17 01:13:05.956', '2026-09-17 01:13:05.956', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewf003sjx7d9xkrcmpi', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5et90001jx7dqi719aiu', 'cmu4u5evh003bjx7dntjuil21', NULL, 'ACTIVE', false, NULL, '2025-07-17 01:13:05.335', '2026-09-17 01:13:05.967', '2026-09-17 01:13:05.967', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewf003tjx7dyq5blvwb', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5et90002jx7d1m0qar2v', 'cmu4u5evo003cjx7d1n2jns59', NULL, 'ACTIVE', false, NULL, '2025-11-17 01:13:05.335', '2026-09-17 01:13:05.967', '2026-09-17 01:13:05.967', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewf003ujx7dk39fmqa1', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5et90003jx7d1ok8xhqo', 'cmu4u5evs003djx7d1zvlaidk', NULL, 'ACTIVE', false, NULL, '2024-06-17 01:13:05.335', '2026-09-17 01:13:05.967', '2026-09-17 01:13:05.967', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ewf003vjx7dqqwhhena', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5et90004jx7dzuzi8zue', 'cmu4u5ew0003ejx7dsc68lw8l', NULL, 'ACTIVE', false, NULL, '2026-06-17 01:13:05.335', '2026-09-17 01:13:05.967', '2026-09-17 01:13:05.967', NULL);
INSERT INTO public.organization_members (id, "organizationId", "userId", "roleId", "branchId", status, "isOwner", "invitedAt", "joinedAt", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5exv0045jx7dpdqx2dzr', 'cmu4u5ewt003xjx7d38fw5vj4', 'cmu4u5ewq003wjx7dp756moz6', 'cmu4u5eww003zjx7dm4kujig5', NULL, 'ACTIVE', true, NULL, '2026-09-17 01:13:06.019', '2026-09-17 01:13:06.019', '2026-09-17 01:13:06.019', NULL);


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f4g0080jx7dep1gozd9', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00001', 'INCOMING', 'CHECK', 28032.54, 'GHS', '2026-03-28 00:00:00', 'INV-2026-00001/REM', 'Part payment on account ahead of the second delivery.', 'cmu4u5f0q005wjx7d21lo13mf', NULL, 'cmu4u5f3s007pjx7dwwuc4n3j', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.256', '2026-09-17 01:13:06.256', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f51008ajx7du3gj0zk2', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00002', 'INCOMING', 'CHECK', 11964.70, 'GHS', '2026-04-27 00:00:00', 'INV-2026-00002/REM', 'Part payment on account ahead of the second delivery.', 'cmu4u5f0s005xjx7d4qi4ji6y', NULL, 'cmu4u5f4q0083jx7drthx1yom', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.277', '2026-09-17 01:13:06.277', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f5n008kjx7dcz2catm8', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00003', 'INCOMING', 'BANK_TRANSFER', 11829.73, 'GHS', '2026-04-29 00:00:00', 'INV-2026-00003/REM', 'Card payment taken over the phone.', 'cmu4u5f0u005yjx7d0wha4vi3', NULL, 'cmu4u5f5a008djx7dbizevi8k', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.299', '2026-09-17 01:13:06.299', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f6g008yjx7d9841bwho', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00004', 'INCOMING', 'BANK_TRANSFER', 25208.81, 'GHS', '2026-06-03 00:00:00', 'INV-2026-00004/REM', 'Cleared after statement chase.', 'cmu4u5f0w005zjx7ddaqejxe8', NULL, 'cmu4u5f5w008njx7dwt4gsrnn', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.328', '2026-09-17 01:13:06.328', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f79009cjx7dvyuqc5hw', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00005', 'INCOMING', 'CARD', 24829.78, 'GHS', '2026-05-15 00:00:00', 'INV-2026-00005/REM', 'Card payment taken over the phone.', 'cmu4u5f120060jx7du0ttfoyd', NULL, 'cmu4u5f6r0091jx7d6w0f9ddd', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.357', '2026-09-17 01:13:06.357', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f7y009mjx7dqvxvk6c9', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00006', 'INCOMING', 'CHECK', 8505.64, 'GHS', '2026-05-19 00:00:00', 'INV-2026-00006/REM', 'Part payment on account ahead of the second delivery.', 'cmu4u5f140061jx7dwarganau', NULL, 'cmu4u5f7l009fjx7dno49sdyc', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.382', '2026-09-17 01:13:06.382', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f8m009wjx7d68m0aen7', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00007', 'INCOMING', 'CHECK', 5188.70, 'GHS', '2026-06-17 00:00:00', 'INV-2026-00007/REM', 'Card payment taken over the phone.', 'cmu4u5f190062jx7dig0iyu9c', NULL, 'cmu4u5f88009pjx7dwy937no0', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.406', '2026-09-17 01:13:06.406', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f9900a8jx7dsqp54f63', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00008', 'INCOMING', 'BANK_TRANSFER', 3492.94, 'GHS', '2026-06-15 00:00:00', 'INV-2026-00008/REM', 'Card payment taken over the phone.', 'cmu4u5f1a0063jx7dp40puznl', NULL, 'cmu4u5f8v009zjx7doea9r8ua', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.429', '2026-09-17 01:13:06.429', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f9x00akjx7dy0krawt6', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00009', 'INCOMING', 'BANK_TRANSFER', 12499.91, 'GHS', '2026-06-09 00:00:00', 'INV-2026-00009/REM', 'Card payment taken over the phone.', 'cmu4u5f1c0064jx7drs17fqe5', NULL, 'cmu4u5f9j00abjx7d8gpkt9r6', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.453', '2026-09-17 01:13:06.453', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fal00awjx7ds4416t6m', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00010', 'INCOMING', 'CARD', 19218.65, 'GHS', '2026-07-11 00:00:00', 'INV-2026-00010/REM', 'Cleared after statement chase.', 'cmu4u5f1e0065jx7d2gkycotj', NULL, 'cmu4u5fa600anjx7dpho68io8', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.477', '2026-09-17 01:13:06.477', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fbc00bajx7ddbdslsv5', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00011', 'INCOMING', 'BANK_TRANSFER', 4049.21, 'GHS', '2026-07-13 00:00:00', 'INV-2026-00011/REM', 'Card payment taken over the phone.', 'cmu4u5f0q005wjx7d21lo13mf', NULL, 'cmu4u5fav00azjx7de5yji16e', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.504', '2026-09-17 01:13:06.504', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fc000bojx7dumzpg5s9', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00012', 'INCOMING', 'BANK_TRANSFER', 26660.48, 'GHS', '2026-07-13 00:00:00', 'INV-2026-00012/REM', 'Settled in full within terms.', 'cmu4u5f0s005xjx7d4qi4ji6y', NULL, 'cmu4u5fbl00bdjx7df15zpnmf', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.528', '2026-09-17 01:13:06.528', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fci00byjx7dps1oojvb', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00013', 'INCOMING', 'BANK_TRANSFER', 11531.07, 'GHS', '2026-07-09 00:00:00', 'INV-2026-00013/REM', 'Card payment taken over the phone.', 'cmu4u5f0u005yjx7d0wha4vi3', NULL, 'cmu4u5fc800brjx7dq1dkp4hp', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.546', '2026-09-17 01:13:06.546', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fd000c8jx7dgyev0f8l', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00014', 'INCOMING', 'CHECK', 22359.70, 'GHS', '2026-07-18 00:00:00', 'INV-2026-00014/REM', 'Settled in full within terms.', 'cmu4u5f0w005zjx7ddaqejxe8', NULL, 'cmu4u5fcq00c1jx7dyzukvvig', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.564', '2026-09-17 01:13:06.564', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fdm00ckjx7db3jo3ce8', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00015', 'INCOMING', 'BANK_TRANSFER', 13525.60, 'GHS', '2026-07-26 00:00:00', 'INV-2026-00015/REM', 'Cleared after statement chase.', 'cmu4u5f120060jx7du0ttfoyd', NULL, 'cmu4u5fd800cbjx7dlwg0dqfr', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.586', '2026-09-17 01:13:06.586', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fe800cwjx7dsheytd2a', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00016', 'INCOMING', 'CARD', 11889.90, 'GHS', '2026-08-22 00:00:00', 'INV-2026-00016/REM', 'Bank transfer received, reference matched automatically.', 'cmu4u5f140061jx7dwarganau', NULL, 'cmu4u5fdu00cnjx7dn3g1h9ei', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.608', '2026-09-17 01:13:06.608', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5feu00d6jx7dokk1safe', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00017', 'INCOMING', 'CHECK', 11336.93, 'GHS', '2026-08-12 00:00:00', 'INV-2026-00017/REM', 'Cleared after statement chase.', 'cmu4u5f190062jx7dig0iyu9c', NULL, 'cmu4u5feh00czjx7df5gb3qfu', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.63', '2026-09-17 01:13:06.63', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fff00dijx7d3yo1fgbf', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00018', 'INCOMING', 'CHECK', 49250.41, 'GHS', '2026-08-17 00:00:00', 'INV-2026-00018/REM', 'Bank transfer received, reference matched automatically.', 'cmu4u5f1a0063jx7dp40puznl', NULL, 'cmu4u5ff300d9jx7dhdva9d0t', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.651', '2026-09-17 01:13:06.651', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ffu00dqjx7dyzmrn7bk', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00019', 'INCOMING', 'BANK_TRANSFER', 3125.10, 'GHS', '2026-09-01 00:00:00', 'INV-2026-00019/REM', 'Cleared after statement chase.', 'cmu4u5f1c0064jx7drs17fqe5', NULL, 'cmu4u5ffn00dljx7ddo4glrf0', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.666', '2026-09-17 01:13:06.666', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fgx00edjx7dj7npaogh', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00020', 'INCOMING', 'CARD', 3565.10, 'GHS', '2026-09-18 00:00:00', 'INV-2026-00022/REM', 'Part payment on account ahead of the second delivery.', 'cmu4u5f0s005xjx7d4qi4ji6y', NULL, 'cmu4u5fgn00e6jx7dzty15xb8', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.705', '2026-09-17 01:13:06.705', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fi100f1jx7dkjnpauy9', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00021', 'INCOMING', 'BANK_TRANSFER', 5913.31, 'GHS', '2026-09-21 00:00:00', 'INV-2026-00025/REM', 'Cleared after statement chase.', 'cmu4u5f120060jx7du0ttfoyd', NULL, 'cmu4u5fhr00eujx7dc14cj576', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.745', '2026-09-17 01:13:06.745', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fik00fbjx7djy37r55l', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00022', 'INCOMING', 'BANK_TRANSFER', 1370.60, 'GHS', '2026-09-24 00:00:00', 'INV-2026-00026/REM', 'Settled in full within terms.', 'cmu4u5f140061jx7dwarganau', NULL, 'cmu4u5fib00f4jx7d0vw8tugu', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.764', '2026-09-17 01:13:06.764', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fj400fljx7dnh7rls1z', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00023', 'INCOMING', 'BANK_TRANSFER', 10669.40, 'GHS', '2026-09-15 00:00:00', 'INV-2026-00027/REM', 'Cleared after statement chase.', 'cmu4u5f190062jx7dig0iyu9c', NULL, 'cmu4u5fis00fejx7dl1n9m0ng', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.784', '2026-09-17 01:13:06.784', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fjy00g4jx7dse86z75l', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00024', 'INCOMING', 'CARD', 9989.20, 'GHS', '2026-09-22 00:00:00', 'INV-2026-00029/REM', 'Settled in full within terms.', 'cmu4u5f1c0064jx7drs17fqe5', NULL, 'cmu4u5fjm00fvjx7ds393itg9', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.814', '2026-09-17 01:13:06.814', NULL);
INSERT INTO public.payments (id, "organizationId", number, direction, method, amount, currency, "paidAt", reference, notes, "customerId", "supplierId", "invoiceId", "billId", "accountId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fkd00gcjx7dvkh17tgy', 'cmu4u5eus0037jx7dx1af4of5', 'PAY-2026-00025', 'INCOMING', 'CARD', 2668.60, 'GHS', '2026-10-03 00:00:00', 'INV-2026-00030/REM', 'Settled in full within terms.', 'cmu4u5f1e0065jx7d2gkycotj', NULL, 'cmu4u5fk600g7jx7do0d0eyph', NULL, 'cmu4u5ew9003ijx7dv04s9i0a', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-17 01:13:06.829', '2026-09-17 01:13:06.829', NULL);


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fs500krjx7d44cnhkeg', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1g0066jx7dz2pxsag7', 'PR-2026-00001', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 7400.00, 592.00, 0.00, 900.00, 1406.00, 296.00, 7190.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 01:13:07.109', '2026-09-17 01:13:07.109', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fsb00ktjx7dzrwjd073', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1i0067jx7dfiu3brhc', 'PR-2026-00002', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 6600.00, 528.00, 0.00, 0.00, 1254.00, 264.00, 5610.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 01:13:07.115', '2026-09-17 01:13:07.115', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fsf00kvjx7dm7afjshf', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1k0068jx7d18wg3eq5', 'PR-2026-00003', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 6100.00, 488.00, 0.00, 0.00, 1159.00, 244.00, 5185.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 01:13:07.119', '2026-09-17 01:13:07.119', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fsj00kxjx7dabmvkz36', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1m0069jx7dscghk1rq', 'PR-2026-00004', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 6850.00, 548.00, 0.00, 0.00, 1301.50, 274.00, 5822.50, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 01:13:07.123', '2026-09-17 01:13:07.123', NULL);
INSERT INTO public.payrolls (id, "organizationId", "employeeId", number, "periodStart", "periodEnd", "baseSalary", allowances, overtime, bonus, "taxDeduction", "otherDeduction", "netSalary", currency, status, "paidAt", notes, "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fsm00kzjx7d49363tkn', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5f1o006ajx7dmubkph58', 'PR-2026-00005', '2026-08-17 00:00:00', '2026-09-16 00:00:00', 5400.00, 432.00, 0.00, 0.00, 1026.00, 216.00, 4590.00, 'GHS', 'PAID', '2026-09-16 00:00:00', NULL, '2026-09-17 01:13:07.126', '2026-09-17 01:13:07.126', NULL);


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0005jx7dsja27ojw', 'dashboard.view', 'dashboard', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0006jx7drh5xb45i', 'dashboard.create', 'dashboard', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0007jx7dajrrnoyp', 'dashboard.edit', 'dashboard', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0008jx7dpkg1hfyl', 'dashboard.delete', 'dashboard', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0009jx7dw797xc81', 'dashboard.export', 'dashboard', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000ajx7d5ld1jtua', 'invoices.view', 'invoices', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000bjx7dkxvg9vh5', 'invoices.create', 'invoices', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000cjx7dga1lh46s', 'invoices.edit', 'invoices', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000djx7dv7msy7ii', 'invoices.delete', 'invoices', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000ejx7daaj61pyw', 'invoices.export', 'invoices', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000fjx7dqkrevfbq', 'quotations.view', 'quotations', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000gjx7dvh3hfphc', 'quotations.create', 'quotations', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000hjx7dz77n7d13', 'quotations.edit', 'quotations', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000ijx7dgzgrxl5l', 'quotations.delete', 'quotations', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000jjx7dgsemh5oy', 'quotations.export', 'quotations', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000kjx7dn98upxtw', 'customers.view', 'customers', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000ljx7dgp14scbo', 'customers.create', 'customers', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000mjx7dra6tu0ko', 'customers.edit', 'customers', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000njx7dlhmrcnf5', 'customers.delete', 'customers', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000ojx7dfqwd7n2f', 'customers.export', 'customers', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000pjx7dhye174bi', 'payments.view', 'payments', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000qjx7didqwtb62', 'payments.create', 'payments', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000rjx7d2l3rpuyr', 'payments.edit', 'payments', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000sjx7d4acjkvab', 'payments.delete', 'payments', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000tjx7dgsp7r58i', 'payments.export', 'payments', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000ujx7dc6aypr9k', 'purchases.view', 'purchases', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000vjx7dqqhsj4fz', 'purchases.create', 'purchases', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000wjx7dhoihdq95', 'purchases.edit', 'purchases', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000xjx7dn8zfyggy', 'purchases.delete', 'purchases', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000yjx7d74qwo9nt', 'purchases.export', 'purchases', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue000zjx7dw6jv8m19', 'suppliers.view', 'suppliers', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0010jx7djhc5u64k', 'suppliers.create', 'suppliers', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0011jx7d4ztgcfav', 'suppliers.edit', 'suppliers', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0012jx7dgdau1mqq', 'suppliers.delete', 'suppliers', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0013jx7d6anmykfc', 'suppliers.export', 'suppliers', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0014jx7dbzci8jzn', 'bills.view', 'bills', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0015jx7dt9srn5zv', 'bills.create', 'bills', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0016jx7dc42zzdok', 'bills.edit', 'bills', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0017jx7dinoh7wzl', 'bills.delete', 'bills', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0018jx7dbp3vifem', 'bills.export', 'bills', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0019jx7doukwujur', 'products.view', 'products', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001ajx7d64nq3s8x', 'products.create', 'products', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001bjx7dm3zts8hb', 'products.edit', 'products', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001cjx7dl7vwcesh', 'products.delete', 'products', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001djx7d6xhtuqb9', 'products.export', 'products', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001ejx7dcxsy4tul', 'inventory.view', 'inventory', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001fjx7dzvbzuf3v', 'inventory.create', 'inventory', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001gjx7dckr4udde', 'inventory.edit', 'inventory', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001hjx7d8q8kfvit', 'inventory.delete', 'inventory', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001ijx7d1o4t22t6', 'inventory.export', 'inventory', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001jjx7dqc0gngie', 'expenses.view', 'expenses', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001kjx7dg3da6ek9', 'expenses.create', 'expenses', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001ljx7dnn7j131l', 'expenses.edit', 'expenses', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001mjx7dgg8b7d0p', 'expenses.delete', 'expenses', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001njx7d0r7s6d1v', 'expenses.export', 'expenses', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001ojx7d2eash827', 'accounts.view', 'accounts', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001pjx7djo8tejej', 'accounts.create', 'accounts', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001qjx7dh224j4xz', 'accounts.edit', 'accounts', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001rjx7d8uyen30g', 'accounts.delete', 'accounts', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001sjx7dl6kx90hx', 'accounts.export', 'accounts', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001tjx7dt5pflnut', 'transactions.view', 'transactions', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001ujx7d87ewoa6c', 'transactions.create', 'transactions', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001vjx7dtkybipsa', 'transactions.edit', 'transactions', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001wjx7db4xe44lf', 'transactions.delete', 'transactions', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001xjx7drqsy6835', 'transactions.export', 'transactions', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001yjx7doq6q22i3', 'employees.view', 'employees', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue001zjx7duffldlo5', 'employees.create', 'employees', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0020jx7d070kioqw', 'employees.edit', 'employees', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0021jx7dm0pbjtml', 'employees.delete', 'employees', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0022jx7ds789lm5o', 'employees.export', 'employees', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0023jx7d9g3b1rgd', 'payroll.view', 'payroll', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0024jx7dkpv169kk', 'payroll.create', 'payroll', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0025jx7d2dlplinz', 'payroll.edit', 'payroll', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0026jx7d5v8uzujv', 'payroll.delete', 'payroll', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0027jx7d0bkutnvm', 'payroll.export', 'payroll', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0028jx7dev1uxupn', 'attendance.view', 'attendance', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue0029jx7devhd23jw', 'attendance.create', 'attendance', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002ajx7dfxpzlztx', 'attendance.edit', 'attendance', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002bjx7dmsf9lnia', 'attendance.delete', 'attendance', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002cjx7duyob25b8', 'attendance.export', 'attendance', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002djx7dkrxvo6zw', 'projects.view', 'projects', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002ejx7d0abev7fc', 'projects.create', 'projects', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002fjx7dw692fm6c', 'projects.edit', 'projects', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002gjx7dpn3jhckt', 'projects.delete', 'projects', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002hjx7dczvysavw', 'projects.export', 'projects', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5eue002ijx7dgxasn69u', 'tasks.view', 'tasks', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002jjx7dwj6p2eq1', 'tasks.create', 'tasks', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002kjx7dqrg4fwn3', 'tasks.edit', 'tasks', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002ljx7dm8y19j8d', 'tasks.delete', 'tasks', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002mjx7dypagm1m4', 'tasks.export', 'tasks', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002njx7d9iugzksv', 'timesheets.view', 'timesheets', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002ojx7dgzafs0zi', 'timesheets.create', 'timesheets', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002pjx7d6b6tdyxt', 'timesheets.edit', 'timesheets', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002qjx7dlgnj6fux', 'timesheets.delete', 'timesheets', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002rjx7de6muvod4', 'timesheets.export', 'timesheets', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002sjx7dsl6io0ki', 'reports.view', 'reports', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002tjx7dw4krx1mn', 'reports.create', 'reports', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002ujx7dufycnbnz', 'reports.edit', 'reports', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002vjx7dmjzkzwdk', 'reports.delete', 'reports', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002wjx7ds62ofpvr', 'reports.export', 'reports', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002xjx7dlvy7gdx8', 'settings.view', 'settings', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002yjx7dcpofjn60', 'settings.create', 'settings', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf002zjx7dmr38rrrz', 'settings.edit', 'settings', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0030jx7dh1fqya87', 'settings.delete', 'settings', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0031jx7dhdn7ogn5', 'settings.export', 'settings', 'export', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0032jx7d24ievagn', 'users.view', 'users', 'view', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0033jx7djc454051', 'users.create', 'users', 'create', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0034jx7dxlz7u73a', 'users.edit', 'users', 'edit', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0035jx7dtfyom4ti', 'users.delete', 'users', 'delete', NULL);
INSERT INTO public.permissions (id, key, module, action, description) VALUES ('cmu4u5euf0036jx7db1ov4m4o', 'users.export', 'users', 'export', NULL);


--
-- Data for Name: platform_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fqs00jrjx7ddc839ax9', 'cmu4u5fqr00jqjx7d8sybgwoa', 'cmu4u5f1g0066jx7dz2pxsag7', 'Project lead', 95.00, '2026-09-17 01:13:07.059');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fqs00jsjx7dqnj02eu9', 'cmu4u5fqr00jqjx7d8sybgwoa', 'cmu4u5f1i0067jx7dfiu3brhc', 'Contributor', 72.00, '2026-09-17 01:13:07.059');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fqs00jtjx7d3fn3keug', 'cmu4u5fqr00jqjx7d8sybgwoa', 'cmu4u5f1k0068jx7d18wg3eq5', 'Contributor', 72.00, '2026-09-17 01:13:07.059');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fqw00jvjx7d466oiohd', 'cmu4u5fqw00jujx7df7rd0ud6', 'cmu4u5f1g0066jx7dz2pxsag7', 'Project lead', 95.00, '2026-09-17 01:13:07.064');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fqw00jwjx7de1f156xt', 'cmu4u5fqw00jujx7df7rd0ud6', 'cmu4u5f1i0067jx7dfiu3brhc', 'Contributor', 72.00, '2026-09-17 01:13:07.064');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fqw00jxjx7dij6d1bot', 'cmu4u5fqw00jujx7df7rd0ud6', 'cmu4u5f1k0068jx7d18wg3eq5', 'Contributor', 72.00, '2026-09-17 01:13:07.064');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fr000jzjx7du7zdyvf2', 'cmu4u5fqz00jyjx7d3gc4l8u6', 'cmu4u5f1g0066jx7dz2pxsag7', 'Project lead', 95.00, '2026-09-17 01:13:07.067');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fr000k0jx7de97np3gh', 'cmu4u5fqz00jyjx7d3gc4l8u6', 'cmu4u5f1i0067jx7dfiu3brhc', 'Contributor', 72.00, '2026-09-17 01:13:07.067');
INSERT INTO public.project_members (id, "projectId", "employeeId", role, "hourlyRate", "joinedAt") VALUES ('cmu4u5fr000k1jx7ddrxvgwce', 'cmu4u5fqz00jyjx7d3gc4l8u6', 'cmu4u5f1k0068jx7d18wg3eq5', 'Contributor', 72.00, '2026-09-17 01:13:07.067');


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f23006djx7dopx4b2z7', 'cmu4u5f22006cjx7dqedeeuh2', 'cmu4u5f03005kjx7dgr8244kw', 'Acoustic Ceiling Baffle', 'Suspended vertical baffle, 1200×300mm.', 3.000, 'unit', 108.00, 0.000, 10.000, 324.00, 0.00, 32.40, 356.40, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f23006ejx7den3v68qk', 'cmu4u5f22006cjx7dqedeeuh2', 'cmu4u5ezh005ajx7dbhusx0b4', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 14.000, 'unit', 165.00, 0.000, 10.000, 2310.00, 0.00, 231.00, 2541.00, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f23006fjx7dy64t6xi1', 'cmu4u5f22006cjx7dqedeeuh2', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 13.000, 'unit', 79.00, 5.000, 10.000, 1027.00, 51.35, 97.57, 1073.22, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f23006gjx7d5mjnc1we', 'cmu4u5f22006cjx7dqedeeuh2', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 8.000, 'unit', 45.00, 0.000, 10.000, 360.00, 0.00, 36.00, 396.00, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f23006hjx7dhlci9lud', 'cmu4u5f22006cjx7dqedeeuh2', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 7.000, 'hour', 125.00, 0.000, 10.000, 875.00, 0.00, 87.50, 962.50, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2b006kjx7dwj94njch', 'cmu4u5f2a006jjx7d0ypvuic9', 'cmu4u5ezh005ajx7dbhusx0b4', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 13.000, 'unit', 165.00, 0.000, 10.000, 2145.00, 0.00, 214.50, 2359.50, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2b006ljx7dx6l2bym9', 'cmu4u5f2a006jjx7d0ypvuic9', 'cmu4u5eyz0050jx7degrc5roz', 'Corner Workstation 1800', 'Fixed-height corner desk with modesty panel.', 6.000, 'unit', 445.00, 5.000, 10.000, 2670.00, 133.50, 253.65, 2790.15, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2b006mjx7daozl6n9s', 'cmu4u5f2a006jjx7d0ypvuic9', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 9.000, 'unit', 79.00, 5.000, 10.000, 711.00, 35.55, 67.55, 743.00, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2b006njx7dqdc5rm1o', 'cmu4u5f2a006jjx7d0ypvuic9', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 8.000, 'hour', 88.00, 0.000, 10.000, 704.00, 0.00, 70.40, 774.40, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2i006qjx7dtpusnfo7', 'cmu4u5f2h006pjx7d3olygi8n', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 11.000, 'unit', 45.00, 0.000, 10.000, 495.00, 0.00, 49.50, 544.50, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2i006rjx7dlbtn9511', 'cmu4u5f2h006pjx7d3olygi8n', 'cmu4u5f00005ijx7dy98677aa', 'Acoustic Wall Panel 600×600', 'Class A absorber panel, 40mm, concealed fixings.', 12.000, 'unit', 84.00, 0.000, 10.000, 1008.00, 0.00, 100.80, 1108.80, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2i006sjx7d4f0qa1x1', 'cmu4u5f2h006pjx7d3olygi8n', 'cmu4u5ezh005ajx7dbhusx0b4', 'Mobile Pedestal 3-Drawer', 'Lockable steel pedestal on castors.', 7.000, 'unit', 165.00, 0.000, 10.000, 1155.00, 0.00, 115.50, 1270.50, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2i006tjx7dnrrm3u87', 'cmu4u5f2h006pjx7d3olygi8n', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 14.000, 'hour', 88.00, 0.000, 10.000, 1232.00, 0.00, 123.20, 1355.20, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2p006wjx7d7xbu7f3w', 'cmu4u5f2o006vjx7dlc9m7a13', 'cmu4u5eyv004yjx7db6weovxj', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 8.000, 'unit', 1685.00, 0.000, 10.000, 13480.00, 0.00, 1348.00, 14828.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2p006xjx7dwuylddtd', 'cmu4u5f2o006vjx7dlc9m7a13', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 5.000, 'unit', 399.00, 5.000, 10.000, 1995.00, 99.75, 189.53, 2084.78, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2p006yjx7ds6epvxxm', 'cmu4u5f2o006vjx7dlc9m7a13', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 14.000, 'hour', 125.00, 0.000, 10.000, 1750.00, 0.00, 175.00, 1925.00, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2w0071jx7deuoemvo0', 'cmu4u5f2w0070jx7dxds5vyqw', 'cmu4u5f0i005sjx7d6aaht1g7', 'Under-Desk Cable Tray 1200', 'Perforated steel cable tray with fixings.', 9.000, 'unit', 34.00, 0.000, 10.000, 306.00, 0.00, 30.60, 336.60, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2w0072jx7darawwjgf', 'cmu4u5f2w0070jx7dxds5vyqw', 'cmu4u5eyr004wjx7d1ch2rblo', 'Meridian Sit-Stand Desk 1400', 'Electric height-adjustable desk, 1400×800mm, oak veneer top.', 12.000, 'unit', 689.00, 0.000, 10.000, 8268.00, 0.00, 826.80, 9094.80, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2w0073jx7dn7n4g063', 'cmu4u5f2w0070jx7dxds5vyqw', 'cmu4u5ez30052jx7dq9wpr7ak', 'Vertex Ergo Task Chair', 'Mesh-back task chair, 4D arms, 10-year frame warranty.', 4.000, 'unit', 399.00, 5.000, 10.000, 1596.00, 79.80, 151.62, 1667.82, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2w0074jx7dykba3yc4', 'cmu4u5f2w0070jx7dxds5vyqw', 'cmu4u5ez70054jx7doev7e1va', 'Vertex Ergo Task Chair (Headrest)', 'Ergo task chair with adjustable headrest.', 14.000, 'unit', 459.00, 5.000, 10.000, 6426.00, 321.30, 610.47, 6715.17, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f2w0075jx7dqnciycj2', 'cmu4u5f2w0070jx7dxds5vyqw', 'cmu4u5f0m005ujx7dtql2g740', 'Space Planning & Design', 'CAD space planning, furniture specification and 3D visuals.', 12.000, 'hour', 125.00, 0.000, 10.000, 1500.00, 0.00, 150.00, 1650.00, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f330078jx7dwdq397mg', 'cmu4u5f320077jx7dbtl2iuw0', 'cmu4u5eze0058jx7dphqgj7bn', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 8.000, 'unit', 1150.00, 0.000, 10.000, 9200.00, 0.00, 920.00, 10120.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f330079jx7dtgxwzf5y', 'cmu4u5f320077jx7dbtl2iuw0', 'cmu4u5eyv004yjx7db6weovxj', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 10.000, 'unit', 1685.00, 0.000, 10.000, 16850.00, 0.00, 1685.00, 18535.00, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f33007ajx7dj964cdt3', 'cmu4u5f320077jx7dbtl2iuw0', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 9.000, 'hour', 88.00, 0.000, 10.000, 792.00, 0.00, 79.20, 871.20, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3a007djx7d1yrcpjo1', 'cmu4u5f39007cjx7df8nffbet', 'cmu4u5f07005mjx7d4akrl95w', 'Phone Booth Single', 'Single-occupancy acoustic pod with ventilation and lighting.', 5.000, 'unit', 5290.00, 0.000, 10.000, 26450.00, 0.00, 2645.00, 29095.00, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3a007ejx7dzkghfjg6', 'cmu4u5f39007cjx7df8nffbet', 'cmu4u5f0a005ojx7dtfjj8acq', 'Desktop Power Module 2×Socket', 'Clamp-on module with two sockets and two USB-C.', 4.000, 'unit', 79.00, 0.000, 10.000, 316.00, 0.00, 31.60, 347.60, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3a007fjx7da9ie5fjr', 'cmu4u5f39007cjx7df8nffbet', 'cmu4u5f0e005qjx7d62frlrph', 'Vertical Cable Spine', 'Flexible spine routing cables from desk to floor box.', 12.000, 'unit', 45.00, 5.000, 10.000, 540.00, 27.00, 51.30, 564.30, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3a007gjx7dyu1zw2r5', 'cmu4u5f39007cjx7df8nffbet', 'cmu4u5eze0058jx7dphqgj7bn', 'Alcove Soft Seating Two-Seat', 'High-back two-seat booth in wool-blend upholstery.', 7.000, 'unit', 1150.00, 0.000, 10.000, 8050.00, 0.00, 805.00, 8855.00, 3);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3a007hjx7dack6zxxs', 'cmu4u5f39007cjx7df8nffbet', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 6.000, 'hour', 88.00, 0.000, 10.000, 528.00, 0.00, 52.80, 580.80, 4);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3k007kjx7dpbsnb16g', 'cmu4u5f3j007jjx7dd3hrtvu2', 'cmu4u5eym004ujx7dqir6zgiq', 'Meridian Sit-Stand Desk 1600', 'Electric height-adjustable desk, 1600×800mm, oak veneer top.', 13.000, 'unit', 749.00, 0.000, 10.000, 9737.00, 0.00, 973.70, 10710.70, 0);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3k007ljx7df842hcs4', 'cmu4u5f3j007jjx7dd3hrtvu2', 'cmu4u5ezw005gjx7dvaemkhdj', 'Acoustic Desk Screen 1400', 'PET felt desk-mounted screen, 1400×400mm.', 5.000, 'unit', 119.00, 0.000, 10.000, 595.00, 0.00, 59.50, 654.50, 1);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3k007mjx7dl5m3vy02', 'cmu4u5f3j007jjx7dd3hrtvu2', 'cmu4u5eyv004yjx7db6weovxj', 'Halden Bench Desk 4-Person', 'Four-person back-to-back bench with shared cable tray.', 9.000, 'unit', 1685.00, 0.000, 10.000, 15165.00, 0.00, 1516.50, 16681.50, 2);
INSERT INTO public.quotation_items (id, "quotationId", "productId", name, description, quantity, unit, "unitPrice", "discountRate", "taxRate", "lineSubtotal", "lineDiscount", "lineTax", "lineTotal", "sortOrder") VALUES ('cmu4u5f3k007njx7d825qmh78', 'cmu4u5f3j007jjx7dd3hrtvu2', 'cmu4u5f0n005vjx7dzyfsm0x7', 'Delivery & Installation', 'Two-person install team, build, placement and waste removal.', 11.000, 'hour', 88.00, 0.000, 10.000, 968.00, 0.00, 96.80, 1064.80, 3);


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0006jx7drh5xb45i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0007jx7dajrrnoyp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0008jx7dpkg1hfyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000vjx7dqqhsj4fz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000wjx7dhoihdq95');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000xjx7dn8zfyggy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000yjx7d74qwo9nt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0010jx7djhc5u64k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0011jx7d4ztgcfav');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0012jx7dgdau1mqq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001ajx7d64nq3s8x');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001bjx7dm3zts8hb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001cjx7dl7vwcesh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001djx7d6xhtuqb9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001fjx7dzvbzuf3v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001gjx7dckr4udde');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001hjx7d8q8kfvit');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001ijx7d1o4t22t6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001kjx7dg3da6ek9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001ljx7dnn7j131l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001mjx7dgg8b7d0p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001pjx7djo8tejej');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001qjx7dh224j4xz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001rjx7d8uyen30g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001ujx7d87ewoa6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001vjx7dtkybipsa');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001wjx7db4xe44lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001xjx7drqsy6835');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue001zjx7duffldlo5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0020jx7d070kioqw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0021jx7dm0pbjtml');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0023jx7d9g3b1rgd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0024jx7dkpv169kk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0025jx7d2dlplinz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0026jx7d5v8uzujv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0027jx7d0bkutnvm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue0029jx7devhd23jw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002ajx7dfxpzlztx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002bjx7dmsf9lnia');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002cjx7duyob25b8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002ejx7d0abev7fc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002fjx7dw692fm6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002gjx7dpn3jhckt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002hjx7dczvysavw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002tjx7dw4krx1mn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002ujx7dufycnbnz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002vjx7dmjzkzwdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002xjx7dlvy7gdx8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002yjx7dcpofjn60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf002zjx7dmr38rrrz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0030jx7dh1fqya87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0031jx7dhdn7ogn5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0032jx7d24ievagn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0033jx7djc454051');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0034jx7dxlz7u73a');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0035jx7dtfyom4ti');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5euy0039jx7dmywf5too', 'cmu4u5euf0036jx7db1ov4m4o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0006jx7drh5xb45i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0007jx7dajrrnoyp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0008jx7dpkg1hfyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000vjx7dqqhsj4fz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000wjx7dhoihdq95');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000xjx7dn8zfyggy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000yjx7d74qwo9nt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0010jx7djhc5u64k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0011jx7d4ztgcfav');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0012jx7dgdau1mqq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001ajx7d64nq3s8x');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001bjx7dm3zts8hb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001cjx7dl7vwcesh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001djx7d6xhtuqb9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001fjx7dzvbzuf3v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001gjx7dckr4udde');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001hjx7d8q8kfvit');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001ijx7d1o4t22t6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001kjx7dg3da6ek9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001ljx7dnn7j131l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001mjx7dgg8b7d0p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001pjx7djo8tejej');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001qjx7dh224j4xz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001rjx7d8uyen30g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001ujx7d87ewoa6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001vjx7dtkybipsa');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001wjx7db4xe44lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001xjx7drqsy6835');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue001zjx7duffldlo5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0020jx7d070kioqw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0021jx7dm0pbjtml');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0023jx7d9g3b1rgd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0024jx7dkpv169kk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0025jx7d2dlplinz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0026jx7d5v8uzujv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0027jx7d0bkutnvm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue0029jx7devhd23jw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002ajx7dfxpzlztx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002bjx7dmsf9lnia');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002cjx7duyob25b8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002ejx7d0abev7fc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002fjx7dw692fm6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002gjx7dpn3jhckt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002hjx7dczvysavw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002tjx7dw4krx1mn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002ujx7dufycnbnz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002vjx7dmjzkzwdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002xjx7dlvy7gdx8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002yjx7dcpofjn60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf002zjx7dmr38rrrz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0030jx7dh1fqya87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0031jx7dhdn7ogn5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0032jx7d24ievagn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0033jx7djc454051');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0034jx7dxlz7u73a');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0035jx7dtfyom4ti');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ev8003ajx7ded19droj', 'cmu4u5euf0036jx7db1ov4m4o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000vjx7dqqhsj4fz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000wjx7dhoihdq95');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000xjx7dn8zfyggy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000yjx7d74qwo9nt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0010jx7djhc5u64k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0011jx7d4ztgcfav');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0012jx7dgdau1mqq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001ajx7d64nq3s8x');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001bjx7dm3zts8hb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001cjx7dl7vwcesh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001djx7d6xhtuqb9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001fjx7dzvbzuf3v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001gjx7dckr4udde');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001hjx7d8q8kfvit');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001ijx7d1o4t22t6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue002ejx7d0abev7fc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue002fjx7dw692fm6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue002gjx7dpn3jhckt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue002hjx7dczvysavw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evh003bjx7dntjuil21', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001kjx7dg3da6ek9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001ljx7dnn7j131l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001mjx7dgg8b7d0p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001pjx7djo8tejej');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001qjx7dh224j4xz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001rjx7d8uyen30g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001ujx7d87ewoa6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001vjx7dtkybipsa');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001wjx7db4xe44lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001xjx7drqsy6835');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0023jx7d9g3b1rgd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0024jx7dkpv169kk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0025jx7d2dlplinz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0026jx7d5v8uzujv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0027jx7d0bkutnvm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evo003cjx7d1n2jns59', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5evs003djx7d1zvlaidk', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ew0003ejx7dsc68lw8l', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0006jx7drh5xb45i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0007jx7dajrrnoyp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0008jx7dpkg1hfyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000vjx7dqqhsj4fz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000wjx7dhoihdq95');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000xjx7dn8zfyggy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000yjx7d74qwo9nt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0010jx7djhc5u64k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0011jx7d4ztgcfav');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0012jx7dgdau1mqq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001ajx7d64nq3s8x');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001bjx7dm3zts8hb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001cjx7dl7vwcesh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001djx7d6xhtuqb9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001fjx7dzvbzuf3v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001gjx7dckr4udde');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001hjx7d8q8kfvit');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001ijx7d1o4t22t6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001kjx7dg3da6ek9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001ljx7dnn7j131l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001mjx7dgg8b7d0p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001pjx7djo8tejej');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001qjx7dh224j4xz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001rjx7d8uyen30g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001ujx7d87ewoa6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001vjx7dtkybipsa');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001wjx7db4xe44lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001xjx7drqsy6835');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue001zjx7duffldlo5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0020jx7d070kioqw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0021jx7dm0pbjtml');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0023jx7d9g3b1rgd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0024jx7dkpv169kk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0025jx7d2dlplinz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0026jx7d5v8uzujv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0027jx7d0bkutnvm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue0029jx7devhd23jw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002ajx7dfxpzlztx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002bjx7dmsf9lnia');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002cjx7duyob25b8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002ejx7d0abev7fc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002fjx7dw692fm6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002gjx7dpn3jhckt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002hjx7dczvysavw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002tjx7dw4krx1mn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002ujx7dufycnbnz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002vjx7dmjzkzwdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002xjx7dlvy7gdx8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002yjx7dcpofjn60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf002zjx7dmr38rrrz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0030jx7dh1fqya87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0031jx7dhdn7ogn5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0032jx7d24ievagn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0033jx7djc454051');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0034jx7dxlz7u73a');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0035jx7dtfyom4ti');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5eww003zjx7dm4kujig5', 'cmu4u5euf0036jx7db1ov4m4o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0006jx7drh5xb45i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0007jx7dajrrnoyp');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0008jx7dpkg1hfyl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000vjx7dqqhsj4fz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000wjx7dhoihdq95');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000xjx7dn8zfyggy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000yjx7d74qwo9nt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0010jx7djhc5u64k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0011jx7d4ztgcfav');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0012jx7dgdau1mqq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001ajx7d64nq3s8x');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001bjx7dm3zts8hb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001cjx7dl7vwcesh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001djx7d6xhtuqb9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001fjx7dzvbzuf3v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001gjx7dckr4udde');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001hjx7d8q8kfvit');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001ijx7d1o4t22t6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001kjx7dg3da6ek9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001ljx7dnn7j131l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001mjx7dgg8b7d0p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001pjx7djo8tejej');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001qjx7dh224j4xz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001rjx7d8uyen30g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001ujx7d87ewoa6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001vjx7dtkybipsa');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001wjx7db4xe44lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001xjx7drqsy6835');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue001zjx7duffldlo5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0020jx7d070kioqw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0021jx7dm0pbjtml');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0023jx7d9g3b1rgd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0024jx7dkpv169kk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0025jx7d2dlplinz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0026jx7d5v8uzujv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0027jx7d0bkutnvm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue0029jx7devhd23jw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002ajx7dfxpzlztx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002bjx7dmsf9lnia');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002cjx7duyob25b8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002ejx7d0abev7fc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002fjx7dw692fm6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002gjx7dpn3jhckt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002hjx7dczvysavw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002tjx7dw4krx1mn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002ujx7dufycnbnz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002vjx7dmjzkzwdk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002xjx7dlvy7gdx8');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002yjx7dcpofjn60');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf002zjx7dmr38rrrz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0030jx7dh1fqya87');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0031jx7dhdn7ogn5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0032jx7d24ievagn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0033jx7djc454051');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0034jx7dxlz7u73a');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0035jx7dtfyom4ti');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ex40040jx7docdaawcp', 'cmu4u5euf0036jx7db1ov4m4o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000vjx7dqqhsj4fz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000wjx7dhoihdq95');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000xjx7dn8zfyggy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000yjx7d74qwo9nt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0010jx7djhc5u64k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0011jx7d4ztgcfav');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0012jx7dgdau1mqq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001ajx7d64nq3s8x');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001bjx7dm3zts8hb');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001cjx7dl7vwcesh');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001djx7d6xhtuqb9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001fjx7dzvbzuf3v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001gjx7dckr4udde');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001hjx7d8q8kfvit');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001ijx7d1o4t22t6');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue002ejx7d0abev7fc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue002fjx7dw692fm6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue002gjx7dpn3jhckt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue002hjx7dczvysavw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exc0041jx7d1qdo2nz5', 'cmu4u5eue0028jx7dev1uxupn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001jjx7dqc0gngie');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001kjx7dg3da6ek9');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001ljx7dnn7j131l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001mjx7dgg8b7d0p');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001njx7d0r7s6d1v');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000rjx7d2l3rpuyr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000sjx7d4acjkvab');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000tjx7dgsp7r58i');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001ojx7d2eash827');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001pjx7djo8tejej');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001qjx7dh224j4xz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001rjx7d8uyen30g');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001sjx7dl6kx90hx');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001tjx7dt5pflnut');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001ujx7d87ewoa6c');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001vjx7dtkybipsa');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001wjx7db4xe44lf');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001xjx7drqsy6835');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0014jx7dbzci8jzn');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0015jx7dt9srn5zv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0016jx7dc42zzdok');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0017jx7dinoh7wzl');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0018jx7dbp3vifem');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0023jx7d9g3b1rgd');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0024jx7dkpv169kk');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0025jx7d2dlplinz');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0026jx7d5v8uzujv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0027jx7d0bkutnvm');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000zjx7dw6jv8m19');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0013jx7d6anmykfc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001yjx7doq6q22i3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0022jx7ds789lm5o');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue000ujx7dc6aypr9k');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exl0042jx7dsovsve9j', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000ljx7dgp14scbo');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000mjx7dra6tu0ko');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000njx7dlhmrcnf5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000ojx7dfqwd7n2f');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000fjx7dqkrevfbq');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000gjx7dvh3hfphc');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000hjx7dz77n7d13');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000ijx7dgzgrxl5l');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000jjx7dgsemh5oy');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000ajx7d5ld1jtua');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000bjx7dkxvg9vh5');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000cjx7dga1lh46s');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000djx7dv7msy7ii');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000ejx7daaj61pyw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000pjx7dhye174bi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue000qjx7didqwtb62');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue0009jx7dw797xc81');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5euf002sjx7dsl6io0ki');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5euf002wjx7ds62ofpvr');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue001ejx7dcxsy4tul');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5exp0043jx7dt1riingc', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5eue0005jx7dsja27ojw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5eue002djx7dkrxvo6zw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5eue000kjx7dn98upxtw');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5eue0019jx7doukwujur');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5eue002ijx7dgxasn69u');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002jjx7dwj6p2eq1');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002kjx7dqrg4fwn3');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002ljx7dm8y19j8d');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002mjx7dypagm1m4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002njx7d9iugzksv');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002ojx7dgzafs0zi');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002pjx7d6b6tdyxt');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002qjx7dlgnj6fux');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5euf002rjx7de6muvod4');
INSERT INTO public.role_permissions ("roleId", "permissionId") VALUES ('cmu4u5ext0044jx7d0j3mcder', 'cmu4u5eue0028jx7dev1uxupn');


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fr200k2jx7dji82r396', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', 'Confirm final desk layout with facilities team', NULL, 'DONE', 'HIGH', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-08 01:13:05.335', '2026-09-08 01:13:05.335', 3.00, 0, '2026-09-17 01:13:07.07', '2026-09-17 01:13:07.07', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fr400k3jx7dvpb607zd', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', 'Place order for 42 sit-stand frames', NULL, 'DONE', 'URGENT', 'cmu4u5et90001jx7dqi719aiu', '2026-09-13 01:13:05.335', '2026-09-13 01:13:05.335', 2.00, 1, '2026-09-17 01:13:07.072', '2026-09-17 01:13:07.072', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fr600k4jx7d780f0r5w', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', 'Schedule phase two install weekend', NULL, 'IN_PROGRESS', 'HIGH', 'cmu4u5et90002jx7d1m0qar2v', '2026-09-23 01:13:05.335', NULL, 4.00, 2, '2026-09-17 01:13:07.074', '2026-09-17 01:13:07.074', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fr800k5jx7d8drjgtg8', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', 'Snag list walkthrough with client', NULL, 'TODO', 'MEDIUM', 'cmu4u5et90003jx7d1ok8xhqo', '2026-10-05 01:13:05.335', NULL, 5.00, 3, '2026-09-17 01:13:07.076', '2026-09-17 01:13:07.076', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fr900k6jx7d2q65968h', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', 'Acoustic survey of the open-plan bay', NULL, 'DONE', 'MEDIUM', 'cmu4u5et90004jx7dzuzi8zue', '2026-09-05 01:13:05.335', '2026-09-05 01:13:05.335', 6.00, 4, '2026-09-17 01:13:07.077', '2026-09-17 01:13:07.077', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5frb00k7jx7dzfeny7nq', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', 'Present two-option furniture scheme', NULL, 'IN_REVIEW', 'HIGH', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-20 01:13:05.335', NULL, 9.00, 5, '2026-09-17 01:13:07.079', '2026-09-17 01:13:07.079', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5frc00k8jx7d5vvx2pfp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', 'Confirm lead time on phone booths', NULL, 'BLOCKED', 'URGENT', 'cmu4u5et90001jx7dqi719aiu', '2026-09-18 01:13:05.335', NULL, 1.50, 6, '2026-09-17 01:13:07.08', '2026-09-17 01:13:07.08', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fre00k9jx7d74w3vm5m', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', 'Issue revised quotation after value engineering', NULL, 'TODO', 'MEDIUM', 'cmu4u5et90002jx7d1m0qar2v', '2026-09-28 01:13:05.335', NULL, 3.00, 7, '2026-09-17 01:13:07.082', '2026-09-17 01:13:07.082', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5frf00kajx7dqq3kg7vl', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqz00jyjx7d3gc4l8u6', 'Final handover pack and warranties', NULL, 'DONE', 'LOW', 'cmu4u5et90003jx7d1ok8xhqo', '2026-08-02 01:13:05.335', '2026-08-02 01:13:05.335', 2.00, 8, '2026-09-17 01:13:07.083', '2026-09-17 01:13:07.083', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5frh00kbjx7dptd1cuws', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'Refresh the 2026 price list', NULL, 'IN_PROGRESS', 'MEDIUM', 'cmu4u5et90004jx7dzuzi8zue', '2026-10-01 01:13:05.335', NULL, 8.00, 9, '2026-09-17 01:13:07.085', '2026-09-17 01:13:07.085', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fri00kcjx7d4d7nc150', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'Chase overdue balances above 30 days', NULL, 'TODO', 'HIGH', 'cmu4u5et20000jx7dcz9ph7f0', '2026-09-19 01:13:05.335', NULL, 2.00, 10, '2026-09-17 01:13:07.086', '2026-09-17 01:13:07.086', NULL);
INSERT INTO public.tasks (id, "organizationId", "projectId", title, description, status, priority, "assigneeId", "dueDate", "completedAt", "estimatedHours", "sortOrder", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5frk00kdjx7d3zh48j3j', 'cmu4u5eus0037jx7dx1af4of5', NULL, 'Stock count in the acoustics aisle', NULL, 'TODO', 'LOW', 'cmu4u5et90001jx7dqi719aiu', '2026-10-08 01:13:05.335', NULL, 4.00, 11, '2026-09-17 01:13:07.088', '2026-09-17 01:13:07.088', NULL);


--
-- Data for Name: tax_rates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tax_rates (id, "organizationId", name, rate, "isDefault", "isCompound", "isActive", "createdAt", "updatedAt") VALUES ('cmu4u5ew7003hjx7d7193xejb', 'cmu4u5eus0037jx7dx1af4of5', 'VAT', 10.000, true, false, true, '2026-09-17 01:13:05.959', '2026-09-17 01:13:05.959');
INSERT INTO public.tax_rates (id, "organizationId", name, rate, "isDefault", "isCompound", "isActive", "createdAt", "updatedAt") VALUES ('cmu4u5exx0047jx7dl6v36irh', 'cmu4u5ewt003xjx7d38fw5vj4', 'VAT', 10.000, true, false, true, '2026-09-17 01:13:06.021', '2026-09-17 01:13:06.021');


--
-- Data for Name: timesheets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frl00kejx7dvk36timp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', NULL, 'cmu4u5f1i0067jx7dfiu3brhc', NULL, '2026-09-10', 7.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 01:13:07.089', '2026-09-17 01:13:07.089');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5fro00kfjx7dmk0gvwxo', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', NULL, 'cmu4u5f1k0068jx7d18wg3eq5', NULL, '2026-09-03', 9.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 01:13:07.092', '2026-09-17 01:13:07.092');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frp00kgjx7dw6q46dv2', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', NULL, 'cmu4u5f1m0069jx7dscghk1rq', NULL, '2026-08-27', 5.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 01:13:07.093', '2026-09-17 01:13:07.093');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frq00khjx7dgcfz0yeo', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqr00jqjx7d8sybgwoa', NULL, 'cmu4u5f1o006ajx7dmubkph58', NULL, '2026-08-20', 7.00, 'Site coordination and supplier follow-up (PRJ-LUMEN-01)', true, 88.00, '2026-09-17 01:13:07.094', '2026-09-17 01:13:07.094');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frs00kijx7dv2n9wnhc', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', NULL, 'cmu4u5f1i0067jx7dfiu3brhc', NULL, '2026-09-10', 4.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 01:13:07.096', '2026-09-17 01:13:07.096');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frt00kjjx7de3k7yzzt', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', NULL, 'cmu4u5f1k0068jx7d18wg3eq5', NULL, '2026-09-03', 9.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 01:13:07.097', '2026-09-17 01:13:07.097');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5fru00kkjx7d2b6tpk6d', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', NULL, 'cmu4u5f1m0069jx7dscghk1rq', NULL, '2026-08-27', 8.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 01:13:07.098', '2026-09-17 01:13:07.098');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frv00kljx7don4sux34', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqw00jujx7df7rd0ud6', NULL, 'cmu4u5f1o006ajx7dmubkph58', NULL, '2026-08-20', 9.00, 'Site coordination and supplier follow-up (PRJ-ASTER-01)', true, 88.00, '2026-09-17 01:13:07.099', '2026-09-17 01:13:07.099');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frw00kmjx7don4qfuax', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqz00jyjx7d3gc4l8u6', NULL, 'cmu4u5f1i0067jx7dfiu3brhc', NULL, '2026-09-10', 8.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 01:13:07.1', '2026-09-17 01:13:07.1');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frx00knjx7dyvut0vaa', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqz00jyjx7d3gc4l8u6', NULL, 'cmu4u5f1k0068jx7d18wg3eq5', NULL, '2026-09-03', 7.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 01:13:07.101', '2026-09-17 01:13:07.101');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5frz00kojx7dsemylxn9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqz00jyjx7d3gc4l8u6', NULL, 'cmu4u5f1m0069jx7dscghk1rq', NULL, '2026-08-27', 4.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 01:13:07.103', '2026-09-17 01:13:07.103');
INSERT INTO public.timesheets (id, "organizationId", "projectId", "taskId", "employeeId", "userId", date, hours, description, billable, "hourlyRate", "createdAt", "updatedAt") VALUES ('cmu4u5fs000kpjx7d82tqd8u8', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5fqz00jyjx7d3gc4l8u6', NULL, 'cmu4u5f1o006ajx7dmubkph58', NULL, '2026-08-20', 8.00, 'Site coordination and supplier follow-up (PRJ-COBRE-01)', true, 88.00, '2026-09-17 01:13:07.104', '2026-09-17 01:13:07.104');


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f4i0081jx7djcl36pro', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 28032.54, 'GHS', 'Payment received for INV-2026-00001', 'Sales', '2026-03-28 00:00:00', 'PAY-2026-00001', NULL, 'cmu4u5f3s007pjx7dwwuc4n3j', NULL, 'cmu4u5f4g0080jx7dep1gozd9', NULL, 'cmu4u5f0q005wjx7d21lo13mf', NULL, NULL, '2026-09-17 01:13:06.258', '2026-09-17 01:13:06.258', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f53008bjx7dban8qzpw', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 11964.70, 'GHS', 'Payment received for INV-2026-00002', 'Sales', '2026-04-27 00:00:00', 'PAY-2026-00002', NULL, 'cmu4u5f4q0083jx7drthx1yom', NULL, 'cmu4u5f51008ajx7du3gj0zk2', NULL, 'cmu4u5f0s005xjx7d4qi4ji6y', NULL, NULL, '2026-09-17 01:13:06.279', '2026-09-17 01:13:06.279', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f5p008ljx7dosxbu0p2', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 11829.73, 'GHS', 'Payment received for INV-2026-00003', 'Sales', '2026-04-29 00:00:00', 'PAY-2026-00003', NULL, 'cmu4u5f5a008djx7dbizevi8k', NULL, 'cmu4u5f5n008kjx7dcz2catm8', NULL, 'cmu4u5f0u005yjx7d0wha4vi3', NULL, NULL, '2026-09-17 01:13:06.301', '2026-09-17 01:13:06.301', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f6i008zjx7d8yh854fj', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 25208.81, 'GHS', 'Payment received for INV-2026-00004', 'Sales', '2026-06-03 00:00:00', 'PAY-2026-00004', NULL, 'cmu4u5f5w008njx7dwt4gsrnn', NULL, 'cmu4u5f6g008yjx7d9841bwho', NULL, 'cmu4u5f0w005zjx7ddaqejxe8', NULL, NULL, '2026-09-17 01:13:06.33', '2026-09-17 01:13:06.33', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f7e009djx7dwsv5j219', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 24829.78, 'GHS', 'Payment received for INV-2026-00005', 'Sales', '2026-05-15 00:00:00', 'PAY-2026-00005', NULL, 'cmu4u5f6r0091jx7d6w0f9ddd', NULL, 'cmu4u5f79009cjx7dvyuqc5hw', NULL, 'cmu4u5f120060jx7du0ttfoyd', NULL, NULL, '2026-09-17 01:13:06.362', '2026-09-17 01:13:06.362', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f80009njx7dtiaxslmt', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 8505.64, 'GHS', 'Payment received for INV-2026-00006', 'Sales', '2026-05-19 00:00:00', 'PAY-2026-00006', NULL, 'cmu4u5f7l009fjx7dno49sdyc', NULL, 'cmu4u5f7y009mjx7dqvxvk6c9', NULL, 'cmu4u5f140061jx7dwarganau', NULL, NULL, '2026-09-17 01:13:06.384', '2026-09-17 01:13:06.384', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f8o009xjx7dtf83mgw9', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 5188.70, 'GHS', 'Payment received for INV-2026-00007', 'Sales', '2026-06-17 00:00:00', 'PAY-2026-00007', NULL, 'cmu4u5f88009pjx7dwy937no0', NULL, 'cmu4u5f8m009wjx7d68m0aen7', NULL, 'cmu4u5f190062jx7dig0iyu9c', NULL, NULL, '2026-09-17 01:13:06.408', '2026-09-17 01:13:06.408', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f9c00a9jx7dxfhqqadp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 3492.94, 'GHS', 'Payment received for INV-2026-00008', 'Sales', '2026-06-15 00:00:00', 'PAY-2026-00008', NULL, 'cmu4u5f8v009zjx7doea9r8ua', NULL, 'cmu4u5f9900a8jx7dsqp54f63', NULL, 'cmu4u5f1a0063jx7dp40puznl', NULL, NULL, '2026-09-17 01:13:06.432', '2026-09-17 01:13:06.432', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5f9z00aljx7dcfz2m53a', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 12499.91, 'GHS', 'Payment received for INV-2026-00009', 'Sales', '2026-06-09 00:00:00', 'PAY-2026-00009', NULL, 'cmu4u5f9j00abjx7d8gpkt9r6', NULL, 'cmu4u5f9x00akjx7dy0krawt6', NULL, 'cmu4u5f1c0064jx7drs17fqe5', NULL, NULL, '2026-09-17 01:13:06.455', '2026-09-17 01:13:06.455', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fan00axjx7dk4g7naw4', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 19218.65, 'GHS', 'Payment received for INV-2026-00010', 'Sales', '2026-07-11 00:00:00', 'PAY-2026-00010', NULL, 'cmu4u5fa600anjx7dpho68io8', NULL, 'cmu4u5fal00awjx7ds4416t6m', NULL, 'cmu4u5f1e0065jx7d2gkycotj', NULL, NULL, '2026-09-17 01:13:06.479', '2026-09-17 01:13:06.479', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fbe00bbjx7duiqxcvyy', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 4049.21, 'GHS', 'Payment received for INV-2026-00011', 'Sales', '2026-07-13 00:00:00', 'PAY-2026-00011', NULL, 'cmu4u5fav00azjx7de5yji16e', NULL, 'cmu4u5fbc00bajx7ddbdslsv5', NULL, 'cmu4u5f0q005wjx7d21lo13mf', NULL, NULL, '2026-09-17 01:13:06.506', '2026-09-17 01:13:06.506', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fc100bpjx7d82dnhz89', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 26660.48, 'GHS', 'Payment received for INV-2026-00012', 'Sales', '2026-07-13 00:00:00', 'PAY-2026-00012', NULL, 'cmu4u5fbl00bdjx7df15zpnmf', NULL, 'cmu4u5fc000bojx7dumzpg5s9', NULL, 'cmu4u5f0s005xjx7d4qi4ji6y', NULL, NULL, '2026-09-17 01:13:06.529', '2026-09-17 01:13:06.529', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fck00bzjx7du0934ie5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 11531.07, 'GHS', 'Payment received for INV-2026-00013', 'Sales', '2026-07-09 00:00:00', 'PAY-2026-00013', NULL, 'cmu4u5fc800brjx7dq1dkp4hp', NULL, 'cmu4u5fci00byjx7dps1oojvb', NULL, 'cmu4u5f0u005yjx7d0wha4vi3', NULL, NULL, '2026-09-17 01:13:06.548', '2026-09-17 01:13:06.548', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fd200c9jx7dclh7300v', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 22359.70, 'GHS', 'Payment received for INV-2026-00014', 'Sales', '2026-07-18 00:00:00', 'PAY-2026-00014', NULL, 'cmu4u5fcq00c1jx7dyzukvvig', NULL, 'cmu4u5fd000c8jx7dgyev0f8l', NULL, 'cmu4u5f0w005zjx7ddaqejxe8', NULL, NULL, '2026-09-17 01:13:06.566', '2026-09-17 01:13:06.566', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fdo00cljx7d2vmkdrjg', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 13525.60, 'GHS', 'Payment received for INV-2026-00015', 'Sales', '2026-07-26 00:00:00', 'PAY-2026-00015', NULL, 'cmu4u5fd800cbjx7dlwg0dqfr', NULL, 'cmu4u5fdm00ckjx7db3jo3ce8', NULL, 'cmu4u5f120060jx7du0ttfoyd', NULL, NULL, '2026-09-17 01:13:06.588', '2026-09-17 01:13:06.588', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fea00cxjx7du11jlf4o', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 11889.90, 'GHS', 'Payment received for INV-2026-00016', 'Sales', '2026-08-22 00:00:00', 'PAY-2026-00016', NULL, 'cmu4u5fdu00cnjx7dn3g1h9ei', NULL, 'cmu4u5fe800cwjx7dsheytd2a', NULL, 'cmu4u5f140061jx7dwarganau', NULL, NULL, '2026-09-17 01:13:06.61', '2026-09-17 01:13:06.61', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5few00d7jx7dbb84z32y', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 11336.93, 'GHS', 'Payment received for INV-2026-00017', 'Sales', '2026-08-12 00:00:00', 'PAY-2026-00017', NULL, 'cmu4u5feh00czjx7df5gb3qfu', NULL, 'cmu4u5feu00d6jx7dokk1safe', NULL, 'cmu4u5f190062jx7dig0iyu9c', NULL, NULL, '2026-09-17 01:13:06.632', '2026-09-17 01:13:06.632', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ffh00djjx7d42uqpbag', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 49250.41, 'GHS', 'Payment received for INV-2026-00018', 'Sales', '2026-08-17 00:00:00', 'PAY-2026-00018', NULL, 'cmu4u5ff300d9jx7dhdva9d0t', NULL, 'cmu4u5fff00dijx7d3yo1fgbf', NULL, 'cmu4u5f1a0063jx7dp40puznl', NULL, NULL, '2026-09-17 01:13:06.653', '2026-09-17 01:13:06.653', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5ffv00drjx7d8j5pez1o', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 3125.10, 'GHS', 'Payment received for INV-2026-00019', 'Sales', '2026-09-01 00:00:00', 'PAY-2026-00019', NULL, 'cmu4u5ffn00dljx7ddo4glrf0', NULL, 'cmu4u5ffu00dqjx7dyzmrn7bk', NULL, 'cmu4u5f1c0064jx7drs17fqe5', NULL, NULL, '2026-09-17 01:13:06.667', '2026-09-17 01:13:06.667', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fgz00eejx7dyh9zepbc', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 3565.10, 'GHS', 'Payment received for INV-2026-00022', 'Sales', '2026-09-18 00:00:00', 'PAY-2026-00020', NULL, 'cmu4u5fgn00e6jx7dzty15xb8', NULL, 'cmu4u5fgx00edjx7dj7npaogh', NULL, 'cmu4u5f0s005xjx7d4qi4ji6y', NULL, NULL, '2026-09-17 01:13:06.707', '2026-09-17 01:13:06.707', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fi400f2jx7duiz55um4', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 5913.31, 'GHS', 'Payment received for INV-2026-00025', 'Sales', '2026-09-21 00:00:00', 'PAY-2026-00021', NULL, 'cmu4u5fhr00eujx7dc14cj576', NULL, 'cmu4u5fi100f1jx7dkjnpauy9', NULL, 'cmu4u5f120060jx7du0ttfoyd', NULL, NULL, '2026-09-17 01:13:06.748', '2026-09-17 01:13:06.748', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fim00fcjx7dzd0j1xdj', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 1370.60, 'GHS', 'Payment received for INV-2026-00026', 'Sales', '2026-09-24 00:00:00', 'PAY-2026-00022', NULL, 'cmu4u5fib00f4jx7d0vw8tugu', NULL, 'cmu4u5fik00fbjx7djy37r55l', NULL, 'cmu4u5f140061jx7dwarganau', NULL, NULL, '2026-09-17 01:13:06.766', '2026-09-17 01:13:06.766', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fj600fmjx7d67h4l50s', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 10669.40, 'GHS', 'Payment received for INV-2026-00027', 'Sales', '2026-09-15 00:00:00', 'PAY-2026-00023', NULL, 'cmu4u5fis00fejx7dl1n9m0ng', NULL, 'cmu4u5fj400fljx7dnh7rls1z', NULL, 'cmu4u5f190062jx7dig0iyu9c', NULL, NULL, '2026-09-17 01:13:06.786', '2026-09-17 01:13:06.786', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fjz00g5jx7dwq359oqp', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 9989.20, 'GHS', 'Payment received for INV-2026-00029', 'Sales', '2026-09-22 00:00:00', 'PAY-2026-00024', NULL, 'cmu4u5fjm00fvjx7ds393itg9', NULL, 'cmu4u5fjy00g4jx7dse86z75l', NULL, 'cmu4u5f1c0064jx7drs17fqe5', NULL, NULL, '2026-09-17 01:13:06.815', '2026-09-17 01:13:06.815', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fkf00gdjx7dl76181uw', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'INCOME', 2668.60, 'GHS', 'Payment received for INV-2026-00030', 'Sales', '2026-10-03 00:00:00', 'PAY-2026-00025', NULL, 'cmu4u5fk600g7jx7do0d0eyph', NULL, 'cmu4u5fkd00gcjx7dvkh17tgy', NULL, 'cmu4u5f1e0065jx7d2gkycotj', NULL, NULL, '2026-09-17 01:13:06.831', '2026-09-17 01:13:06.831', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fkn00ggjx7ddpmpae35', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -9240.00, 'GHS', 'Warehouse rent, quarterly', 'Rent & facilities', '2026-09-05 00:00:00', 'EXP-2026-00001', NULL, NULL, NULL, NULL, 'cmu4u5fkl00gfjx7d32dibtsa', NULL, NULL, NULL, '2026-09-17 01:13:06.84', '2026-09-17 01:13:06.84', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fku00gjjx7diafmiel6', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls', 'Travel', '2026-09-12 00:00:00', 'EXP-2026-00002', NULL, NULL, NULL, NULL, 'cmu4u5fks00gijx7dvl5l8gus', NULL, NULL, NULL, '2026-09-17 01:13:06.846', '2026-09-17 01:13:06.846', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fl100gmjx7dn54s7g19', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats)', 'Software & subscriptions', '2026-08-29 00:00:00', 'EXP-2026-00003', NULL, NULL, NULL, NULL, 'cmu4u5fkz00gljx7d5om19ahf', NULL, NULL, NULL, '2026-09-17 01:13:06.853', '2026-09-17 01:13:06.853', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fl800gpjx7dnq4m26s4', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3575.00, 'GHS', 'Trade show stand at Workspace Expo', 'Marketing', '2026-08-21 00:00:00', 'EXP-2026-00004', NULL, NULL, NULL, NULL, 'cmu4u5fl600gojx7duseofmip', NULL, NULL, NULL, '2026-09-17 01:13:06.86', '2026-09-17 01:13:06.86', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fle00gsjx7dlkiobitc', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity', 'Utilities', '2026-09-09 00:00:00', 'EXP-2026-00005', NULL, NULL, NULL, NULL, 'cmu4u5fld00grjx7ddp9cycgu', NULL, NULL, NULL, '2026-09-17 01:13:06.866', '2026-09-17 01:13:06.866', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fln00gvjx7dpen5evmc', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1298.00, 'GHS', 'Forklift annual service', 'Equipment', '2026-08-14 00:00:00', 'EXP-2026-00006', NULL, NULL, NULL, NULL, 'cmu4u5fll00gujx7dysr22cdh', NULL, NULL, NULL, '2026-09-17 01:13:06.875', '2026-09-17 01:13:06.875', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5flt00gyjx7dpwlbf1xz', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer', 'Professional services', '2026-09-02 00:00:00', 'EXP-2026-00007', NULL, NULL, NULL, NULL, 'cmu4u5fls00gxjx7djy04osy6', NULL, NULL, NULL, '2026-09-17 01:13:06.881', '2026-09-17 01:13:06.881', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5flz00h1jx7dyi1l39qg', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -438.57, 'GHS', 'Packing materials and pallets', 'Office supplies', '2026-09-14 00:00:00', 'EXP-2026-00008', NULL, NULL, NULL, NULL, 'cmu4u5fly00h0jx7diybfo3u8', NULL, NULL, NULL, '2026-09-17 01:13:06.887', '2026-09-17 01:13:06.887', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fm700h4jx7dunxn5gqm', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -950.40, 'GHS', 'Installer team overnight accommodation', 'Travel', '2026-08-27 00:00:00', 'EXP-2026-00009', NULL, NULL, NULL, NULL, 'cmu4u5fm500h3jx7dsuxp74e9', NULL, NULL, NULL, '2026-09-17 01:13:06.895', '2026-09-17 01:13:06.895', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmd00h7jx7dukbm7k83', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -2464.00, 'GHS', 'Liability insurance premium', 'Professional services', '2026-08-03 00:00:00', 'EXP-2026-00010', NULL, NULL, NULL, NULL, 'cmu4u5fmc00h6jx7dke35gjc4', NULL, NULL, NULL, '2026-09-17 01:13:06.901', '2026-09-17 01:13:06.901', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmk00hajx7dg9m63ir3', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, current month', 'Rent & facilities', '2026-08-31 00:00:00', 'EXP-2026-00011', NULL, NULL, NULL, NULL, 'cmu4u5fmi00h9jx7d733qojrx', NULL, NULL, NULL, '2026-09-17 01:13:06.908', '2026-09-17 01:13:06.908', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmp00hdjx7dw61w5074', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), current month', 'Software & subscriptions', '2026-09-02 00:00:00', 'EXP-2026-00012', NULL, NULL, NULL, NULL, 'cmu4u5fmo00hcjx7db9vp3xwe', NULL, NULL, NULL, '2026-09-17 01:13:06.913', '2026-09-17 01:13:06.913', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmu00hgjx7dmhe0lyxg', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, current month', 'Utilities', '2026-09-06 00:00:00', 'EXP-2026-00013', NULL, NULL, NULL, NULL, 'cmu4u5fmt00hfjx7drxkzk3gf', NULL, NULL, NULL, '2026-09-17 01:13:06.918', '2026-09-17 01:13:06.918', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fmz00hjjx7der0ffhav', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, current month', 'Professional services', '2026-09-04 00:00:00', 'EXP-2026-00014', NULL, NULL, NULL, NULL, 'cmu4u5fmy00hijx7doqsv28et', NULL, NULL, NULL, '2026-09-17 01:13:06.923', '2026-09-17 01:13:06.923', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fn400hmjx7d06q520e5', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, current month', 'Travel', '2026-09-02 00:00:00', 'EXP-2026-00015', NULL, NULL, NULL, NULL, 'cmu4u5fn300hljx7dqq610exh', NULL, NULL, NULL, '2026-09-17 01:13:06.928', '2026-09-17 01:13:06.928', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fn900hpjx7ddhyyqfes', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 1 month ago', 'Rent & facilities', '2026-08-10 00:00:00', 'EXP-2026-00016', NULL, NULL, NULL, NULL, 'cmu4u5fn800hojx7dhvccve1e', NULL, NULL, NULL, '2026-09-17 01:13:06.933', '2026-09-17 01:13:06.933', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fne00hsjx7dbiqsxuoz', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 1 month ago', 'Software & subscriptions', '2026-08-07 00:00:00', 'EXP-2026-00017', NULL, NULL, NULL, NULL, 'cmu4u5fnd00hrjx7dri0gc3dt', NULL, NULL, NULL, '2026-09-17 01:13:06.938', '2026-09-17 01:13:06.938', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fnj00hvjx7dotsdrw9y', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 1 month ago', 'Utilities', '2026-08-02 00:00:00', 'EXP-2026-00018', NULL, NULL, NULL, NULL, 'cmu4u5fni00hujx7d9r8jjqx8', NULL, NULL, NULL, '2026-09-17 01:13:06.943', '2026-09-17 01:13:06.943', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fno00hyjx7dkotbnt5r', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 1 month ago', 'Professional services', '2026-08-01 00:00:00', 'EXP-2026-00019', NULL, NULL, NULL, NULL, 'cmu4u5fnn00hxjx7d4kx3jlit', NULL, NULL, NULL, '2026-09-17 01:13:06.948', '2026-09-17 01:13:06.948', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fnt00i1jx7deh50zulb', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 1 month ago', 'Travel', '2026-08-16 00:00:00', 'EXP-2026-00020', NULL, NULL, NULL, NULL, 'cmu4u5fns00i0jx7dopywk53i', NULL, NULL, NULL, '2026-09-17 01:13:06.953', '2026-09-17 01:13:06.953', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fny00i4jx7dnmhxmjgh', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 2 months ago', 'Rent & facilities', '2026-07-06 00:00:00', 'EXP-2026-00021', NULL, NULL, NULL, NULL, 'cmu4u5fnx00i3jx7d2or8fde1', NULL, NULL, NULL, '2026-09-17 01:13:06.958', '2026-09-17 01:13:06.958', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fo300i7jx7dxp779a4f', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 2 months ago', 'Software & subscriptions', '2026-07-04 00:00:00', 'EXP-2026-00022', NULL, NULL, NULL, NULL, 'cmu4u5fo200i6jx7dp13d0iqn', NULL, NULL, NULL, '2026-09-17 01:13:06.963', '2026-09-17 01:13:06.963', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fo800iajx7dc9wm037q', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 2 months ago', 'Utilities', '2026-07-13 00:00:00', 'EXP-2026-00023', NULL, NULL, NULL, NULL, 'cmu4u5fo700i9jx7dkjygvtwa', NULL, NULL, NULL, '2026-09-17 01:13:06.968', '2026-09-17 01:13:06.968', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fod00idjx7d4i0ffeoj', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 2 months ago', 'Professional services', '2026-07-03 00:00:00', 'EXP-2026-00024', NULL, NULL, NULL, NULL, 'cmu4u5foc00icjx7dwey3a8j4', NULL, NULL, NULL, '2026-09-17 01:13:06.973', '2026-09-17 01:13:06.973', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5foi00igjx7dvcghaw5l', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 2 months ago', 'Travel', '2026-07-07 00:00:00', 'EXP-2026-00025', NULL, NULL, NULL, NULL, 'cmu4u5foh00ifjx7dcix1qywg', NULL, NULL, NULL, '2026-09-17 01:13:06.978', '2026-09-17 01:13:06.978', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fon00ijjx7dbhzxbwh4', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 3 months ago', 'Rent & facilities', '2026-06-03 00:00:00', 'EXP-2026-00026', NULL, NULL, NULL, NULL, 'cmu4u5fol00iijx7dvm7z8dbq', NULL, NULL, NULL, '2026-09-17 01:13:06.983', '2026-09-17 01:13:06.983', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5for00imjx7dwqyeyoi1', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 3 months ago', 'Software & subscriptions', '2026-05-31 00:00:00', 'EXP-2026-00027', NULL, NULL, NULL, NULL, 'cmu4u5foq00iljx7dqgblviq6', NULL, NULL, NULL, '2026-09-17 01:13:06.987', '2026-09-17 01:13:06.987', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fow00ipjx7dixzcmy2z', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 3 months ago', 'Utilities', '2026-06-11 00:00:00', 'EXP-2026-00028', NULL, NULL, NULL, NULL, 'cmu4u5fov00iojx7d6djb4r8g', NULL, NULL, NULL, '2026-09-17 01:13:06.992', '2026-09-17 01:13:06.992', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fp200isjx7d2picn6iw', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 3 months ago', 'Professional services', '2026-06-07 00:00:00', 'EXP-2026-00029', NULL, NULL, NULL, NULL, 'cmu4u5foz00irjx7dka8dqszn', NULL, NULL, NULL, '2026-09-17 01:13:06.998', '2026-09-17 01:13:06.998', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fp700ivjx7dciko24v6', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 3 months ago', 'Travel', '2026-06-02 00:00:00', 'EXP-2026-00030', NULL, NULL, NULL, NULL, 'cmu4u5fp600iujx7dn1acu013', NULL, NULL, NULL, '2026-09-17 01:13:07.003', '2026-09-17 01:13:07.003', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpd00iyjx7dct2xill0', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 4 months ago', 'Rent & facilities', '2026-05-13 00:00:00', 'EXP-2026-00031', NULL, NULL, NULL, NULL, 'cmu4u5fpb00ixjx7da22dhbbq', NULL, NULL, NULL, '2026-09-17 01:13:07.009', '2026-09-17 01:13:07.009', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpi00j1jx7dln46w3gs', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 4 months ago', 'Software & subscriptions', '2026-05-07 00:00:00', 'EXP-2026-00032', NULL, NULL, NULL, NULL, 'cmu4u5fph00j0jx7d1vlin6a4', NULL, NULL, NULL, '2026-09-17 01:13:07.014', '2026-09-17 01:13:07.014', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpn00j4jx7df8y891rn', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 4 months ago', 'Utilities', '2026-05-10 00:00:00', 'EXP-2026-00033', NULL, NULL, NULL, NULL, 'cmu4u5fpm00j3jx7d5bcxysd0', NULL, NULL, NULL, '2026-09-17 01:13:07.019', '2026-09-17 01:13:07.019', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpr00j7jx7dfh3qrsab', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 4 months ago', 'Professional services', '2026-05-16 00:00:00', 'EXP-2026-00034', NULL, NULL, NULL, NULL, 'cmu4u5fpq00j6jx7d62uaduli', NULL, NULL, NULL, '2026-09-17 01:13:07.023', '2026-09-17 01:13:07.023', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fpw00jajx7d3dgmwz2f', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 4 months ago', 'Travel', '2026-05-03 00:00:00', 'EXP-2026-00035', NULL, NULL, NULL, NULL, 'cmu4u5fpv00j9jx7d7wpf1gb4', NULL, NULL, NULL, '2026-09-17 01:13:07.028', '2026-09-17 01:13:07.028', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fq100jdjx7dt7rjcfkv', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -3080.00, 'GHS', 'Warehouse rent, 5 months ago', 'Rent & facilities', '2026-04-18 00:00:00', 'EXP-2026-00036', NULL, NULL, NULL, NULL, 'cmu4u5fq000jcjx7dgn2q5xsb', NULL, NULL, NULL, '2026-09-17 01:13:07.033', '2026-09-17 01:13:07.033', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fq600jgjx7dm7f0db6x', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -819.50, 'GHS', 'Design software licences (5 seats), 5 months ago', 'Software & subscriptions', '2026-04-16 00:00:00', 'EXP-2026-00037', NULL, NULL, NULL, NULL, 'cmu4u5fq500jfjx7dtcqr4hco', NULL, NULL, NULL, '2026-09-17 01:13:07.038', '2026-09-17 01:13:07.038', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqb00jjjx7d5kwoujqi', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -534.77, 'GHS', 'Warehouse electricity, 5 months ago', 'Utilities', '2026-04-16 00:00:00', 'EXP-2026-00038', NULL, NULL, NULL, NULL, 'cmu4u5fqa00jijx7dqdmzocp5', NULL, NULL, NULL, '2026-09-17 01:13:07.043', '2026-09-17 01:13:07.043', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fqg00jmjx7dnljgh2fm', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003ijx7dv04s9i0a', 'EXPENSE', -1595.00, 'GHS', 'Accountancy retainer, 5 months ago', 'Professional services', '2026-04-11 00:00:00', 'EXP-2026-00039', NULL, NULL, NULL, NULL, 'cmu4u5fqe00jljx7dmym2ykml', NULL, NULL, NULL, '2026-09-17 01:13:07.048', '2026-09-17 01:13:07.048', NULL);
INSERT INTO public.transactions (id, "organizationId", "accountId", type, amount, currency, description, category, "occurredAt", reference, "toAccountId", "invoiceId", "billId", "paymentId", "expenseId", "customerId", "projectId", "createdById", "createdAt", "updatedAt", "deletedAt") VALUES ('cmu4u5fql00jpjx7duscrtyvn', 'cmu4u5eus0037jx7dx1af4of5', 'cmu4u5ew9003jjx7dz9qtry7j', 'EXPENSE', -673.64, 'GHS', 'Delivery van fuel and tolls, 5 months ago', 'Travel', '2026-04-11 00:00:00', 'EXP-2026-00040', NULL, NULL, NULL, NULL, 'cmu4u5fqk00jojx7dzagceg2u', NULL, NULL, NULL, '2026-09-17 01:13:07.053', '2026-09-17 01:13:07.053', NULL);


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict 4EgGeSEtfkxsl6PVZhpFxdYEk3xXc4MTpM0Furupkhoey9WgM7iJ2ffKYNTb87X

COMMIT;

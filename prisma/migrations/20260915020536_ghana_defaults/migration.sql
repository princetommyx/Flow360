-- AlterTable
ALTER TABLE "company_settings" ALTER COLUMN "taxLabel" SET DEFAULT 'VAT';

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "country" SET DEFAULT 'Ghana',
ALTER COLUMN "currency" SET DEFAULT 'GHS',
ALTER COLUMN "timezone" SET DEFAULT 'Africa/Accra';

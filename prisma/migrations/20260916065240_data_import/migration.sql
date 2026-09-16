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


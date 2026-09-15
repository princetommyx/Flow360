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

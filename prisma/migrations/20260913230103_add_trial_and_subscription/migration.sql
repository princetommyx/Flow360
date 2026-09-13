-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "requestedPlan" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

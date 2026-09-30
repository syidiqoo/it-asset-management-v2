-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "locationId" INTEGER;

-- CreateIndex
CREATE INDEX "Department_locationId_idx" ON "Department"("locationId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

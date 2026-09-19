-- Rename existing full address to detailStreetAddress (keeps data), then add
-- a new short "address" (location/area name) column.
ALTER TABLE "Location" RENAME COLUMN "address" TO "detailStreetAddress";
ALTER TABLE "Location" ADD COLUMN "address" TEXT;

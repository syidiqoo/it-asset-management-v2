-- SIM cards can be terminated (number deactivated) while keeping the rest of
-- the record, mirroring how assets are split into main/available/broken.
ALTER TABLE "SimCard" ADD COLUMN "terminated" BOOLEAN NOT NULL DEFAULT false;

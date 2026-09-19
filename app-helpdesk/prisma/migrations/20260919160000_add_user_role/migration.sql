-- Add a role to app users. Existing accounts become admin so the current
-- administrator keeps full access after the upgrade.
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';

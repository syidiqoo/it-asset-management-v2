-- CreateTable
CREATE TABLE "AssetFileHistory" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetFileHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetFileHistory_assetId_kind_createdAt_idx" ON "AssetFileHistory"("assetId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "AssetFileHistory" ADD CONSTRAINT "AssetFileHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

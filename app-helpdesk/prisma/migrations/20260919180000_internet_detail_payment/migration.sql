-- Internet records now carry the customer's detail note and payment method, and
-- bandwidth is optional because some subscriptions do not record it.
ALTER TABLE "InternetData" ADD COLUMN "detail" TEXT;
ALTER TABLE "InternetData" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "InternetData" ALTER COLUMN "bandwidthMbps" DROP NOT NULL;

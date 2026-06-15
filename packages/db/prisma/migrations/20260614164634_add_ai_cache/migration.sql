-- CreateTable
CREATE TABLE "ai_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "image_hash" VARCHAR(64) NOT NULL,
    "ai_result" JSONB NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_image_hash_key" ON "ai_cache"("image_hash");

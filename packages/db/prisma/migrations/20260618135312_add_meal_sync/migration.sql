-- AlterTable
ALTER TABLE "meal_logs" ADD COLUMN     "sync_event_id" UUID;

-- CreateTable
CREATE TABLE "meal_sync_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meal_log_id" UUID NOT NULL,
    "synced_by" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "sync_type" VARCHAR(30) NOT NULL DEFAULT 'meal_sync',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_sync_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sync_event_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "portion_ratio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "kcal_snapshot" INTEGER,

    CONSTRAINT "meal_sync_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_sync_events_family_id_idx" ON "meal_sync_events"("family_id");

-- CreateIndex
CREATE INDEX "meal_sync_members_sync_event_id_idx" ON "meal_sync_members"("sync_event_id");

-- CreateIndex
CREATE INDEX "meal_sync_members_profile_id_idx" ON "meal_sync_members"("profile_id");

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_sync_event_id_fkey" FOREIGN KEY ("sync_event_id") REFERENCES "meal_sync_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_sync_events" ADD CONSTRAINT "meal_sync_events_meal_log_id_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_sync_events" ADD CONSTRAINT "meal_sync_events_synced_by_fkey" FOREIGN KEY ("synced_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_sync_events" ADD CONSTRAINT "meal_sync_events_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_sync_members" ADD CONSTRAINT "meal_sync_members_sync_event_id_fkey" FOREIGN KEY ("sync_event_id") REFERENCES "meal_sync_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_sync_members" ADD CONSTRAINT "meal_sync_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

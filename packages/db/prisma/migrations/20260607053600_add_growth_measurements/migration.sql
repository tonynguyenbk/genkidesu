-- CreateTable
CREATE TABLE "growth_measurements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "measured_at" DATE NOT NULL,
    "age_months" DOUBLE PRECISION NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "head_circumference_cm" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_measurements_profile_id_measured_at_idx" ON "growth_measurements"("profile_id", "measured_at");

-- AddForeignKey
ALTER TABLE "growth_measurements" ADD CONSTRAINT "growth_measurements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

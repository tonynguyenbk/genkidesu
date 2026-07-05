-- AlterTable
ALTER TABLE "families" ADD COLUMN     "max_members" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "type" VARCHAR(20) NOT NULL DEFAULT 'family';

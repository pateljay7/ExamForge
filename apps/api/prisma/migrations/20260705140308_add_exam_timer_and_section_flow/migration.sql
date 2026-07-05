/*
  Warnings:

  - You are about to drop the column `content` on the `Exam` table. All the data in the column will be lost.
  - Added the required column `sections` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "timeTakenSec" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "content",
ADD COLUMN     "sections" JSONB NOT NULL,
ADD COLUMN     "timeLimitSec" INTEGER,
ADD COLUMN     "timerEnabled" BOOLEAN NOT NULL DEFAULT false;

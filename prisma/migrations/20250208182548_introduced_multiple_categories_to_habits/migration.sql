/*
  Warnings:

  - Added the required column `updatedAt` to the `HabitLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "HabitLog" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "HabitCategory" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "HabitCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HabitCategory_habitId_idx" ON "HabitCategory"("habitId");

-- CreateIndex
CREATE INDEX "HabitCategory_categoryId_idx" ON "HabitCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitCategory_habitId_categoryId_key" ON "HabitCategory"("habitId", "categoryId");

-- AddForeignKey
ALTER TABLE "HabitCategory" ADD CONSTRAINT "HabitCategory_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCategory" ADD CONSTRAINT "HabitCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

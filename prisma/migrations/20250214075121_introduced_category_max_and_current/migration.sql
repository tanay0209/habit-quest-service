-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "categoryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "categoryMax" INTEGER NOT NULL DEFAULT 5;

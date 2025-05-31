/*
  Warnings:

  - A unique constraint covering the columns `[id_garantia]` on the table `Carro` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Carro" ADD COLUMN     "id_garantia" INTEGER;

-- AlterTable
ALTER TABLE "Garantia" ADD COLUMN     "id_carro" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "uq_carro_garantia" ON "Carro"("id_garantia");

-- AddForeignKey
ALTER TABLE "Carro" ADD CONSTRAINT "Carro_id_garantia_fkey" FOREIGN KEY ("id_garantia") REFERENCES "Garantia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

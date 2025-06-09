/*
  Warnings:

  - Added the required column `saldo` to the `ComprobanteDePago` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComprobanteDePago" ADD COLUMN     "saldo" DOUBLE PRECISION NOT NULL;

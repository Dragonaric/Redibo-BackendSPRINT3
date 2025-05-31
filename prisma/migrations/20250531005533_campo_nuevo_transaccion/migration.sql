-- AlterTable
ALTER TABLE "Transaccion" ADD COLUMN     "numeroTransaccion" TEXT,
ALTER COLUMN "qrUrl" DROP NOT NULL;

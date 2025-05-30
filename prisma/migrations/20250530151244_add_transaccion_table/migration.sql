-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('RETIRO', 'SUBIDA');

-- CreateEnum
CREATE TYPE "EstadoTransaccion" AS ENUM ('PENDIENTE', 'COMPLETADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "Transaccion" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "estado" "EstadoTransaccion" NOT NULL DEFAULT 'PENDIENTE',
    "qrUrl" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaccion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

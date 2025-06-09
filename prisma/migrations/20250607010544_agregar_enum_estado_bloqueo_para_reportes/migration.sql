-- CreateEnum
CREATE TYPE "EstadoBloqueo" AS ENUM ('ACTIVO', 'BLOQUEADO', 'SUSPENDIDO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "estadoBloqueo" "EstadoBloqueo" NOT NULL DEFAULT 'ACTIVO';

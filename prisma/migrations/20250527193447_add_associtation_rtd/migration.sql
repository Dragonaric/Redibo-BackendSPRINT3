-- CreateEnum
CREATE TYPE "TipoSolicitudAsociacion" AS ENUM ('RENTER_A_DRIVER', 'DRIVER_A_RENTER');

-- CreateEnum
CREATE TYPE "EstadoSolicitudAsociacion" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "SolicitudAsociacion" (
    "id" SERIAL NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "receptorId" INTEGER NOT NULL,
    "tipo" "TipoSolicitudAsociacion" NOT NULL,
    "mensaje" VARCHAR(150),
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),

    CONSTRAINT "SolicitudAsociacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asociacion" (
    "id" SERIAL NOT NULL,
    "renterId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Asociacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SolicitudAsociacion" ADD CONSTRAINT "SolicitudAsociacion_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAsociacion" ADD CONSTRAINT "SolicitudAsociacion_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asociacion" ADD CONSTRAINT "Asociacion_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asociacion" ADD CONSTRAINT "Asociacion_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

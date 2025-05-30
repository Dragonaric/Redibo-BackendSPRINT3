-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoCarro" AS ENUM ('DISPONIBLE', 'RESERVADO', 'MANTENIMIENTO');

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "Estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "fecha_actualizacion" TIMESTAMP(3),
ADD COLUMN     "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ocupacion" TEXT;

-- CreateTable
CREATE TABLE "CalificacionReserva" (
    "id" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "comportamiento" INTEGER NOT NULL,
    "cuidado_vehiculo" INTEGER NOT NULL,
    "puntualidad" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalificacionReserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioCarro" (
    "id" SERIAL NOT NULL,
    "id_carro" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComentarioCarro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" SERIAL NOT NULL,
    "id_reportado" INTEGER NOT NULL,
    "id_reportador" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "informacion_adicional" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalificacionReserva_id_reserva_idx" ON "CalificacionReserva"("id_reserva");

-- CreateIndex
CREATE INDEX "ComentarioCarro_id_carro_idx" ON "ComentarioCarro"("id_carro");

-- CreateIndex
CREATE INDEX "ComentarioCarro_id_usuario_idx" ON "ComentarioCarro"("id_usuario");

-- CreateIndex
CREATE INDEX "Reporte_id_reportado_idx" ON "Reporte"("id_reportado");

-- CreateIndex
CREATE INDEX "Reporte_id_reportador_idx" ON "Reporte"("id_reportador");

-- AddForeignKey
ALTER TABLE "CalificacionReserva" ADD CONSTRAINT "CalificacionReserva_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioCarro" ADD CONSTRAINT "ComentarioCarro_id_carro_fkey" FOREIGN KEY ("id_carro") REFERENCES "Carro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioCarro" ADD CONSTRAINT "ComentarioCarro_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_id_reportado_fkey" FOREIGN KEY ("id_reportado") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_id_reportador_fkey" FOREIGN KEY ("id_reportador") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

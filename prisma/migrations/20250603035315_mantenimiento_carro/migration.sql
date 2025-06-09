-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "ultimaSesion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Mantenimiento" (
    "id" SERIAL NOT NULL,
    "id_carro" INTEGER NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,

    CONSTRAINT "Mantenimiento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_id_carro_fkey" FOREIGN KEY ("id_carro") REFERENCES "Carro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

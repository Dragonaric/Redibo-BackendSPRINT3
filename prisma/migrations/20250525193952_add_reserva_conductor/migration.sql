-- CreateTable
CREATE TABLE "ReservaConductor" (
    "id" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "ReservaConductor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReservaConductor" ADD CONSTRAINT "ReservaConductor_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaConductor" ADD CONSTRAINT "ReservaConductor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

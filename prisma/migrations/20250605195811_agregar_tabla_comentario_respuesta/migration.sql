-- CreateTable
CREATE TABLE "ComentarioRespuesta" (
    "id" SERIAL NOT NULL,
    "comentario" TEXT NOT NULL,
    "calreserId" INTEGER,
    "respuestaPadreId" INTEGER,

    CONSTRAINT "ComentarioRespuesta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComentarioRespuesta" ADD CONSTRAINT "ComentarioRespuesta_calreserId_fkey" FOREIGN KEY ("calreserId") REFERENCES "CalificacionReserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRespuesta" ADD CONSTRAINT "ComentarioRespuesta_respuestaPadreId_fkey" FOREIGN KEY ("respuestaPadreId") REFERENCES "ComentarioRespuesta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

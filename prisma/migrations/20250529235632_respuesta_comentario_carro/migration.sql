-- CreateTable
CREATE TABLE "RespuestaComentarioCarro" (
    "id" SERIAL NOT NULL,
    "id_comentario" INTEGER,
    "id_usuario_host" INTEGER,
    "respuesta" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "RespuestaComentarioCarro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RespuestaComentarioCarro_id_comentario_idx" ON "RespuestaComentarioCarro"("id_comentario");

-- CreateIndex
CREATE INDEX "RespuestaComentarioCarro_id_usuario_host_idx" ON "RespuestaComentarioCarro"("id_usuario_host");

-- AddForeignKey
ALTER TABLE "RespuestaComentarioCarro" ADD CONSTRAINT "RespuestaComentarioCarro_id_comentario_fkey" FOREIGN KEY ("id_comentario") REFERENCES "ComentarioCarro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaComentarioCarro" ADD CONSTRAINT "RespuestaComentarioCarro_id_usuario_host_fkey" FOREIGN KEY ("id_usuario_host") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

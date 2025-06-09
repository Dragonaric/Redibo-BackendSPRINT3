const express = require("express");
const { prisma } = require("../lib/prisma");
const { getUserId } = require("../lib/auth");

const router = express.Router();
// GET /api/comentarios-carro?carroId=&usuarioId=&hostId=
router.get("/", async (req, res) => {
  try {
    const { carroId, usuarioId, hostId } = req.query;

    const where = {};
    if (carroId) where.id_carro = Number(carroId);
    if (usuarioId) where.id_usuario = Number(usuarioId);
    if (hostId) {
      where.carro = { id_usuario_rol: Number(hostId) };
    }

    const comentariosRaw = await prisma.comentarioCarro.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, foto: true } },
        carro: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            id_usuario_rol: true,
            Imagen: { select: { data: true, public_id: true }, take: 1 },
          },
        },
        respuestas: {
          include: {
            host: { select: { id: true, nombre: true, foto: true } },
          },
          orderBy: { fecha_creacion: "asc" },
        },
      },
      orderBy: { fecha_creacion: "desc" },
    });

    const comentarios = comentariosRaw.map((comentario) => {
      const imagen =
        comentario.carro?.Imagen?.length > 0
          ? {
              url: comentario.carro.Imagen[0].data,
              public_id: comentario.carro.Imagen[0].public_id,
            }
          : null;

      return {
        ...comentario,
        carro: {
          ...comentario.carro,
          imagen,
        },
      };
    });

    return res.json(comentarios);
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    return res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

// NUEVA RUTA: GET /api/comentarios-carro/con-respuestas
router.get("/con-respuestas", async (req, res) => {
  try {
    const { carroId, usuarioId, hostId } = req.query;

    const where = {};
    if (carroId) where.id_carro = Number(carroId);
    if (usuarioId) where.id_usuario = Number(usuarioId);
    if (hostId) {
      where.carro = { id_usuario_rol: Number(hostId) };
    }

    // Primero obtenemos los comentarios sin respuestas
    const comentarios = await prisma.comentarioCarro.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nombre: true, foto: true },
        },
        carro: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            id_usuario_rol: true,
            Imagen: {
              select: { data: true, public_id: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { fecha_creacion: "desc" },
    });

    // Luego obtenemos las respuestas ordenadas para cada comentario
    const comentariosConRespuestas = await Promise.all(
      comentarios.map(async (comentario) => {
        const respuestas = await prisma.respuestaComentarioCarro.findMany({
          where: { id_comentario: comentario.id },
          include: {
            host: {
              select: { id: true, nombre: true, foto: true },
            },
          },
          orderBy: { fecha_creacion: "asc" },
        });

        return {
          ...comentario,
          respuestas,
        };
      })
    );

    return res.json(comentariosConRespuestas);
  } catch (error) {
    console.error("Error al obtener comentarios con respuestas:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener comentarios con respuestas" });
  }
});

// GET /api/comentarios-carro/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const comentario = await prisma.comentarioCarro.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: {
          select: { id: true, nombre: true, foto: true },
        },
        carro: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            id_usuario_rol: true,
            Imagen: {
              select: { data: true, public_id: true },
              take: 1,
            },
          },
        },
        respuestas: {
          include: {
            host: {
              select: { id: true, nombre: true, foto: true },
            },
          },
          orderBy: { fecha_creacion: "asc" },
        },
      },
    });

    if (!comentario) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    return res.json(comentario);
  } catch (error) {
    console.error("Error al obtener comentario:", error);
    return res.status(500).json({ error: "Error al obtener comentario" });
  }
});

// POST /api/comentarios-carro
router.post("/", async (req, res) => {
  try {
    const { id_carro, comentario, calificacion } = req.body;

    if (!id_carro || !comentario) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const carro = await prisma.carro.findUnique({
      where: { id: Number(id_carro) },
    });

    if (!carro) {
      return res.status(404).json({ error: "Carro no encontrado" });
    }

    const nuevoComentario = await prisma.comentarioCarro.create({
      data: {
        id_carro: Number(id_carro),
        id_usuario: Number(userId),
        comentario,
        calificacion: calificacion || 0,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, foto: true },
        },
        carro: {
          select: { id: true, marca: true, modelo: true },
        },
      },
    });

    return res.status(201).json(nuevoComentario);
  } catch (error) {
    console.error("Error al crear comentario:", error);
    return res.status(500).json({ error: "Error al crear comentario" });
  }
});

// PUT /api/comentarios-carro/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, calificacion } = req.body;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const comentarioExistente = await prisma.comentarioCarro.findUnique({
      where: { id: Number(id) },
    });

    if (!comentarioExistente) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    if (comentarioExistente.id_usuario !== Number(userId)) {
      return res.status(403).json({ error: "No autorizado para editar" });
    }

    const comentarioActualizado = await prisma.comentarioCarro.update({
      where: { id: Number(id) },
      data: {
        comentario: comentario || comentarioExistente.comentario,
        calificacion:
          calificacion !== undefined
            ? calificacion
            : comentarioExistente.calificacion,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, foto: true },
        },
        carro: {
          select: { id: true, marca: true, modelo: true },
        },
      },
    });

    return res.json(comentarioActualizado);
  } catch (error) {
    console.error("Error al actualizar comentario:", error);
    return res.status(500).json({ error: "Error al actualizar comentario" });
  }
});

// DELETE /api/comentarios-carro/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const comentario = await prisma.comentarioCarro.findUnique({
      where: { id: Number(id) },
    });

    if (!comentario) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    if (comentario.id_usuario !== Number(userId)) {
      return res.status(403).json({ error: "No autorizado para eliminar" });
    }

    await prisma.comentarioCarro.delete({
      where: { id: Number(id) },
    });

    return res.json({ success: true, message: "Comentario eliminado" });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    return res.status(500).json({ error: "Error al eliminar comentario" });
  }
});

// POST /api/comentarios-carro/respuestas
router.post("/respuestas", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || isNaN(userId)) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { id_comentario, respuesta } = req.body;

    // Validación de campos
    if (!id_comentario || typeof respuesta !== "string") {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios o son inválidos." });
    }

    // Validación de longitud
    if (respuesta.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "La respuesta no puede estar vacía." });
    }

    if (respuesta.length > 200) {
      return res
        .status(400)
        .json({ error: "La respuesta no puede superar los 200 caracteres." });
    }

    // Verificar que el comentario exista
    const comentarioExistente = await prisma.comentarioCarro.findUnique({
      where: { id: Number(id_comentario) },
    });

    if (!comentarioExistente) {
      return res.status(404).json({ error: "Comentario no encontrado." });
    }

    // Crear la respuesta
    const nuevaRespuesta = await prisma.respuestaComentarioCarro.create({
      data: {
        id_comentario: Number(id_comentario),
        id_usuario_host: Number(userId),
        respuesta,
      },
      include: {
        host: {
          select: { id: true, nombre: true, foto: true },
        },
      },
    });

    return res.status(201).json({
      mensaje: "Respuesta registrada correctamente.",
      respuesta: nuevaRespuesta,
    });
  } catch (error) {
    console.error("Error al crear respuesta:", error);

    // Asegura que siempre se devuelva un JSON válido
    return res.status(500).json({
      error: "Error inesperado al crear la respuesta.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/comentarios-carro/respuestas/:id
router.delete("/respuestas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const respuesta = await prisma.respuestaComentarioCarro.findUnique({
      where: { id: Number(id) },
    });

    if (!respuesta) {
      return res.status(404).json({ error: "Respuesta no encontrada" });
    }

    if (respuesta.id_usuario_host !== Number(userId)) {
      return res
        .status(403)
        .json({ error: "No autorizado para eliminar esta respuesta" });
    }

    await prisma.respuestaComentarioCarro.delete({
      where: { id: Number(id) },
    });

    return res.json({
      success: true,
      message: "Respuesta eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar respuesta:", error);
    return res.status(500).json({ error: "Error al eliminar respuesta" });
  }
});

module.exports = router;

const { validationResult } = require("express-validator");
const { prisma } = require("../lib/prisma");

exports.rateRenter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { renterId, reservaId, comportamiento, cuidadoVehiculo, puntualidad, comentario } = req.body;
    const calificadorId = req.user.id; // ID del usuario autenticado (host)

    // Verificar que la reserva existe y pertenece al host
    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(reservaId) },
      include: {
        carro: {
          select: {
            id_usuario_rol: true,
          },
        },
      },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    if (reserva.carro.id_usuario_rol !== parseInt(calificadorId)) {
      return res.status(403).json({ error: "No autorizado para calificar esta reserva" });
    }

    if (reserva.id_usuario !== parseInt(renterId)) {
      return res.status(400).json({ error: "El renterId no coincide con el usuario de la reserva" });
    }

    // Verificar que no existe una calificación previa
    const calificacionExistente = await prisma.calificacion.findFirst({
      where: {
        id_calificador: parseInt(calificadorId),
        id_calificado: parseInt(renterId),
        id_reserva: parseInt(reservaId),
      },
    });

    if (calificacionExistente) {
      return res.status(400).json({ error: "Ya existe una calificación para esta reserva" });
    }

    // Crear la calificación
    const nuevaCalificacion = await prisma.calificacion.create({
      data: {
        id_calificador: parseInt(calificadorId),
        id_calificado: parseInt(renterId),
        id_reserva: parseInt(reservaId),
        comportamiento,
        cuidado_vehiculo: cuidadoVehiculo,
        puntualidad,
        comentario,
      },
      include: {
        calificador: {
          select: {
            id: true,
            nombre: true,
            foto: true,
          },
        },
        calificado: {
          select: {
            id: true,
            nombre: true,
            foto: true,
          },
        },
      },
    });

    res.status(201).json(nuevaCalificacion);
  } catch (error) {
    console.error("Error al calificar al renter:", error);
    res.status(500).json({ error: "Error al calificar al renter" });
  }
};

exports.getRenterRatings = async (req, res) => {
  try {
    const { renterId } = req.params;

    const calificaciones = await prisma.calificacion.findMany({
      where: {
        id_calificado: parseInt(renterId),
      },
      include: {
        calificador: {
          select: {
            id: true,
            nombre: true,
            foto: true,
          },
        },
        calificado: {
          select: {
            id: true,
            nombre: true,
            foto: true,
          },
        },
        reserva: {
          select: {
            id: true,
            fecha_inicio: true,
            fecha_fin: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: "desc",
      },
    });

    res.json(calificaciones);
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ error: "Error al obtener calificaciones" });
  }
};

exports.updateRenterRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { calificacionId } = req.params;
    const { comportamiento, cuidadoVehiculo, puntualidad, comentario } = req.body;
    const calificadorId = req.user.id;

    // Verificar que la calificación existe y pertenece al calificador
    const calificacion = await prisma.calificacion.findUnique({
      where: { id: parseInt(calificacionId) },
    });

    if (!calificacion) {
      return res.status(404).json({ error: "Calificación no encontrada" });
    }

    if (calificacion.id_calificador !== parseInt(calificadorId)) {
      return res.status(403).json({ error: "No autorizado para actualizar esta calificación" });
    }

    // Actualizar la calificación
    const calificacionActualizada = await prisma.calificacion.update({
      where: { id: parseInt(calificacionId) },
      data: {
        comportamiento: comportamiento !== undefined ? comportamiento : calificacion.comportamiento,
        cuidado_vehiculo: cuidadoVehiculo !== undefined ? cuidadoVehiculo : calificacion.cuidado_vehiculo,
        puntualidad: puntualidad !== undefined ? puntualidad : calificacion.puntualidad,
        comentario: comentario !== undefined ? comentario : calificacion.comentario,
      },
      include: {
        calificador: {
          select: {
            id: true,
            nombre: true,
            foto: true,
          },
        },
        calificado: {
          select: {
            id: true,
            nombre: true,
            foto: true,
          },
        },
      },
    });

    res.json(calificacionActualizada);
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
    res.status(500).json({ error: "Error al actualizar calificación" });
  }
};

exports.deleteRenterRating = async (req, res) => {
  try {
    const { calificacionId } = req.params;
    const calificadorId = req.user.id;

    // Verificar que la calificación existe y pertenece al calificador
    const calificacion = await prisma.calificacion.findUnique({
      where: { id: parseInt(calificacionId) },
    });

    if (!calificacion) {
      return res.status(404).json({ error: "Calificación no encontrada" });
    }

    if (calificacion.id_calificador !== parseInt(calificadorId)) {
      return res.status(403).json({ error: "No autorizado para eliminar esta calificación" });
    }

    // Eliminar la calificación
    await prisma.calificacion.delete({
      where: { id: parseInt(calificacionId) },
    });

    res.json({ message: "Calificación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar calificación:", error);
    res.status(500).json({ error: "Error al eliminar calificación" });
  }
};
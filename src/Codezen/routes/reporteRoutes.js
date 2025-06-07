const express = require("express")
const { prisma } = require("../lib/prisma")
const { getUserId } = require("../lib/auth")
const { body, query } = require('express-validator')

const router = express.Router()

// Validaciones
const reporteValidations = [
  body('motivo').isString().trim().isLength({ min: 1, max: 500 }).withMessage('El motivo debe tener entre 1 y 500 caracteres'),
  body('informacion_adicional').optional().isString().trim().isLength({ max: 1000 }).withMessage('La información adicional no puede exceder los 1000 caracteres'),
  body('id_reportado').isInt().withMessage('El ID del usuario reportado es requerido'),
  body('estado').optional().isIn(['PENDIENTE', 'EN_REVISION', 'RESUELTO', 'RECHAZADO']).withMessage('Estado inválido')
]

// GET /api/reportes?reportadoId=...&reportadorId=...
router.get("/", async (req, res) => {
  try {
    const { reportadoId, reportadorId, estado } = req.query

    
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" })
    }

    
    const where = {}
    if (reportadoId) where.id_reportado = Number.parseInt(reportadoId)
    if (reportadorId) where.id_reportador = Number.parseInt(reportadorId)
    if (estado) where.estado = estado

    
    const reportes = await prisma.reporte.findMany({
      where,
      include: {
        reportado: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
        reportador: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: "desc",
      },
    })

    return res.json(reportes)
  } catch (error) {
    console.error("Error al obtener reportes:", error)
    return res.status(500).json({ error: "Error al obtener reportes" })
  }
})

// GET /api/reportes/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" })
    }

    
    const reporte = await prisma.reporte.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        reportado: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
        reportador: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
      },
    })

    if (!reporte) {
      return res.status(404).json({ error: "Reporte no encontrado" })
    }

   
    if (reporte.id_reportador !== Number.parseInt(userId) && reporte.id_reportado !== Number.parseInt(userId)) {
      return res.status(403).json({ error: "No autorizado para ver este reporte" })
    }

    return res.json(reporte)
  } catch (error) {
    console.error("Error al obtener reporte:", error)
    return res.status(500).json({ error: "Error al obtener reporte" })
  }
})

// POST /api/reportes
router.post("/", reporteValidations, async (req, res) => {
  try {
    const { id_reportado, motivo, informacion_adicional } = req.body

    
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" })
    }

    
    const usuarioReportado = await prisma.usuario.findUnique({
      where: { id: Number.parseInt(id_reportado) },
    })

    if (!usuarioReportado) {
      return res.status(404).json({ error: "Usuario reportado no encontrado" })
    }

    
    if (Number.parseInt(id_reportado) === Number.parseInt(userId)) {
      return res.status(400).json({ error: "No puedes reportarte a ti mismo" })
    }

    
    const nuevoReporte = await prisma.reporte.create({
      data: {
        id_reportado: Number.parseInt(id_reportado),
        id_reportador: Number.parseInt(userId),
        motivo,
        informacion_adicional,
        estado: "PENDIENTE",
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      include: {
        reportado: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
        reportador: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
      },
    })

    
    const reportesActivos = await prisma.reporte.count({
      where: {
        id_reportado: Number.parseInt(id_reportado),
        estado: { in: ["PENDIENTE", "EN_REVISION"] }
      }
    })
    if (reportesActivos >= 1) {
      await prisma.usuario.update({
        where: { id: Number.parseInt(id_reportado) },
        data: { estadoBloqueo: "BLOQUEADO" }
      })
    }

    return res.status(201).json(nuevoReporte)
  } catch (error) {
    console.error("Error al crear reporte:", error)
    return res.status(500).json({ error: "Error al crear reporte" })
  }
})

// PUT /api/reportes/:id
router.put("/:id", reporteValidations, async (req, res) => {
  try {
    const { id } = req.params
    const { estado, informacion_adicional } = req.body

   
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" })
    }

    
    const reporte = await prisma.reporte.findUnique({
      where: { id: Number.parseInt(id) },
    })

    if (!reporte) {
      return res.status(404).json({ error: "Reporte no encontrado" })
    }

    
    if (reporte.id_reportador !== Number.parseInt(userId)) {
      return res.status(403).json({ error: "No autorizado para actualizar este reporte" })
    }

    
    const reporteActualizado = await prisma.reporte.update({
      where: { id: Number.parseInt(id) },
      data: {
        informacion_adicional:
          informacion_adicional !== undefined ? informacion_adicional : reporte.informacion_adicional,
        fecha_actualizacion: new Date()
      },
      include: {
        reportado: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
        reportador: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true,
          },
        },
      },
    })

    return res.json(reporteActualizado)
  } catch (error) {
    console.error("Error al actualizar reporte:", error)
    return res.status(500).json({ error: "Error al actualizar reporte" })
  }
})

// DELETE /api/reportes/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Verificar autenticación
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" })
    }

    // Verificar que el reporte existe y pertenece al usuario
    const reporte = await prisma.reporte.findUnique({
      where: { id: Number.parseInt(id) },
    })

    if (!reporte) {
      return res.status(404).json({ error: "Reporte no encontrado" })
    }

    if (reporte.id_reportador !== Number.parseInt(userId)) {
      return res.status(403).json({ error: "No autorizado para eliminar este reporte" })
    }

    // Solo permitir eliminar si el reporte está pendiente
    if (reporte.estado !== "PENDIENTE") {
      return res.status(400).json({ error: "No se puede eliminar un reporte que ya ha sido procesado" })
    }

    // Eliminar reporte
    await prisma.reporte.delete({
      where: { id: Number.parseInt(id) },
    })

    return res.json({ success: true, message: "Reporte eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar reporte:", error)
    return res.status(500).json({ error: "Error al eliminar reporte" })
  }
})

// GET /api/reportes/usuario-bloqueado/:id
router.get('/usuario-bloqueado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number.parseInt(id) },
      select: { estadoBloqueo: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      bloqueado: usuario.estadoBloqueo === 'BLOQUEADO',
      estado: usuario.estadoBloqueo
    });
  } catch (error) {
    console.error('Error al verificar estado de bloqueo:', error);
    return res.status(500).json({ error: 'Error al verificar estado de bloqueo' });
  }
});

module.exports = router

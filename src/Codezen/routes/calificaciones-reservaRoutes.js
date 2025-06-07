const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// Validaciones
const calificacionValidations = [
  body('comportamiento').isInt({ min: 1, max: 5 }).withMessage('La calificación de comportamiento debe estar entre 1 y 5'),
  body('cuidado_vehiculo').isInt({ min: 1, max: 5 }).withMessage('La calificación de cuidado del vehículo debe estar entre 1 y 5'),
  body('puntualidad').isInt({ min: 1, max: 5 }).withMessage('La calificación de puntualidad debe estar entre 1 y 5'),
  body('comentario').optional().isString().trim().isLength({ max: 500 }).withMessage('El comentario no puede exceder los 500 caracteres'),
  body('id_reserva').isInt().withMessage('El ID de la reserva es requerido')
];

router.get('/', authenticateToken, async (req, res) => {
  const { hostId, usuarioId } = req.query;

  try {
    if (hostId) {
      const calificaciones = await prisma.calificacionReserva.findMany({
        where: {
          reserva: {
            Carro: {
              id_usuario_rol: parseInt(hostId)
            },
            Usuario: {
              estadoBloqueo: 'ACTIVO'
            }
          }
        },
        include: {
          reserva: {
            include: {
              Usuario: true,
              Carro: {
                include: {
                  Imagen: true
                }
              }
            }
          }
        }
      });
      return res.json(calificaciones);
    } else if (usuarioId) {
      const calificaciones = await prisma.calificacionReserva.findMany({
        where: {
          reserva: {
            id_usuario: parseInt(usuarioId),
            Usuario: {
              estadoBloqueo: 'ACTIVO'
            }
          }
        },
        include: {
          reserva: {
            include: {
              Carro: {
                include: {
                  Usuario: true
                }
              },
              Usuario: true
            }
          }
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });
      return res.json(calificaciones);
    } else {
      return res.status(400).json({ error: 'Falta hostId o usuarioId en la consulta' });
    }
  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

router.get('/count-pending-host', authenticateToken, async (req, res) => {
  const { hostId } = req.query; 

  
  if (!hostId || isNaN(parseInt(hostId))) {
    return res.status(400).json({ error: 'ID de host inválido o faltante en la consulta.' });
  }

  const parsedHostId = parseInt(hostId); 

  
  if (req.user && req.user.id !== parsedHostId) {
      return res.status(403).json({ error: 'Acceso denegado. No puedes ver las calificaciones pendientes de otro host.' });
  }

  try {
   
    console.log(`GET /count-pending-host para hostId: ${parsedHostId}`); 

    
    const countPendientesDirect = await prisma.reserva.count({
      where: {
        Carro: {
          id_usuario_rol: parsedHostId
        },
        fecha_fin: {
          lt: new Date()
        },
        calificaciones: {
          none: {} 
        }
      }
    });

    console.log(`Resultado directo de prisma.reserva.count: ${countPendientesDirect}`); 

    
    const reservasPendientesFindMany = await prisma.reserva.findMany({
      where: {
        Carro: {
          id_usuario_rol: parsedHostId
        },
        fecha_fin: {
          lt: new Date()
        },
        calificaciones: {
          none: {} 
        }
      },
      select: { 
          id: true,
          fecha_fin: true,
          Carro: { select: { id: true, marca: true, modelo: true } },
      }
    });

    console.log(`Resultado de prisma.reserva.findMany (${reservasPendientesFindMany.length} reservas encontradas):`, reservasPendientesFindMany); // Log del findMany

    
    console.log(`Conteo final devuelto al frontend: ${countPendientesDirect}`);
    return res.json({ count: countPendientesDirect });

  } catch (error) {
    console.error('Error al contar calificaciones pendientes para host:', error);
    
    return res.status(500).json({ error: 'Error al contar calificaciones pendientes' });
  }
});


router.post('/', authenticateToken, calificacionValidations, async (req, res) => {
  try {
    const { 
      comportamiento, 
      cuidado_vehiculo, 
      puntualidad, 
      comentario, 
      id_reserva 
    } = req.body;

    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id_reserva) },
      include: { Carro: true }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.Carro.id_usuario_rol !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para calificar esta reserva' });
    }

    const nuevaCalificacion = await prisma.calificacionReserva.create({
      data: {
        comportamiento,
        cuidado_vehiculo,
        puntualidad,
        comentario,
        fecha_creacion: new Date(),
        reserva: {
          connect: {
            id: parseInt(id_reserva)
          }
        }
      },
      include: {
        reserva: {
          include: {
            Usuario: true
          }
        }
      }
    });

    res.status(201).json(nuevaCalificacion);
  } catch (error) {
    console.error('Error al crear calificación:', error);
    res.status(500).json({ 
      error: 'Error al crear calificación',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar calificación existente
router.put('/:id', authenticateToken, [
  body('comportamiento').optional().isInt({ min: 1, max: 5 }),
  body('cuidado_vehiculo').optional().isInt({ min: 1, max: 5 }),
  body('puntualidad').optional().isInt({ min: 1, max: 5 }),
  body('comentario').optional().isString().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      comportamiento, 
      cuidado_vehiculo, 
      puntualidad, 
      comentario 
    } = req.body;

    const calificacionExistente = await prisma.calificacionReserva.findUnique({
      where: { id: parseInt(id) },
      include: {
        reserva: {
          include: {
            Carro: true
          }
        }
      }
    });

    if (!calificacionExistente) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    if (calificacionExistente.reserva.Carro.id_usuario_rol !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta calificación' });
    }

    const calificacionActualizada = await prisma.calificacionReserva.update({
      where: {
        id: parseInt(id)
      },
      data: {
        comportamiento,
        cuidado_vehiculo,
        puntualidad,
        comentario
      },
      include: {
        reserva: {
          include: {
            Usuario: true
          }
        }
      }
    });

    res.json(calificacionActualizada);
  } catch (error) {
    console.error('Error al actualizar calificación:', error);
    res.status(500).json({ 
      error: 'Error al actualizar calificación',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar calificación
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);

    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'ID de calificación inválido' });
    }

    // Verificar si la calificación existe y pertenece al usuario
    const calificacionExistente = await prisma.calificacionReserva.findUnique({
      where: { id: idNum },
      include: {
        reserva: {
          include: {
            Carro: true
          }
        }
      }
    });

    if (!calificacionExistente) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
     if (calificacionExistente.reserva.Carro.id_usuario_rol !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta calificación' });
    }

    await prisma.calificacionReserva.delete({
      where: { id: idNum }
    });

   
    if (calificacionExistente.reserva && calificacionExistente.reserva.id) {
        const remainingRatingsCount = await prisma.calificacionReserva.count({
      where: {
                id_reserva: calificacionExistente.reserva.id
            }
        });
        console.log(`DEBUG DELETE: Después de eliminar calificación ${calificacionExistente.id}, quedan ${remainingRatingsCount} calificaciones para la reserva ${calificacionExistente.reserva.id}`);
        
        
        console.log(`DEBUG DELETE: Fecha de fin de la reserva ${calificacionExistente.reserva.id}: ${calificacionExistente.reserva.fecha_fin}`);
       
    }
   

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar calificación:', error);
    res.status(500).json({ 
      error: 'Error al eliminar calificación',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 
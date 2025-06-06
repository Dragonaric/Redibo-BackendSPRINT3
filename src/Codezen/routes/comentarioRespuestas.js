const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();

// GET - Obtener comentarios de calificaciones de reservas para un usuario
router.get('/comentarioCadena', authenticateToken, async (req, res) => {
  const { idusuario } = req.query;

  if (!idusuario) {
    return res.status(400).json({ error: 'Falta el parámetro idusuario en la consulta' });
  }

  try {
    // Corregido: CalificacionReserva en lugar de califiacionReserva
    const comentarios = await prisma.calificacionReserva.findMany({
      where: {
        reserva: {
          id_carro: {
            in: await prisma.carro.findMany({
              where: { id_usuario_rol: parseInt(idusuario) },
              select: { id: true }
            }).then(carros => carros.map(c => c.id))
          }
        }
      },
      include: {
        reserva: {
          include: {
            Carro: true,
            Usuario: true
          }
        },
         comentariosRespuesta: {
          include: {
            respuestaPadre: true,
            respuestasHijas: {
              include: {
                respuestasHijas: {
                  include: {
                    respuestasHijas: {
                  include: {
                    respuestasHijas: {
                  include: {
                    respuestasHijas: true
                  }
                }
                  }
                }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    return res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

router.get('/comentario', authenticateToken, async (req, res) => {
  try {
    const comentariosRespuesta = await prisma.comentarioRespuesta.findMany({
      include: {
        respuestaPadre: true,
        respuestasHijas: true,
      },
      orderBy: {
        id: 'asc', // o fecha_creacion si tienes ese campo
      }
    })

    return res.json(comentariosRespuesta)
  } catch (error) {
    console.error('Error al obtener comentarioRespuestas:', error)
    return res.status(500).json({ error: 'Error al obtener comentarioRespuestas' })
  }
})

// POST - Crear una nueva respuesta a un comentario
router.post('/comentario', authenticateToken, [
  body('comentario').isString().notEmpty().withMessage('El comentario no puede estar vacío')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { comentario, respuestaPadreId } = req.body

  try {
    if (respuestaPadreId) {
      const padre = await prisma.comentarioRespuesta.findUnique({
        where: { id: respuestaPadreId }
      })

      if (!padre) {
        return res.status(404).json({ error: 'Comentario padre no encontrado' })
      }
    }

    const nuevoComentario = await prisma.comentarioRespuesta.create({
      data: {
        comentario,
        respuestaPadreId
      },
      include: {
        respuestaPadre: true
      }
    })

    res.status(201).json(nuevoComentario)
  } catch (error) {
    console.error('Error al crear comentario:', error)
    res.status(500).json({ error: 'Error al crear comentario' })
  }
})



// PUT - Actualizar un comentario existente
router.put('/comentario/:id', authenticateToken, [
  body('comentario')
    .isString()
    .notEmpty()
    .withMessage('El comentario no puede estar vacío')
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder los 500 caracteres')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { id } = req.params
  const { comentario } = req.body

  try {
    const comentarioExistente = await prisma.comentarioRespuesta.findUnique({
      where: { id: parseInt(id) }
    })

    if (!comentarioExistente) {
      return res.status(404).json({ error: 'Comentario no encontrado' })
    }

    const comentarioActualizado = await prisma.comentarioRespuesta.update({
      where: { id: parseInt(id) },
      data: {
        comentario
      }
    })

    return res.json(comentarioActualizado)
  } catch (error) {
    console.error('Error al actualizar el comentario:', error)
    return res.status(500).json({ error: 'Error al actualizar el comentario' })
  }
})


// Función auxiliar para eliminar comentarios anidados
async function eliminarComentariosAnidados(idComentario) {
  // Buscar todos los comentarios hijos
  const comentariosHijos = await prisma.comentarioRespuesta.findMany({
    where: { respuestaPadreId: idComentario }
  });

  // Recursivamente eliminar cada comentario hijo
  for (const hijo of comentariosHijos) {
    await eliminarComentariosAnidados(hijo.id);
  }

  // Finalmente eliminar el comentario actual
  await prisma.comentarioRespuesta.delete({
    where: { id: idComentario }
  });
}

// DELETE - Eliminar un comentario y sus respuestas anidadas
router.delete('/comentario/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const comentario = await prisma.comentarioRespuesta.findUnique({
      where: { id: parseInt(id) },
      include: {
        calificacionReserva: {
          include: {
            reserva: true
          }
        }
      }
    });

    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar permisos: el usuario debe ser el dueño del carro o el que hizo la reserva
    const esHost = comentario.calificacionReserva.reserva.id_carro === req.user.id;
    const esRenter = comentario.calificacionReserva.reserva.id_usuario === req.user.id;

    if (!esHost && !esRenter) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    // Eliminar comentario y sus respuestas anidadas
    await eliminarComentariosAnidados(comentario.id);

    return res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    return res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

// GET - Obtener comentarios específicos de una calificación de reserva
router.get('/calificacion/:calificacionId', authenticateToken, async (req, res) => {
  const { calificacionId } = req.params;

  try {
    const comentarios = await prisma.comentarioRespuesta.findMany({
      where: {
        calreserId: parseInt(calificacionId),
        respuestaPadreId: null // Solo comentarios raíz
      },
      include: {
        respuestasHijas: {
          include: {
            respuestasHijas: {
              include: {
                respuestasHijas: true
              }
            }
          }
        },
        calificacionReserva: {
          include: {
            reserva: {
              include: {
                Usuario: {
                  select: { id: true, nombre: true, foto: true }
                },
                Carro: {
                  select: { id: true, marca: true, modelo: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios de calificación:', error);
    return res.status(500).json({ error: 'Error al obtener comentarios de calificación' });
  }
});

router.get('/comentarioCadenaRenter', authenticateToken, async (req, res) => { 
  const { idusuario } = req.query;

  if (!idusuario) {
    return res.status(400).json({ error: 'Falta el parámetro idusuario en la consulta' });
  }

  try {
    const comentarios = await prisma.calificacionReserva.findMany({
      where: {
        reserva: {
          id_usuario: parseInt(idusuario) // Aquí está el cambio
        }
      },
      include: {
        reserva: {
          include: {
            Carro:{
              include: {Usuario:true}
            },
            Usuario: true
          }
        },
        comentariosRespuesta: {
          include: {
            respuestaPadre: true,
            respuestasHijas: {
              include: {
                respuestasHijas: {
                  include: {
                    respuestasHijas: {
                      include: {
                        respuestasHijas: {
                          include: {
                            respuestasHijas: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    return res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});


router.post('/comentarioRenter', authenticateToken, [
  body('comentario').isString().notEmpty().withMessage('El comentario no puede estar vacío')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const { comentario, calreserId } = req.body
  try {
    if (calreserId) {
      const padre = await prisma.calificacionReserva.findUnique({
        where: { id: calreserId }
      })
      if (!padre) {
        return res.status(404).json({ error: 'Comentario padre no encontrado' })
      }
    }
    const nuevoComentario = await prisma.comentarioRespuesta.create({
      data: {
        comentario,
        calreserId // Asegurarse de que calreserId sea un número
      }
    })
    res.status(201).json(nuevoComentario)
  } catch (error) {
    console.error('Error al crear comentario:', error)
    res.status(500).json({ error: 'Error al crear comentario' })
  }
})

module.exports = router;
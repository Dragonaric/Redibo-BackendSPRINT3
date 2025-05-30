const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { query } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// Obtener reservas completadas por host
router.get('/completadas', authenticateToken, [
  query('hostId').isInt().withMessage('El ID del host es requerido')
], async (req, res) => {
  try {
    const { hostId } = req.query;

    // Verificar si el usuario tiene permiso para ver estas reservas
    if (parseInt(hostId) !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver estas reservas' });
    }

    const reservas = await prisma.reserva.findMany({
      where: {
        Carro: {
          id_usuario_rol: parseInt(hostId)
        },
        estado: {
          in: ['COMPLETADA']
        }
      },
      include: {
        Usuario: true,
        Carro: {
          include: {
            Imagen: true
          }
        }
      },
      orderBy: {
        fecha_fin: 'desc'
      }
    });

    res.json(reservas);
  } catch (error) {
    console.error('Error al obtener reservas completadas y pendientes:', error);
    res.status(500).json({ 
      error: 'Error al obtener reservas completadas y pendientes',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/', authenticateToken, [
  query('hostId').isInt().withMessage('El ID del host es requerido'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1 }).withMessage('El límite debe ser un número entero positivo'),
  query('estado').optional().isString().isIn(['PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']).withMessage('Estado de reserva inválido')
], async (req, res) => {
  try {
    const { hostId, page = 1, limit = 10, estado } = req.query; 
    const hostIdNum = parseInt(hostId);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    
    if (hostIdNum !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver estas reservas' });
    }

   
    const whereClause = {
      Carro: {
        id_usuario_rol: hostIdNum
      },
    };

    
    if (estado) {
      whereClause.estado = estado; 
    }

    
    const reservas = await prisma.reserva.findMany({
      where: whereClause,
      include: {
        Usuario: true,
        Carro: {
          include: {
            Imagen: true
          }
        }
      },
      orderBy: {
        fecha_fin: 'desc' 
      },
      skip: skip,
      take: limitNum
    });

    
    const totalReservas = await prisma.reserva.count({
        where: whereClause
    });

    
    res.json({ reservas, total: totalReservas });

  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ 
      error: 'Error al obtener reservas',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


router.get('/proximas/:hostId', authenticateToken, async (req, res) => {
  try {
    const { hostId } = req.params;
    const hostIdNum = parseInt(hostId, 10);

    if (isNaN(hostIdNum)) {
      return res.status(400).json({ error: "ID de host inválido", details: "El ID debe ser un número" });
    }

    
    if (hostIdNum !== req.user.id) {
      
      return res.status(403).json({ error: 'No tienes permiso para ver estas reservas' });
    }

    const proximasReservas = await prisma.reserva.count({
      where: {
        Carro: {
          id_usuario_rol: hostIdNum
        },
        estado: {
          notIn: ['COMPLETADA', 'CANCELADA']
        },
        OR: [
          { fecha_fin: { gte: new Date() } }, 
          { fecha_inicio: { gte: new Date() } } 
        ]
      },
    });

    res.json({ count: proximasReservas });
  } catch (error) {
    console.error('Error al obtener próximas reservas:', error);
    res.status(500).json({ 
      error: 'Error al obtener próximas reservas',
      details: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : null
    });
  }
});

module.exports = router; 
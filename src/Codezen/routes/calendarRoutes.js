const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { month, year, vehicleId } = req.query;
    const userId = req.user.id;

    const monthNum = parseInt(month);
    const yearNum = parseInt(year || new Date().getFullYear());
    
    if (isNaN(monthNum)) {
      return res.status(400).json({ error: 'El mes es requerido' });
    }

    if (monthNum < 0 || monthNum > 11) {
      return res.status(400).json({ error: 'El mes debe estar entre 0 (Enero) y 11 (Diciembre)' });
    }

    if (isNaN(yearNum)) {
      return res.status(400).json({ error: 'El año debe ser un número válido' });
    }

    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const vehicles = await prisma.carro.findMany({
      where: {
        id_usuario_rol: userId,
        ...(vehicleId && vehicleId !== 'all' ? { id: parseInt(vehicleId) } : {})
      },
      select: {
        id: true,
        marca: true,
        modelo: true,
        placa: true,
        estado: true,
        precio_por_dia: true,
        disponible_desde: true,
        disponible_hasta: true,
        Imagen: {
          take: 1,
          select: {
            data: true
          }
        }
      }
    });

    const reservations = await prisma.reserva.findMany({
      where: {
        id_carro: {
          in: vehicles.map(v => v.id)
        },
        OR: [
          {
            fecha_inicio: { lte: endDate },
            fecha_fin: { gte: startDate }
          }
        ]
      },
      select: {
        id: true,
        id_carro: true,
        estado: true,
        fecha_inicio: true,
        fecha_fin: true,
        Usuario: {
          select: {
            nombre: true,
            telefono: true
          }
        }
      }
    });

    const response = {
      vehicles: vehicles.map(vehicle => ({
        ...vehicle,
        imagen: vehicle.Imagen[0]?.data || '/placeholder-car.jpg',
        Imagen: undefined 
      })),
      reservations,
      statusConfig: {
        DISPONIBLE: { color: 'bg-green-500', text: 'Disponible' },
        RESERVADO: { color: 'bg-blue-500', text: 'Reservado' },
        PENDIENTE: { color: 'bg-yellow-500', text: 'Pendiente' },
        MANTENIMIENTO: { color: 'bg-red-500', text: 'Mantenimiento' },
        NO_DISPONIBLE: { color: 'bg-gray-300', text: 'No Disponible' }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener datos del calendario:', error);
    res.status(500).json({ 
      error: 'Error al obtener datos del calendario',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
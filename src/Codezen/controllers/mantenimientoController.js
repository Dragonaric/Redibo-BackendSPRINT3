const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notificarMantenimientosVencidos } = require('../lib/prisma');

exports.getMantenimientosVencidos = async (req, res) => {
  console.log('Entrando al controlador getMantenimientosVencidos');
  const ahora = new Date();
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const mantenimientos = await prisma.mantenimiento.findMany({
      where: {
        fecha_vencimiento: { lt: ahora },
        completado: false,
        Carro: {
          id_usuario_rol: userId
        }
      },
      include: {
        Carro: true
      }
    });
    res.json(mantenimientos);
  } catch (error) {
    console.error('Error al obtener mantenimientos vencidos por usuario:', error);
    res.status(500).json({ error: 'Error al obtener mantenimientos vencidos' });
  }
};

exports.notificarMantenimientos = async (req, res) => {
  try {
    await notificarMantenimientosVencidos();
    res.json({ success: true, message: 'Notificaciones enviadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar notificaciones' });
  }
}; 
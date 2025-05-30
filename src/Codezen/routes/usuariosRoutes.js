const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { param } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const prisma = new PrismaClient();

// Obtener detalles de un usuario específico
router.get('/:id', authenticateToken, [
  param('id').isInt().withMessage('ID de usuario inválido')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        ciudad: {
          select: {
            nombre: true,
            Pais: {
              select: {
                nombre: true
              }
            }
          }
        },
        roles: {
          select: {
            rol: {
              select: {
                rol: true
              }
            }
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No enviar información sensible
    const { contraseña, google_id, ...usuarioSinDatosSensibles } = usuario;
    res.json(usuarioSinDatosSensibles);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuario',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 
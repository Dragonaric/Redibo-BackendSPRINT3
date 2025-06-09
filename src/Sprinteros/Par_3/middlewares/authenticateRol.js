// src/middlewares/authenticateRol.js

const { PrismaClient } = require('@prisma/client');
const { authenticateToken: authMiddlewareToken } = require('../../../middlewares/authMiddleware');
require('dotenv').config();

const prisma = new PrismaClient();

async function authenticateToken(req, res, next) {
  // -------------------------------------------------------------------------------------------------
  // Paso 1: Delegar al middleware antiguo para DESCIFRAR el JWT y dejar en req.user la info decodificada.
  // -------------------------------------------------------------------------------------------------
  authMiddlewareToken(req, res, async (authError) => {
    // Si authMiddlewareToken ya contestó (401/403), no seguimos.
    // Ejemplo: token ausente, expirado o inválido.
    if (authError) {
      return;
    }

    // En este punto, authMiddlewareToken ya hizo:
    //    req.user = { id: <el valor que vino en payload>, ... }
    // y no ha enviado respuesta HTTP (sigue en esta función callback).
    // Por tanto, tenemos el userId en req.user.id.

    const userId = req.user && req.user.id;
    if (!userId) {
      // Por seguridad, si por algún motivo no existiera req.user.id:
      return res
        .status(401)
        .json({ success: false, message: 'Token válido pero no trae id de usuario.' });
    }

    // -----------------------------------------------------------------------
    // Paso 2: Buscar en la base de datos si ese userId tiene el rol "HOST".
    // -----------------------------------------------------------------------
    try {
      // a) Obtener el ID numérico del rol "HOST" (tabla Rol).
      const hostRol = await prisma.rol.findFirst({
        where: { rol: 'HOST' },
        select: { id: true },
      });

      if (!hostRol) {
        // Si no existe la fila con rol = 'HOST', es un error de configuración.
        return res
          .status(500)
          .json({ success: false, message: 'El rol "HOST" no está configurado en la BD.' });
      }

      // b) Verificar si existe un registro en UsuarioRol con id_usuario = userId y id_rol = hostRol.id
      const usuarioRole = await prisma.usuarioRol.findFirst({
        where: {
          id_usuario: userId,
          id_rol: hostRol.id,
        },
      });

      if (!usuarioRole) {
        // El JWT era válido, pero el usuario no tiene el rol HOST → acceso denegado.
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado: se requiere rol HOST.' });
      }

      // ----------------------------------------------------------------------------
      // Paso 3: Todo OK: dejamos en req.user.id_usuario el ID que necesitamos los controllers
      // ----------------------------------------------------------------------------
      // Si prefieres, puedes renombrarlo para que quede más explícito:
      req.user = { id_usuario: userId };
      next();
    } catch (dbError) {
      console.error('Error al verificar rol HOST en BD:', dbError);
      return res
        .status(500)
        .json({ success: false, message: 'Error interno al verificar rol en BD.' });
    }
  });
}

module.exports = authenticateToken;

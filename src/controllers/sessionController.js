const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserInfo = async (req, res) => {
  try {
    const id = req.user.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        nombre: true,
        foto: true,
        estadoConductor: true,
        roles: {
          select: {
            rol: {
              select: {
                rol: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const roles = usuario.roles.map((r) => r.rol.rol);

    return res.json({
      nombre: usuario.nombre,
      foto: usuario.foto,
      estadoConductor: usuario.estadoConductor,
      roles: roles,
    });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getUserInfo,
};

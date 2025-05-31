
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getTransacciones = async (req, res) => {
  try {

    const transacciones = await prisma.transaccion.findMany({
      orderBy: { createdAt: "desc" },
      where: { estado: "PENDIENTE" },
      include: {
        usuario: {
          select: {
            nombre: true,
            foto: true,
            saldo: true,

          },
        },
      },
    });

    return res.json(transacciones);
  } catch (error) { 
    console.error("Error al obtener transacciones:", error);
    return res.status(500).json({ error: "Error del servidor" });
  } 

}
module.exports = { getTransacciones};

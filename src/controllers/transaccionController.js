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
};

const aceptarTransaccion = async (req, res) => {
  const { id } = req.params;

  try {
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: id },
      select: {
        tipo: true,
        monto: true,
        userId: true,
      },
    });

    if (!transaccion)
      return res.status(404).json({ error: "Transacción no encontrada" });

    if (transaccion.tipo === "SUBIDA") {
      await prisma.usuario.update({
        where: { id: transaccion.userId },
        data: {
          saldo: {
            increment: transaccion.monto,
          },
        },
      });

      await prisma.transaccion.update({
        where: { id: id },
        data: {
          estado: "COMPLETADA",
        },
      });
      return res.json({
        mensaje: "Transacción aceptada exitosamente",
        transaccion,
      });
    }

    await prisma.transaccion.update({
      where: { id: id },
      data: {
        estado: "COMPLETADA",
      },
    });

    return res.json({
      mensaje: "Transacción aceptada exitosamente",
      transaccion,
    });
  } catch (error) {
    console.error("Error al aceptar transacción:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

const rechazarTransaccion = async (req, res) => {
  const { id } = req.params;

  try {
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: id },
      select: {
        userId: true,
        monto: true,
        tipo: true,
      },
    });

    if (!transaccion)
      return res.status(404).json({ error: "Transacción no encontrada" });

    if (transaccion.tipo === "SUBIDA") {
      await prisma.transaccion.update({
        where: { id: id },
        data: {
          estado: "RECHAZADA",
        },
      });
      return res.json({
        mensaje: "Transacción rechazada exitosamente",
        transaccion,
      });
    }

    await prisma.transaccion.update({
      where: { id: id },
      data: {
        estado: "RECHAZADA",
      },
    });
    await prisma.usuario.update({
      where: { id: transaccion.userId },
      data: {
        saldo: {
          increment: transaccion.monto,
        },
      },
    });
    return res.json({
      mensaje: "Transacción rechazada exitosamente",
      transaccion,
    });
  } catch (error) {
    console.error("Error al rechazar transacción:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = { getTransacciones, aceptarTransaccion, rechazarTransaccion };

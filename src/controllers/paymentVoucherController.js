const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Endpoint para obtener órdenes de pago completadas
exports.getOrdenesCompletadas = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const ordenesCompletadas = await prisma.ordenPago.findMany({
      where: { 
        estado: "COMPLETADO",
        OR: [
          { id_usuario_host: userId },
          { id_usuario_renter: userId }
        ]
      },
      orderBy: { fecha_de_emision: "desc" },
      include: {
        host: {
          select: {
            nombre: true,
            foto: true,
          },
        },
        renter: {
          select: {
            nombre: true,
            foto: true,
          },
        },
        carro: {
          select: {
            marca: true,
            modelo: true,
          },
        },
        ComprobanteDePago: {
          select: {
            id: true,
            fecha_emision: true,
            numero_transaccion: true,
            saldo: true,
          },
        },
      },
    });

    return res.json(ordenesCompletadas);
  } catch (error) {
    console.error("Error al obtener órdenes completadas:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// Endpoint para obtener transacciones completadas (RETIRO o SUBIDA)
exports.getTransaccionesCompletadas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo } = req.query;
    
    if (!tipo || !["RETIRO", "SUBIDA"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de transacción inválido" });
    }

    const transaccionesCompletadas = await prisma.transaccion.findMany({
      where: { 
        estado: "COMPLETADA",
        tipo: tipo,
        userId: userId
      },
      orderBy: { createdAt: "desc" },
      include: {
        usuario: {
          select: {
            nombre: true,
            foto: true,
          },
        },
      },
    });

    return res.json(transaccionesCompletadas);
  } catch (error) {
    console.error("Error al obtener transacciones completadas:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// Endpoint para obtener detalles específicos de una orden de pago
exports.getDetallesOrdenPago = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ordenId } = req.params;

    const ordenDetalle = await prisma.ordenPago.findFirst({
      where: { 
        id: parseInt(ordenId),
        estado: "COMPLETADO",
        OR: [
          { id_usuario_host: userId },
          { id_usuario_renter: userId }
        ]
      },
      include: {
        host: {
          select: {
            id: true,
            nombre: true,
            foto: true,
            correo: true,
          },
        },
        renter: {
          select: {
            id: true,
            nombre: true,
            foto: true,
            correo: true,
          },
        },
        carro: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            año: true,
            placa: true,
          },
        },
        ComprobanteDePago: {
          select: {
            id: true,
            fecha_emision: true,
            numero_transaccion: true,
            saldo: true,
          },
        },
      },
    });

    if (!ordenDetalle) {
      return res.status(404).json({ error: "Orden de pago no encontrada" });
    }

    return res.json(ordenDetalle);
  } catch (error) {
    console.error("Error al obtener detalles de orden:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// Endpoint para obtener detalles específicos de una transacción
exports.getDetallesTransaccion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transaccionId } = req.params;

    const transaccionDetalle = await prisma.transaccion.findFirst({
      where: { 
        id: transaccionId,
        estado: "COMPLETADA",
        userId: userId
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            foto: true,
            correo: true,
          },
        },
      },
    });

    if (!transaccionDetalle) {
      return res.status(404).json({ error: "Transacción no encontrada" });
    }

    return res.json(transaccionDetalle);
  } catch (error) {
    console.error("Error al obtener detalles de transacción:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};
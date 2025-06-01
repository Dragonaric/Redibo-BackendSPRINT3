const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

function generarCodigoOrdenPago() {
    return `ORD-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
}

exports.createPaymentOrder = async (req, res) => {
  try {
    const { id_carro, id_usuario_host, id_usuario_renter, monto_a_pagar } = req.body;

    // Validar que se recibieron los datos necesarios
    if (!id_carro || !id_usuario_host || !id_usuario_renter || !monto_a_pagar) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }
    // si los numeros recibidos no son enteros convertirlos
    const idCarro = parseInt(id_carro);
    const idUsuarioHost = parseInt(id_usuario_host);
    const idUsuarioRenter = parseInt(id_usuario_renter);
    const montoAPagar = parseFloat(monto_a_pagar);
    if (isNaN(idCarro) || isNaN(idUsuarioHost) || isNaN(idUsuarioRenter) || isNaN(montoAPagar)) {
      return res.status(400).json({ error: 'Los datos deben ser números enteros' });
    }

    const codigo = generarCodigoOrdenPago();
    // Crear la orden de pago
    const ordenPago = await prisma.ordenPago.create({
      data: {
        codigo: codigo,
        id_usuario_host: idUsuarioHost,
        id_usuario_renter: idUsuarioRenter,
        id_carro: idCarro,
        monto_a_pagar: montoAPagar
      },
    });
    return res.status(201).json(ordenPago);
  } catch (error) {
    console.error('Error al crear la orden de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.RegisterTransactionNumber = async (req, res) => {
  try {
    const { codigo_orden_pago, numero_transaccion, monto_a_pagar } = req.body;
    // Validar que se recibieron los datos necesarios
    if (!codigo_orden_pago || !numero_transaccion || !monto_a_pagar) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }
    
    // verificar que el numero sea un string
    const numeroTransaccion = String(numero_transaccion);
    
    // Actualizar el estado de la orden de pago a "PROCESANDO"
    await prisma.ordenPago.update({
      where: {
        codigo: codigo_orden_pago
      },
      data: {
        estado: 'PROCESANDO'
      }
    });
    // Crear el comprobante de pago
    const comprobantePago = await prisma.ComprobanteDePago.create({
      data: {
        OrdenPago: {
          connect: {
            codigo: codigo_orden_pago
          }
        },
        numero_transaccion: numeroTransaccion,
        saldo: monto_a_pagar
      },
    });
    

    return res.status(201).json(comprobantePago);
  } catch (error) {
    console.error('Error al crear el comprobante de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

exports.PayWithBalance = async (req, res) => {
  try {
    const { codigo_orden_pago } = req.body;
    const userId = req.user.id;

    if (!codigo_orden_pago) {
      return res.status(200).json({ error: 'Código de orden de pago requerido' });
    }

    const ordenPago = await prisma.ordenPago.findUnique({
      where: {
        codigo: codigo_orden_pago
      }
    });

    if (!ordenPago) {
      return res.status(200).json({ error: 'Orden de pago no encontrada' });
    }

    if (ordenPago.estado !== 'PENDIENTE') {
      return res.status(200).json({ error: 'La orden de pago no está en estado pendiente' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: userId
      },
      select: {
        saldo: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.saldo < ordenPago.monto_a_pagar) {
      return res.status(200).json({ 
        error: 'Saldo insuficiente',
        saldo_actual: usuario.saldo,
        monto_requerido: ordenPago.monto_a_pagar
      });
    }

    // Generar número de transacción único para pago con saldo
    const numeroTransaccion = `SALDO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await prisma.usuario.update({
      where: {
        id: userId
      },
      data: {
        saldo: {
          decrement: ordenPago.monto_a_pagar
        }
      }
    });

    await prisma.ordenPago.update({
      where: {
        codigo: codigo_orden_pago
      },
      data: {
        estado: 'COMPLETADO',
      }
    });

    const comprobantePago = await prisma.comprobanteDePago.create({
      data: {
        id_orden: ordenPago.id,
        numero_transaccion: numeroTransaccion,
        saldo: ordenPago.monto_a_pagar
      }
    });

    return res.status(200).json({
      message: 'Pago procesado exitosamente',
      comprobante: comprobantePago,
      nuevo_saldo: usuario.saldo - ordenPago.monto_a_pagar
    });

  } catch (error) {
    console.error('Error al procesar pago con saldo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getListPaymentOrders = async (req, res) => {
  try {
    const id_usuario = req.user.id;
    // Validar que se recibieron los datos necesarios
    if (!id_usuario) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }
    // si los numeros recibidos no son enteros convertirlos
    const idUsuario = parseInt(id_usuario);
    if (isNaN(idUsuario)) {
      return res.status(400).json({ error: 'El id de la orden de pago debe ser un número entero' });
    }
    // Obtener la lista de órdenes de pago
    const ordenes = await prisma.ordenPago.findMany({
      where: { id_usuario_renter: idUsuario },
      include: {
        host:  { select: { nombre: true } },   // Usuario host
        carro: { select: { placa: true } },  // Carro
      }
    });


    const ordenesFormateadas = ordenes.map(({ 
        codigo, 
        monto_a_pagar, 
        estado, 
        host: { nombre }, 
        carro: { placa } 
      }) => ({
        codigo,
        monto_a_pagar,
        estado,
        nombre,
        placa
    }));
    return res.status(200).json(ordenesFormateadas);
  } catch (error) {
    console.error('Error al obtener la lista de órdenes de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}


exports.getInfoPaymentOrderbyCode = async (req, res) => {
  try {
    const { codigo } = req.body;

    // Validar que se recibieron los datos necesarios
    if (!codigo) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }
    
    // Obtener la lista de órdenes de pago
    const orden = await prisma.ordenPago.findUnique({
      where: { codigo: codigo },
      include: {
        host:  { select: { nombre: true, telefono: true, correo: true } },   // Usuario host
        carro: { select: { placa: true, marca: true , modelo: true } },  // Carro
      }
    });

    // Destructuramos y formateamos
    const {
      codigo: codigoOrd,
      monto_a_pagar,
      estado,
      host:   { nombre, telefono, correo },
      carro:  { placa, marca, modelo }
    } = orden;

    return res.status(200).json({
      codigo:       codigoOrd,
      monto_a_pagar,
      estado,
      nombre,
      telefono,
      correo,
      placa,
      marca,
      modelo
    });
    return res.status(200).json(ordenesFormateadas);
  } catch (error) {
    console.error('Error al obtener la lista de órdenes de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

//ADMIN
exports.getListProcessingOrders = async (req, res) => {
  try {
    const id_usuario = req.user.id;
    // Validar que se recibieron los datos necesarios
    if (!id_usuario) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }
    // si los numeros recibidos no son enteros convertirlos
    const idUsuario = parseInt(id_usuario);
    if (isNaN(idUsuario)) {
      return res.status(400).json({ error: 'El id de la orden de pago debe ser un número entero' });
    }
    const tieneAcceso = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        id: true,
        roles: {
          where: { rol: { rol: 'ADMIN' } }, // Filtro directo en la relación
          select: { id: true }
        }
      }
    });
    if (tieneAcceso.roles.length === 0) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Obtener la lista de órdenes de pago
    const ordenes = await prisma.ordenPago.findMany({
      where: { estado: 'PROCESANDO' },
      include: {
        renter: { select: { nombre: true } },
        host: { select: { nombre: true } },
        ComprobanteDePago: {
          take: 1,    // solo el primer comprobante
          select: {
            numero_transaccion: true,
            fecha_emision:      true
          }
        }
      }
    });

    const ordenesFormateadas = ordenes.map(o => ({
      codigo:             o.codigo,
      monto_a_pagar:      o.monto_a_pagar,
      estado:             o.estado,
      renter:             o.renter.nombre,
      host:               o.host.nombre,
      numero_transaccion: o.ComprobanteDePago[0]?.numero_transaccion ?? null,
      fecha_emision:      o.fecha_de_emision ?? null,
    }));
    return res.status(200).json(ordenesFormateadas);
  } catch (error) {
    console.error('Error al obtener la lista de órdenes de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

exports.getProcessingOrderDetails = async (req, res) => {
  try {
    const id_usuario = req.user.id;
    const { codigo } = req.body;

    if (!id_usuario || !codigo) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }

    const idUsuario = parseInt(id_usuario);
    if (isNaN(idUsuario)) {
      return res.status(400).json({ error: 'El id del usuario debe ser un número entero' });
    }
    
    const tieneAcceso = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        id: true,
        roles: {
          where: { rol: { rol: 'ADMIN' } },
          select: { id: true }
        }
      }
    });
    
    if (!tieneAcceso || tieneAcceso.roles.length === 0) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const orden = await prisma.ordenPago.findFirst({
      where: { codigo: codigo },
      include: {
        renter: { 
          select: { 
            nombre: true,
            id: true 
          } 
        },
        host: { 
          select: { 
            nombre: true,
            id: true 
          } 
        },
        ComprobanteDePago: {
          select: {
            numero_transaccion: true,
            fecha_emision: true,
            id: true
          }
        }
      }
    });
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden de pago no encontrada' });
    }

    return res.status(200).json(orden);
    
  } catch (error) {
    console.error('Error al obtener detalles de la orden de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

exports.UpdateStatePaymentOrder = async (req, res) => {
  try {
    const { codigo_orden_pago, estado } = req.body;
    // Validar que se recibieron los datos necesarios
    if (!codigo_orden_pago || !estado) {
      return res.status(400).json({ error: 'Faltan datos necesarios' });
    }
    const idUsuario = parseInt(req.user.id);
    const tieneAcceso = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        id: true,
        roles: {
          where: { rol: { rol: 'ADMIN' } }, // Filtro directo en la relación
          select: { id: true }
        }
      }
    });
    if (tieneAcceso.roles.length === 0) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // verificar que el estado sea un string
    const estadoOrden = String(estado);
    
    // Crear el comprobante de pago
    const comprobantePago = await prisma.ordenPago.update({
      where: {
        codigo: codigo_orden_pago
      },
      data: {
        estado: estadoOrden
      }
    });
    if(estadoOrden === 'COMPLETADO'){
      
      //Actualizar el saldo del usuario
      const usuario = await prisma.usuario.findUnique({
        where: {
          id: comprobantePago.id_usuario_host
        }
      });
      if (usuario) {
        const montoHost = Number((comprobantePago.monto_a_pagar * 0.8).toFixed(2));
        await prisma.usuario.update({
          where: { id: comprobantePago.id_usuario_host },
          data: { saldo: { increment: montoHost } }
        });
      }
    }

    return res.status(201).json(comprobantePago);
  } catch (error) {
    console.error('Error al crear el comprobante de pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Crear solicitud de recarga
exports.crearRecarga = async (req, res) => {
  try {
    const userId = req.user.id;
    const { monto, numeroTransaccion, banco } = req.body;

    if (!monto || typeof monto !== 'number' || monto <= 0) {
      return res.status(200).json({ 
        error: 'El monto debe ser un número mayor a 0' 
      });
    }
    if (monto < 10) {
      return res.status(200).json({ 
        error: 'El monto mínimo es de 10 BOB' 
      });
    }
    if (monto > 10000) {
      return res.status(200).json({ 
        error: 'El monto máximo es de 10,000 BOB' 
      });
    }

    if (!/^\d{8,32}$/.test(numeroTransaccion)) {
      return res.status(200).json({ 
        error: 'El número de transacción debe tener entre 8 y 32 dígitos' 
      });
    }

    const bancosPermitidos = ['BCP', 'YAPE', 'Banco Unión'];
    if (!bancosPermitidos.includes(banco)) {
      return res.status(200).json({ 
        error: 'Banco no válido' 
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const transaccionExistente = await prisma.transaccion.findFirst({
      where: {
        numeroTransaccion: numeroTransaccion,
        estado: {
          in: ['PENDIENTE', 'COMPLETADA']
        }
      }
    });
    if (transaccionExistente) {
      return res.status(200).json({ 
        error: 'Ya existe una transacción con este número' 
      });
    }

    const nuevaTransaccion = await prisma.transaccion.create({
      data: {
        monto: monto,
        tipo: 'SUBIDA',
        estado: 'PENDIENTE',
        numeroTransaccion: numeroTransaccion,
        userId: userId
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Solicitud de recarga creada exitosamente',
      data: {
        transaccion: {
          id: nuevaTransaccion.id,
          monto: nuevaTransaccion.monto,
          estado: nuevaTransaccion.estado,
          tipo: nuevaTransaccion.tipo,
          banco: banco,
          fechaCreacion: nuevaTransaccion.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error al crear solicitud de recarga:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
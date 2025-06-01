const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const prisma = new PrismaClient();

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} BOB`;
};

// Generar PDF de orden de pago
exports.generateOrderPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ordenId } = req.params;

    // datos orden
    const orden = await prisma.ordenPago.findFirst({
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
            correo: true,
            foto: true
          }
        },
        renter: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            foto: true
          }
        },
        carro: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            año: true,
            placa: true
          }
        },
        ComprobanteDePago: {
          select: {
            id: true,
            fecha_emision: true,
            numero_transaccion: true,
            monto: true
          }
        }
      }
    });

    if (!orden) {
      return res.status(404).json({ error: "Orden de pago no encontrada" });
    }

    // Crear el PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante-orden-${orden.codigo}.pdf`);
    
    // Pipe del PDF
    doc.pipe(res);

    // Header del documento
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('COMPROBANTE DE PAGO', { align: 'center' })
       .moveDown();

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ORDEN DE SERVICIO', { align: 'center' })
       .moveDown(2);

    // Información orden
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE LA ORDEN', { underline: true })
       .moveDown(0.5);

    doc.font('Helvetica')
       .text(`Código de Orden: ${orden.codigo}`)
       .text(`Fecha de Emisión: ${formatDate(orden.fecha_de_emision)}`)
       .text(`Estado: ${orden.estado}`)
       .text(`Monto Total: ${formatCurrency(orden.monto_a_pagar)}`)
       .moveDown();

    // Información vehículo
    doc.font('Helvetica-Bold')
       .text('INFORMACIÓN DEL VEHÍCULO', { underline: true })
       .moveDown(0.5);

    doc.font('Helvetica')
       .text(`Marca: ${orden.carro.marca}`)
       .text(`Modelo: ${orden.carro.modelo}`);
    
    if (orden.carro.año) {
      doc.text(`Año: ${orden.carro.año}`);
    }
    
    if (orden.carro.placa) {
      doc.text(`Placa: ${orden.carro.placa}`);
    }
    
    doc.moveDown();

    // Información usuarios
    doc.font('Helvetica-Bold')
       .text('INFORMACIÓN DE USUARIOS', { underline: true })
       .moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Propietario (Host):')
       .font('Helvetica')
       .text(`  Nombre: ${orden.host.nombre}`)
       .text(`  Correo: ${orden.host.correo || 'No disponible'}`)
       .moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Arrendatario:')
       .font('Helvetica')
       .text(`  Nombre: ${orden.renter.nombre}`)
       .text(`  Correo: ${orden.renter.correo || 'No disponible'}`)
       .moveDown();

    // Información del comprobante de pago
    if (orden.ComprobanteDePago && orden.ComprobanteDePago.length > 0) {
      const comprobante = orden.ComprobanteDePago[0];
      
      doc.font('Helvetica-Bold')
         .text('COMPROBANTE DE PAGO', { underline: true })
         .moveDown(0.5);

      doc.font('Helvetica')
         .text(`Número de Transacción: ${comprobante.numero_transaccion}`)
         .text(`Fecha de Pago: ${formatDate(comprobante.fecha_emision)}`)
         .text(`Monto Pagado: ${formatCurrency(comprobante.monto)}`)
         .moveDown();
    }

    // Footer
    doc.moveDown(2)
       .fontSize(10)
       .font('Helvetica')
       .text('REDIBO.', { align: 'center' })
       .text(`Comprobante generado el: ${formatDate(new Date())}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("Error al generar PDF de orden:", error);
    return res.status(500).json({ error: "Error al generar el PDF" });
  }
};

// Generar PDF de transacción
exports.generateTransactionPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transaccionId } = req.params;

    // datos transacción
    const transaccion = await prisma.transaccion.findFirst({
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
            correo: true,
            foto: true
          }
        }
      }
    });

    if (!transaccion) {
      return res.status(404).json({ error: "Transacción no encontrada" });
    }

    // Crear el PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante-transaccion-${transaccion.id.slice(-8)}.pdf`);
    
    // Pipe PDF
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('COMPROBANTE DE TRANSACCIÓN', { align: 'center' })
       .moveDown();

    const tipoTexto = transaccion.tipo === 'RETIRO' ? 'RETIRO DE FONDOS' : 'DEPÓSITO DE FONDOS';
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(tipoTexto, { align: 'center' })
       .moveDown(2);

    // Información transacción
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE LA TRANSACCIÓN', { underline: true })
       .moveDown(0.5);

    doc.font('Helvetica')
       .text(`ID de Transacción: ${transaccion.id}`)
       .text(`Tipo: ${transaccion.tipo === 'RETIRO' ? 'Retiro' : 'Depósito'}`)  // Corregido
       .text(`Estado: ${transaccion.estado}`)
       .text(`Fecha: ${formatDate(transaccion.createdAt)}`)
       .text(`Monto: ${formatCurrency(transaccion.monto)}`)
       .moveDown();

    if (transaccion.numeroTransaccion) {
      doc.text(`Número de Transacción: ${transaccion.numeroTransaccion}`)
         .moveDown();
    }

    // URL del QR si existe
    if (transaccion.qrUrl) {
      doc.text(`URL del QR: ${transaccion.qrUrl}`)
         .moveDown();
    }

    // Información usuario
    doc.font('Helvetica-Bold')
       .text('INFORMACIÓN DEL USUARIO', { underline: true })
       .moveDown(0.5);

    doc.font('Helvetica')
       .text(`Nombre: ${transaccion.usuario.nombre}`)
       .text(`Correo: ${transaccion.usuario.correo || 'No disponible'}`)
       .moveDown();

    // Footer
    doc.moveDown(2)
       .fontSize(10)
       .font('Helvetica')
       .text('REDIBO.', { align: 'center' })
       .text(`Comprobante generado el: ${formatDate(new Date())}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("Error al generar PDF de transacción:", error);
    return res.status(500).json({ error: "Error al generar el PDF" });
  }
};
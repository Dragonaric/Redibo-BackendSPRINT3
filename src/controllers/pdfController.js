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
            saldo: true
          }
        }
      }
    });

    if (!orden) {
      return res.status(404).json({ error: "Orden de pago no encontrada" });
    }

    // Crear el PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante-orden-${orden.codigo}.pdf`);
    
    // Pipe del PDF
    doc.pipe(res);

    // Funciones helper para el PDF
    const addHeader = () => {
      // Logo o marca (opcional)
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('REDIBO', 50, 50)
         .fillColor('#000000');

      // Línea divisoria
      doc.moveTo(50, 85)
         .lineTo(550, 85)
         .strokeColor('#e5e7eb')
         .stroke();

      // Título principal
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('COMPROBANTE DE PAGO', 50, 100, { align: 'center' });

      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Orden de Servicio de Alquiler de Vehículo', 50, 125, { align: 'center' })
         .fillColor('#000000');

      return 160; // Retorna la posición Y para continuar
    };

    const addSection = (title, content, startY) => {
      let currentY = startY;
      
      // Título de sección con fondo
      doc.rect(50, currentY, 500, 25)
         .fillColor('#f3f4f6')
         .fill();
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(title, 60, currentY + 8)
         .fillColor('#000000');
      
      currentY += 35;

      // Contenido de la sección
      doc.fontSize(10)
         .font('Helvetica');

      content.forEach(item => {
        if (item.label && item.value) {
          doc.font('Helvetica-Bold')
             .text(`${item.label}:`, 60, currentY)
             .font('Helvetica')
             .text(item.value, 200, currentY);
          currentY += 15;
        } else if (item.text) {
          doc.font('Helvetica')
             .text(item.text, 60, currentY);
          currentY += 15;
        }
      });

      return currentY + 10; // Retorna nueva posición Y
    };

    const addTable = (headers, rows, startY) => {
      let currentY = startY;
      const colWidth = 450 / headers.length;
      
      // Headers
      doc.rect(50, currentY, 450, 20)
         .fillColor('#e5e7eb')
         .fill();
      
      headers.forEach((header, index) => {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#374151')
           .text(header, 60 + (index * colWidth), currentY + 5, {
             width: colWidth - 10,
             align: 'left'
           });
      });
      
      currentY += 25;
      doc.fillColor('#000000');

      // Rows
      rows.forEach(row => {
        row.forEach((cell, index) => {
          doc.fontSize(9)
             .font('Helvetica')
             .text(cell, 60 + (index * colWidth), currentY, {
               width: colWidth - 10,
               align: 'left'
             });
        });
        currentY += 18;
      });

      return currentY + 10;
    };

    // Generar PDF
    let currentY = addHeader();

    // Información básica de la orden
    currentY = addSection('INFORMACIÓN DE LA ORDEN', [
      { label: 'Código de Orden', value: orden.codigo },
      { label: 'Fecha de Emisión', value: formatDate(orden.fecha_de_emision) },
      { label: 'Estado', value: orden.estado },
      { label: 'Monto Total', value: formatCurrency(orden.monto_a_pagar) }
    ], currentY);

    // Información del vehículo en formato tabla
    const vehicleData = [
      ['Marca', orden.carro.marca],
      ['Modelo', orden.carro.modelo],
      ['Año', orden.carro.año?.toString() || 'No especificado'],
      ['Placa', orden.carro.placa || 'No especificada']
    ];

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL VEHÍCULO', 50, currentY);
    
    currentY = addTable(['Detalle', 'Información'], vehicleData, currentY + 20);

    // Información de usuarios lado a lado
    const leftCol = 50;
    const rightCol = 300;
    const userSectionY = currentY;

    // Host (izquierda)
    doc.rect(leftCol, userSectionY, 225, 25)
       .fillColor('#f3f4f6')
       .fill();
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('PROPIETARIO (HOST)', leftCol + 10, userSectionY + 8);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Nombre: ${orden.host.nombre}`, leftCol + 10, userSectionY + 35)
       .text(`Correo: ${orden.host.correo || 'No disponible'}`, leftCol + 10, userSectionY + 50);

    // Renter (derecha)
    doc.rect(rightCol, userSectionY, 250, 25)
       .fillColor('#f3f4f6')
       .fill();
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('ARRENDATARIO', rightCol + 10, userSectionY + 8);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Nombre: ${orden.renter.nombre}`, rightCol + 10, userSectionY + 35)
       .text(`Correo: ${orden.renter.correo || 'No disponible'}`, rightCol + 10, userSectionY + 50);

    currentY = userSectionY + 80;

    // Comprobante de pago destacado
    if (orden.ComprobanteDePago && orden.ComprobanteDePago.length > 0) {
      const comprobante = orden.ComprobanteDePago[0];
      
      // Caja destacada para el comprobante
      doc.rect(50, currentY, 500, 80)
         .fillColor('#dcfce7')
         .fill()
         .rect(50, currentY, 500, 80)
         .strokeColor('#16a34a')
         .lineWidth(2)
         .stroke();

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#15803d')
         .text('✓ PAGO CONFIRMADO', 60, currentY + 10);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#000000')
         .text(`Número de Transacción: ${comprobante.numero_transaccion}`, 60, currentY + 35)
         .text(`Fecha de Pago: ${formatDate(comprobante.fecha_emision)}`, 60, currentY + 50);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#15803d')
         .text(`Monto Pagado: ${formatCurrency(comprobante.saldo)}`, 350, currentY + 35);

      currentY += 100;
    }

    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Este documento es un comprobante oficial de pago generado automáticamente.', 50, currentY + 20, { align: 'center' })
       .text(`Generado el: ${formatDate(new Date())} | REDIBO - Sistema de Alquiler de Vehículos`, 50, currentY + 35, { align: 'center' });

    // Línea final
    doc.moveTo(50, currentY + 55)
       .lineTo(550, currentY + 55)
       .strokeColor('#e5e7eb')
       .stroke();

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
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    // headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante-transaccion-${transaccion.id.slice(-8)}.pdf`);
    
    // Pipe PDF
    doc.pipe(res);

    // Funciones helper
    const addHeader = () => {
      // Logo/marca
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('REDIBO', 50, 50)
         .fillColor('#000000');

      // Línea divisoria
      doc.moveTo(50, 85)
         .lineTo(550, 85)
         .strokeColor('#e5e7eb')
         .stroke();

      // Título principal
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('COMPROBANTE DE TRANSACCIÓN', 50, 100, { align: 'center' });

      // Subtítulo dinámico según tipo
      const tipoTexto = transaccion.tipo === 'RETIRO' ? 'RETIRO DE FONDOS' : 'DEPÓSITO DE FONDOS';
      const tipoColor = transaccion.tipo === 'RETIRO' ? '#dc2626' : '#16a34a';
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(tipoColor)
         .text(tipoTexto, 50, 125, { align: 'center' })
         .fillColor('#000000');

      return 160;
    };

    const addTransactionCard = (startY) => {
      const cardHeight = 120;
      const isRetiro = transaccion.tipo === 'RETIRO';
      const cardColor = isRetiro ? '#fee2e2' : '#dcfce7';
      const borderColor = isRetiro ? '#dc2626' : '#16a34a';
      const iconColor = isRetiro ? '#dc2626' : '#16a34a';
      const icon = isRetiro ? '' : '';

      // Tarjeta principal
      doc.rect(50, startY, 500, cardHeight)
         .fillColor(cardColor)
         .fill()
         .rect(50, startY, 500, cardHeight)
         .strokeColor(borderColor)
         .lineWidth(2)
         .stroke();

      // Icono y tipo de transacción
      const tipoTexto = transaccion.tipo === 'RETIRO' ? 'RETIRO' : 'DEPÓSITO';
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor(iconColor)
         .text(`${icon} ${tipoTexto}`, 70, startY + 15);

      // Monto destacado
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(iconColor)
         .text(formatCurrency(transaccion.monto), 350, startY + 20);

      // ID de transacción
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(`ID: ${transaccion.id}`, 70, startY + 50)
         .text(`Fecha: ${formatDate(transaccion.createdAt)}`, 70, startY + 65);

      // Estado de la transacción
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(`Estado: ${transaccion.estado}`, 70, startY + 85);

      return startY + cardHeight + 20;
    };

    const addDetailSection = (title, details, startY) => {
      // Header de sección
      doc.rect(50, startY, 500, 30)
         .fillColor('#f8fafc')
         .fill()
         .rect(50, startY, 500, 30)
         .strokeColor('#e2e8f0')
         .stroke();

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#475569')
         .text(title, 70, startY + 10);

      let currentY = startY + 45;

      // Contenido en formato de tabla
      details.forEach(detail => {
        if (detail.label && detail.value) {
          // Fila alternada
          if (details.indexOf(detail) % 2 === 0) {
            doc.rect(50, currentY - 5, 500, 25)
               .fillColor('#f8fafc')
               .fill();
          }

          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('#374151')
             .text(detail.label, 70, currentY);

          doc.font('Helvetica')
             .fillColor('#000000')
             .text(detail.value, 250, currentY);

          currentY += 25;
        }
      });

      return currentY + 10;
    };

    const addQRSection = (startY) => {
      if (!transaccion.qrUrl) return startY;

      // Título de sección normal
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN DE QR', 50, startY)
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .text('URL del código QR:', 50, startY + 25)
         .text(transaccion.qrUrl, 50, startY + 40, { 
           width: 500, 
           ellipsis: true 
         });

      return startY + 70;
    };

    const addSummaryBox = (startY) => {
      // Resumen final
      doc.rect(50, startY, 500, 60)
         .fillColor('#1e293b')
         .fill();

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('RESUMEN DE LA TRANSACCIÓN', 70, startY + 15);

      const resumenTexto = transaccion.tipo === 'RETIRO' 
        ? `Se ha retirado ${formatCurrency(transaccion.monto)} de su cuenta`
        : `Se ha depositado ${formatCurrency(transaccion.monto)} en su cuenta`;

      doc.fontSize(11)
         .font('Helvetica')
         .text(resumenTexto, 70, startY + 35);

      return startY + 70;
    };

    // Generar PDF
    let currentY = addHeader();

    // Tarjeta de transacción destacada
    currentY = addTransactionCard(currentY);

    // Detalles de la transacción
    const transactionDetails = [
      { label: 'ID de Transacción', value: transaccion.id },
      { label: 'Tipo de Operación', value: transaccion.tipo === 'RETIRO' ? 'Retiro de Fondos' : 'Depósito de Fondos' },
      { label: 'Estado', value: transaccion.estado },
      { label: 'Fecha y Hora', value: formatDate(transaccion.createdAt) },
      { label: 'Monto Procesado', value: formatCurrency(transaccion.monto) }
    ];

    // Agregar número de transacción si existe
    if (transaccion.numeroTransaccion) {
      transactionDetails.push({
        label: 'Número de Transacción',
        value: transaccion.numeroTransaccion
      });
    }

    currentY = addDetailSection('DETALLES DE LA TRANSACCIÓN', transactionDetails, currentY);

    // Información del usuario
    const userDetails = [
      { label: 'Nombre Completo', value: transaccion.usuario.nombre },
      { label: 'Correo Electrónico', value: transaccion.usuario.correo || 'No disponible' }
    ];

    currentY = addDetailSection('INFORMACIÓN DEL TITULAR', userDetails, currentY);

    // Sección QR si existe
    currentY = addQRSection(currentY);

    // Resumen final
    currentY = addSummaryBox(currentY);

    // Footer mejorado
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Este documento constituye un comprobante oficial de la transacción realizada.', 50, currentY + 20, { align: 'center' })
       .text('Para cualquier consulta o reclamo, conserve este comprobante.', 50, currentY + 35, { align: 'center' })
       .text(`Generado automáticamente el: ${formatDate(new Date())} | REDIBO - Sistema de Gestión Financiera`, 50, currentY + 50, { align: 'center' });

    // Línea final decorativa
    doc.moveTo(50, currentY + 70)
       .lineTo(550, currentY + 70)
       .strokeColor('#e5e7eb')
       .lineWidth(2)
       .stroke();

    doc.end();

  } catch (error) {
    console.error("Error al generar PDF de transacción:", error);
    return res.status(500).json({ error: "Error al generar el PDF" });
  }
};
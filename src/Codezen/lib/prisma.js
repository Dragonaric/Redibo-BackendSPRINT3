// Create a new file for Prisma client
const { PrismaClient } = require("@prisma/client")
const emailService = require('../services/emailService')

// Create a global prisma instance to avoid multiple instances in development
const globalForPrisma = global

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Función para notificar mantenimientos vencidos
async function notificarMantenimientosVencidos() {
  console.log('Iniciando notificarMantenimientosVencidos...');
  const ahora = new Date()
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)

  // Buscar mantenimientos vencidos y no completados, junto con el carro y el usuario host
  const mantenimientosVencidos = await prisma.mantenimiento.findMany({
    where: {
      fecha_vencimiento: { lt: ahora },
      completado: false,
    },
    include: {
      Carro: {
        include: {
          Usuario: true
        }
      }
    }
  })

  console.log(`Encontrados ${mantenimientosVencidos.length} mantenimientos vencidos y no completados.`);

  for (const mant of mantenimientosVencidos) {
    console.log('Procesando mantenimiento:', mant.id, 'Fecha vencimiento:', mant.fecha_vencimiento, 'Completado:', mant.completado);
    const host = mant.Carro.Usuario
    console.log('Host asociado:', host ? host.correo : 'No hay host', 'Ultima Sesion:', host ? host.ultimaSesion : 'N/A');

    if (host && host.ultimaSesion && host.ultimaSesion < hace24h) {
      console.log('Condiciones cumplidas para enviar notificación a:', host.correo);
      console.log('Enviando notificación a:', host.correo, 'por mantenimiento:', mant.id);
      await emailService.sendMantenimientoVencidoNotification(
        host.correo,
        host.nombre,
        mant.Carro,
        mant
      )
    }
  }
  console.log('Finalizado notificarMantenimientosVencidos.');
}

module.exports = { prisma, notificarMantenimientosVencidos }

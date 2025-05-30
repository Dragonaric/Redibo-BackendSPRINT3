const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Listar todos los seguros disponibles */
async function listarSeguros() {
  return prisma.seguro.findMany();
}

/** Obtener un seguro por su ID */
async function obtenerSeguroPorId(id) {
  return prisma.seguro.findUnique({ where: { id } });
}

/** Crear un nuevo tipo de seguro */
async function crearSeguro(data) {
  return prisma.seguro.create({ data });
}

/** Actualizar un tipo de seguro existente */
async function actualizarSeguro(id, data) {
  return prisma.seguro.update({ where: { id }, data });
}

/** Eliminar un tipo de seguro */
async function eliminarSeguro(id) {
  return prisma.seguro.delete({ where: { id } });
}

/** Crear una póliza de seguro individual para un carro */
async function crearSeguroCarro({ id_carro, id_seguro, fechaInicio, fechaFin, enlace }) {
  return prisma.seguroCarro.create({
    data: { id_carro, id_seguro, fechaInicio, fechaFin, enlace }
  });
}

/** Crear múltiples pólizas de seguro en batch */
async function crearSegurosCarroBatch(id_carro, seguros) {
  const payload = seguros.map(s => ({
    ...s,
    id_carro,
    fechaInicio: new Date(s.fechaInicio),
    fechaFin: new Date(s.fechaFin)
  }));
  return prisma.seguroCarro.createMany({ data: payload });
}

/** Listar pólizas de un carro */
async function listarSegurosCarro(id_carro) {
  return prisma.seguroCarro.findMany({ where: { id_carro } });
}

/** Obtener una póliza por su ID */
async function obtenerSeguroCarroPorId(id) {
  return prisma.seguroCarro.findUnique({ where: { id } });
}

/** Actualizar una póliza de seguro */
async function actualizarSeguroCarro(id, data) {
  return prisma.seguroCarro.update({ where: { id }, data });
}

/** Eliminar una póliza de seguro */
async function eliminarSegurosCarroPorCarro(id_carro) {
  return prisma.seguroCarro.deleteMany({
    where: { id_carro: +id_carro }, // Filtra por id_carro
  });
}
module.exports = {
  listarSeguros,
  obtenerSeguroPorId,
  crearSeguro,
  actualizarSeguro,
  eliminarSeguro,
  crearSeguroCarro,
  crearSegurosCarroBatch,
  listarSegurosCarro,
  obtenerSeguroCarroPorId,
  actualizarSeguroCarro,
  eliminarSegurosCarroPorCarro
};

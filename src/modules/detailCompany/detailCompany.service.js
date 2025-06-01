const prisma = require('../../config/prisma');

const credenciales = {
  async findById(id_carro) {
    try {
      console.log('Id recibido desde controller:', id_carro);
      return await prisma.seguroCarro.findMany({
        where: { id_carro: id_carro },
        select: {
          id: true,
          fechaInicio: true,
          fechaFin: true,
          Seguro: {
            select: {
              id:true,
              empresa: true,
              nombre: true,
              tipoSeguro: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error al obtener los seguros por carro:', error);
    }
  },
};

module.exports = credenciales;
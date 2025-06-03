// models/garantia.js
const prisma = require('../config/prisma');

class GarantiaModel {
  static async crearGarantiaYAsignarACarro({ precio, fecha_limite, pagado, descripcion, id_carro }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear la garantía
      const garantia = await tx.garantia.create({
        data: {
          precio,
          fecha_limite: new Date(fecha_limite),
          pagado,
          descripcion,
        },
      });

      // 2. Asignarla al carro
      const carroActualizado = await tx.carro.update({
        where: { id: id_carro },
        data: {
          id_garantia: garantia.id,
        },
      });

      return {
        garantia,
        carro: carroActualizado,
      };
    });
  }
}

module.exports = { GarantiaModel };

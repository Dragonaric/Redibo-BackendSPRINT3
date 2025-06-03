// controllers/garantia.js
const prisma = require('../config/prisma');

class GarantiaController {
  // Obtener garantía por id_carro (si existe)
  static async obtenerPorCarro(req, res) {
    try {
      const { id_carro } = req.params;

      const carro = await prisma.carro.findUnique({
        where: { id: Number(id_carro) },
        include: { garantia: true },
      });

      if (!carro) {
        return res.status(404).json({ error: "Carro no encontrado" });
      }

      if (!carro.garantia) {
        return res.status(200).json({ garantia: null, mensaje: "No hay garantía para este carro" });
      }

      res.status(200).json({ garantia: carro.garantia });
    } catch (error) {
      console.error("Error al obtener garantía por carro:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Crear garantía solo si NO existe para ese carro
  static async crear(req, res) {
    try {
      const { precio, fecha_limite, pagado, descripcion, id_carro } = req.body;

      // Primero verificamos si el carro existe y si ya tiene garantía
      const carro = await prisma.carro.findUnique({
        where: { id: id_carro },
        include: { garantia: true },
      });

      if (!carro) {
        return res.status(404).json({ error: 'Carro no encontrado' });
      }

      if (carro.garantia) {
        return res.status(400).json({
          mensaje: 'El carro ya tiene una garantía asociada',
          garantia: carro.garantia,
        });
      }

      // Crear nueva garantía
      const nuevaGarantia = await prisma.garantia.create({
        data: {
          precio,
          fecha_limite: new Date(fecha_limite),
          pagado,
          descripcion,
        },
      });

      // Asociar garantía al carro
      await prisma.carro.update({
        where: { id: id_carro },
        data: { id_garantia: nuevaGarantia.id },
      });

      res.status(201).json({
        mensaje: 'Garantía creada y asociada correctamente',
        garantia: nuevaGarantia,
      });

    } catch (error) {
      console.error('Error al crear la garantía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar garantía existente por su ID
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { precio, fecha_limite, pagado, descripcion } = req.body;

      const garantia = await prisma.garantia.findUnique({
        where: { id: Number(id) },
      });

      if (!garantia) {
        return res.status(404).json({ error: 'Garantía no encontrada' });
      }

      const garantiaActualizada = await prisma.garantia.update({
        where: { id: Number(id) },
        data: {
          precio,
          fecha_limite: new Date(fecha_limite),
          pagado,
          descripcion,
        },
      });

      res.status(200).json({
        mensaje: 'Garantía actualizada correctamente',
        garantia: garantiaActualizada,
      });

    } catch (error) {
      console.error('Error al actualizar la garantía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = { GarantiaController };

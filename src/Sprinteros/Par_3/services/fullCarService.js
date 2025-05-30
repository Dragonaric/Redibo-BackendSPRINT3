// backend/services/fullCarService.js

const prisma = require('../../../config/prisma');
const { CarServiceError } = require('../errors/customErrors');

/**
 * Crea un carro completo sin imágenes,
 * gestionando dirección, carro y relaciones.
 * @param {Object} dto
 * @param {Object} dto.direccion   Datos de dirección
 * @param {Object} dto.carro       Datos de carro (sin imágenes)
 * @param {number[]} dto.combustibles   IDs de combustibles
 * @param {number[]} dto.caracteristicas IDs de características adicionales
 */
async function createFullCar(dto) {
  const { direccion, carro, combustibles = [], caracteristicas = [] } = dto;

  if (!Array.isArray(combustibles) || combustibles.some(id => !Number.isInteger(id))) {
    throw new CarServiceError('Combustibles inválidos.', 'VALIDATION_ERROR');
  }
  if (!Array.isArray(caracteristicas) || caracteristicas.some(id => !Number.isInteger(id))) {
    throw new CarServiceError('Características inválidas.', 'VALIDATION_ERROR');
  }

  try {
    const { dir, c: newCar } = await prisma.$transaction(async tx => {
      const dir = await tx.direccion.create({
        data: {
          ...direccion, // Esto incluirá latitud y longitud automáticamente
        },
      });
      const c = await tx.carro.create({
        data: {
          ...carro,
          id_direccion: dir.id,
          CombustibleCarro: {
            create: combustibles.map(idComb => ({ id_combustible: idComb })),
          },
          caracteristicasAdicionalesCarro: {
            create: caracteristicas.map(idCar => ({
              id_carasteristicasAdicionales: idCar
            })),
          },
        },
        include: {
          CombustibleCarro: { 
            include: { 
              TipoCombustible: true 
            } 
          },
          caracteristicasAdicionalesCarro: {
            include: { 
              CarasteristicasAdicionales: true 
            }
          },
        },
      });
      return { dir, c };
    }, {
      timeout: 10000 // 10 segundos, puedes ajustar el valor según lo que necesites
    });

    return {
      direccion: dir,
      carro: newCar,
    };
  } catch (err) {
    if (err.code === 'P2002') {
      throw new CarServiceError('Violación de restricción única.', 'CONFLICT_ERROR', err);
    }
    throw new CarServiceError('Error al crear el carro completo.', 'TRANSACTION_ERROR', err);
  }
}

module.exports = { createFullCar };
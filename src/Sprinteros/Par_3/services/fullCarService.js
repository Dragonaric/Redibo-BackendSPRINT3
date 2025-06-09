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

  // Validaciones de arrays
  if (!Array.isArray(combustibles) || combustibles.some(id => !Number.isInteger(id))) {
    throw new CarServiceError('Combustibles inválidos.', 'VALIDATION_ERROR');
  }
  if (!Array.isArray(caracteristicas) || caracteristicas.some(id => !Number.isInteger(id))) {
    throw new CarServiceError('Características inválidas.', 'VALIDATION_ERROR');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear la dirección
      const direccionCreada = await tx.direccion.create({
        data: {
          id_provincia: direccion.id_provincia,
          calle: direccion.calle,
          zona: direccion.zona,
          num_casa: direccion.num_casa,
          latitud: direccion.latitud,
          longitud: direccion.longitud
        }
      });

      // 2. Crear el carro con todas sus relaciones
      const carroCreado = await tx.carro.create({
        data: {
          vim: carro.vim,
          año: carro.año,
          marca: carro.marca,
          modelo: carro.modelo,
          placa: carro.placa,
          asientos: carro.asientos,
          puertas: carro.puertas,
          soat: carro.soat,
          precio_por_dia: carro.precio_por_dia,
          num_mantenimientos: carro.num_mantenimientos,
          transmicion: carro.transmicion,
          estado: carro.estado,
          descripcion: carro.descripcion,
          id_usuario_rol: carro.id_usuario,
          id_direccion: direccionCreada.id,
          CombustibleCarro: {
            create: combustibles.map(idComb => ({
              id_combustible: idComb
            }))
          },
          caracteristicasAdicionalesCarro: {
            create: caracteristicas.map(idCar => ({
              id_carasteristicasAdicionales: idCar
            }))
          }
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
          Direccion: true
        }
      });

      return {
        direccion: direccionCreada,
        carro: carroCreado
      };
    }, {
      timeout: 10000,
      maxWait: 15000,
      isolationLevel: 'Serializable'
    });
  } catch (err) {
    console.error('Error en createFullCar:', err);
    
    if (err.code === 'P2002') {
      throw new CarServiceError(
        'Ya existe un carro con los mismos datos únicos (VIN o placa).',
        'CONFLICT_ERROR',
        err
      );
    }
    
    if (err.code === 'P2003') {
      throw new CarServiceError(
        'Error de referencia: algunos datos relacionados no existen.',
        'REFERENCE_ERROR',
        err
      );
    }

    throw new CarServiceError(
      'Error al crear el carro completo.',
      'TRANSACTION_ERROR',
      err
    );
  }
}

module.exports = { createFullCar };
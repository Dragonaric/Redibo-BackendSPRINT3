const prisma = require('../../../config/prisma'); // Instancia única compartida
const { CarServiceError } = require('../errors/customErrors');
const { deleteCarImage } = require('./imageService');
const { eliminarSegurosCarroPorCarro } = require('./segurosService');
/**
 * Obtiene la lista de carros, permitiendo la paginación y filtrado por host.
 * @param {Object} params - Parámetros de consulta.
 * @param {number} params.skip - Saltar N registros (paginación).
 * @param {number} params.take - Cantidad de registros a tomar.
 * @param {number} [params.hostId] - (Opcional) ID del host para filtrar los registros.
 * @returns {Object} Objeto con la cuenta total y la lista de carros.
 */
async function getCars({ skip = 0, take = 10, hostId } = {}) {
  // Construir filtro (where) en función de si se provee hostId
  const whereFilter = hostId ? { id_usuario_rol: hostId } : {};
  try {
    const [total, cars] = await prisma.$transaction([
      prisma.carro.count({ where: whereFilter }),
      prisma.carro.findMany({
        skip,
        take,
        where: whereFilter,
        orderBy: { id: 'desc' }
      })
    ]);
    return { total: total || 0, cars: cars || [] };
  } catch (error) {
    throw new CarServiceError(`Error fetching cars: ${error.message}`, 'PRISMA_ERROR', error);
  }
}

/**
 * Crea un nuevo carro.
 * Se espera que 'data' contenga la información necesaria, incluyendo el id del host (id_usuario_rol).
 * @param {Object} data - Datos del carro a crear.
 * @returns {Object} El carro creado.
 */
async function createCar(data) {
  try {
    if (!data.id_usuario_rol) {
      throw new Error('ID de host es requerido para crear un carro');
    }
    return await prisma.carro.create({ data });
  } catch (error) {
    throw new CarServiceError('Error al crear carro', 'DB_ERROR', error);
  }
}

/**
 * Obtiene un carro por su ID.
 */
async function getCarById(id) {
  try {
    const car = await prisma.carro.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        marca: true,
        modelo: true,
        año: true,
        precio_por_dia: true,
        estado: true,
        vim: true,
        placa: true,
        num_mantenimientos: true,
        descripcion: true
      }
    });
    if (!car) {
      throw new CarServiceError('Carro no encontrado', 'NOT_FOUND');
    }
    return car;
  } catch (err) {
    throw new CarServiceError(`Error al obtener el carro: ${err.message}`, 'PRISMA_ERROR', err);
  }
}

/**
 * Actualiza campos num_mantenimientos, precio_por_dia y descripcion de un carro.
 */
async function updateCar(id, data) {
  try {
    const allowed = (({ num_mantenimientos, precio_por_dia, descripcion }) => ({
      num_mantenimientos,
      precio_por_dia,
      descripcion
    }))(data);

    const updated = await prisma.carro.update({
      where: { id: Number(id) },
      data: allowed
    });
    return updated;
  } catch (err) {
    throw new CarServiceError(`Error al actualizar el carro: ${err.message}`, 'PRISMA_ERROR', err);
  }
}

/**
 * Manejo genérico de operaciones con Prisma para centralizar el tratamiento de errores.
 * @param {Function} operation - Operación a ejecutar (retorna una Promise).
 * @returns {Promise} Resultado de la operación.
 */
async function handlePrismaOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 'P2025') { // Registro no encontrado
      throw new CarServiceError('Recurso no encontrado', 'NOT_FOUND');
    }
    throw new CarServiceError(error.message, 'PRISMA_ERROR', error);
  }
}

/**
 * Elimina todas las dependencias de un carro antes de eliminarlo
 * @param {number} carId - ID del carro
 */
async function deleteCarDependencies(carId) {
  try {
    // 1. Eliminar imágenes
    const images = await prisma.imagen.findMany({
      where: { id_carro: carId },
      select: { id: true }
    });
    for (const image of images) {
      await deleteCarImage(image.id);
    }

    // 2. Eliminar seguros del carro
    await eliminarSegurosCarroPorCarro(carId);

    // 3. Eliminar calificaciones
    await prisma.calificacion.deleteMany({
      where: { id_carro: carId }
    });

    // 4. Eliminar favoritos
    await prisma.favorito.deleteMany({
      where: { id_carro: carId }
    });

    // 5. Eliminar reservas
    await prisma.reserva.deleteMany({
      where: { id_carro: carId }
    });

    // 6. Eliminar características adicionales
    await prisma.caracteristicasAdicionalesCarro.deleteMany({
      where: { id_carro: carId }
    });

    // 7. Eliminar contratos de alquiler
    await prisma.contratodeAlquiler.deleteMany({
      where: { id_carro: carId }
    });

    // 8. Eliminar órdenes de pago
    await prisma.ordenPago.deleteMany({
      where: { id_carro: carId }
    });

    // 9. Eliminar comentarios del carro
    await prisma.comentarioCarro.deleteMany({
      where: { id_carro: carId }
    });

    // 10. Eliminar mantenimientos
    await prisma.mantenimiento.deleteMany({
      where: { id_carro: carId }
    });

    // 11. Eliminar combustible del carro
    await prisma.combustibleCarro.deleteMany({
      where: { id_carro: carId }
    });

  } catch (error) {
    throw new CarServiceError(`Error al eliminar dependencias del carro: ${error.message}`, 'DEPENDENCY_DELETE_ERROR', error);
  }
}

/**
 * Elimina un carro por su ID.
 * @param {number|string} id - ID del carro a eliminar.
 * @returns {Object} Resultado de la eliminación.
 */
async function deleteCar(id) {
  const carId = Number(id);
  
  try {
    // Primero eliminamos todas las dependencias
    await deleteCarDependencies(carId);
    
    // Finalmente eliminamos el carro
    return await prisma.carro.delete({ 
      where: { id: carId }
    });
  } catch (error) {
    throw new CarServiceError(`Error al eliminar el carro: ${error.message}`, 'DELETE_ERROR', error);
  }
}

module.exports = { getCars, createCar, getCarById, updateCar, deleteCar };

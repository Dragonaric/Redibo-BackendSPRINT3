const prisma = require('../../config/prisma');

// Obtener lista inicial con datos limitados
const getFiltrosIniciales = async () => {
  try {
    const carros = await prisma.carro.findMany({
      select: {
        id: true,
        precio_por_dia: true,
        NumeroViajes: true,
        Calificacion: {
          select: {
            calf_carro: true
          }
        }
      }
    });

    if (!carros || carros.length === 0) {
      return null;
    }

    // Transformar los datos para incluir el promedio de calificaciones
    const carrosTransformados = carros.map(carro => ({
      id: carro.id,
      precio_por_dia: carro.precio_por_dia,
      NumeroViajes: carro.NumeroViajes,
      calificaciones: carro.Calificacion.map(cal => cal.calf_carro).filter(Boolean)
    }));

    return carrosTransformados;
  } catch (error) {
    console.error('Error al obtener filtros iniciales:', error);
    throw error;
  }
};

// Filtrar por rango de precio
const filtrarPorPrecio = async (minPrecio, maxPrecio, idsCarros) => {
  try {
    // Validar que el array de ids no esté vacío
    if (!idsCarros || idsCarros.length === 0) {
      throw new Error('Se requiere al menos un ID de carro para filtrar');
    }

    // Validar que minPrecio sea menor que maxPrecio
    if (minPrecio > maxPrecio) {
      throw new Error('El precio mínimo no puede ser mayor que el precio máximo');
    }

    // Validar que los precios no sean negativos
    if (minPrecio < 0 || maxPrecio < 0) {
      throw new Error('Los precios no pueden ser negativos');
    }

    const carros = await prisma.carro.findMany({
      where: {
        AND: [
          {
            id: {
              in: idsCarros
            }
          },
          {
            precio_por_dia: {
              gte: minPrecio,
              lte: maxPrecio
            }
          }
        ]
      },
      select: {
        id: true,
        precio_por_dia: true,
        NumeroViajes: true,
        Calificacion: {
          select: {
            calf_carro: true
          }
        }
      }
    });

    return carros.map(carro => ({
      id: carro.id,
      precio_por_dia: carro.precio_por_dia,
      NumeroViajes: carro.NumeroViajes,
      calificaciones: carro.Calificacion.map(cal => cal.calf_carro).filter(Boolean)
    }));
  } catch (error) {
    console.error('Error al filtrar por precio:', error);
    throw error;
  }
};

// Filtrar por número de viajes
const filtrarPorViajes = async (minViajes, idsCarros) => {
  try {
    // Validar que el array de ids no esté vacío
    if (!idsCarros || idsCarros.length === 0) {
      throw new Error('Se requiere al menos un ID de carro para filtrar');
    }

    // Validar que minViajes no sea negativo
    if (minViajes < 0) {
      throw new Error('El número mínimo de viajes no puede ser negativo');
    }

    const carros = await prisma.carro.findMany({
      where: {
        AND: [
          {
            id: {
              in: idsCarros
            }
          },
          {
            NumeroViajes: {
              gte: minViajes
            }
          }
        ]
      },
      select: {
        id: true,
        precio_por_dia: true,
        NumeroViajes: true,
        Calificacion: {
          select: {
            calf_carro: true
          }
        }
      }
    });

    return carros.map(carro => ({
      id: carro.id,
      precio_por_dia: carro.precio_por_dia,
      NumeroViajes: carro.NumeroViajes,
      calificaciones: carro.Calificacion.map(cal => cal.calf_carro).filter(Boolean)
    }));
  } catch (error) {
    console.error('Error al filtrar por viajes:', error);
    throw error;
  }
};

// Filtrar por calificación mínima
const filtrarPorCalificacion = async (minCalificacion, idsCarros) => {
  try {
    // Validar que el array de ids no esté vacío
    if (!idsCarros || idsCarros.length === 0) {
      throw new Error('Se requiere al menos un ID de carro para filtrar');
    }

    // Validar que la calificación esté en un rango válido (1-5)
    if (minCalificacion < 1 || minCalificacion > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    const carros = await prisma.carro.findMany({
      where: {
        AND: [
          {
            id: {
              in: idsCarros
            }
          },
          {
            Calificacion: {
              some: {
                calf_carro: {
                  gte: minCalificacion
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        precio_por_dia: true,
        NumeroViajes: true,
        Calificacion: {
          select: {
            calf_carro: true
          }
        }
      }
    });

    return carros.map(carro => ({
      id: carro.id,
      precio_por_dia: carro.precio_por_dia,
      NumeroViajes: carro.NumeroViajes,
      calificaciones: carro.Calificacion.map(cal => cal.calf_carro).filter(Boolean)
    }));
  } catch (error) {
    console.error('Error al filtrar por calificación:', error);
    throw error;
  }
};

module.exports = {
  getFiltrosIniciales,
  filtrarPorPrecio,
  filtrarPorViajes,
  filtrarPorCalificacion
}; 
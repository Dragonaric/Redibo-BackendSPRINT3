const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerPlacaPorId = async (id) => {
  try {
    console.log('ID recibido:', id);
    const placa = await prisma.carro.findUnique({
      where: { id: parseInt(id) }, // Asegúrate de que el campo 'id' exista en el modelo
      select: { placa: true }, // Solo selecciona el campo "placa"
    });
    console.log('Placa encontrada:', placa);
    return placa;
  } catch (error) {
    console.error('Error al obtener la placa:', error);
    throw error;
  }
};


// Obtener solo el VIM del carro por ID
const obtenerVIMPorId = async (id) => {
    try {
      console.log('ID recibido para VIM:', id);
      const vim = await prisma.carro.findUnique({
        where: { id: parseInt(id) },
        select: { vim: true }, // Asegúrate de que el campo se llame exactamente "vim"
      });
      console.log('VIM encontrado:', vim);
      return vim;
    } catch (error) {
      console.error('Error al obtener el VIM:', error);
      throw error;
    }
  };


// Obtener solo la marca por ID
const obtenerMarcaPorId = async (id) => {
    try {
      const marca = await prisma.carro.findUnique({
        where: { id: parseInt(id) },
        select: { marca: true }
      });
      return marca;
    } catch (error) {
      console.error('Error al obtener la marca:', error);
      throw error;
    }
  };

// Obtener solo el modelo por ID
const obtenerModeloPorId = async (id) => {
    try {
      const modelo = await prisma.carro.findUnique({
        where: { id: parseInt(id) },
        select: { modelo: true } // Seleccionamos solo el campo "modelo"
      });
      return modelo;
    } catch (error) {
      console.error('Error al obtener el modelo:', error);
      throw error;
    }
  };

  // Obtener solo el año por ID
const obtenerAnioPorId = async (id) => {
    try {
      const anio = await prisma.carro.findUnique({
        where: { id: parseInt(id) },
        select: { año: true } // Seleccionamos solo el campo "ano"
      });
      return anio;
    } catch (error) {
      console.error('Error al obtener el año:', error);
      throw error;
    }
 };

 const obtenerVehiculoCompletoPorId = async (id) => {
  try {
    const vehiculo = await prisma.carro.findUnique({
      where: { id: parseInt(id) },
      select: {
        placa: true,
        vim: true,
        marca: true,
        modelo: true,
        año: true, // Asegúrate que en Prisma esté como "año"
      },
    });

    if (vehiculo) {
      // Reestructuramos el objeto para asegurarnos del orden deseado
      const vehiculoOrdenado = {
        vim: vehiculo.vim,
        año: vehiculo.año,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        placa: vehiculo.placa,
      };

      return vehiculoOrdenado;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener los datos completos del vehículo:', error);
    throw error;
  }
};


const obtenerCaracteristicasPorId = async (id) => {
  try {
    const caracteristicas = await prisma.carro.findUnique({
      where: { id: parseInt(id) },
      select: {
        asientos: true,
        puertas: true,
        transmicion: true,
        soat: true,
        CombustibleCarro: {
          select: {
            TipoCombustible: {
              select: {
                tipoDeCombustible: true
              }
            }
          }
        }
      }
    });

    if (!caracteristicas) return null;

    // Extraer tipo(s) de combustible
    const tiposCombustible = caracteristicas.CombustibleCarro.map(
      (c) => c.TipoCombustible.tipoDeCombustible
    );

    // Retornar datos en el orden solicitado
    return {
      tipoDeCombustible: tiposCombustible.join(', '),
      asientos: caracteristicas.asientos,
      puertas: caracteristicas.puertas,
      transmision: caracteristicas.transmicion,
      soat: caracteristicas.soat,
    };
  } catch (error) {
    console.error('Error al obtener características del vehículo:', error);
    throw error;
  }
};

const obtenerCaracteristicasAdicionalesPorId = async (id) => {
  try {
    const caracteristicasAdicionales = await prisma.carro.findUnique({
      where: { id: parseInt(id) },
      select: {
        caracteristicasAdicionalesCarro: {
          select: {
            CarasteristicasAdicionales: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    if (!caracteristicasAdicionales) return null;

    // Extraer y formatear las características adicionales
    const adicionales = caracteristicasAdicionales.caracteristicasAdicionalesCarro.map(
      (item) => item.CarasteristicasAdicionales.nombre
    );

    return adicionales;
  } catch (error) {
    console.error('Error al obtener las características adicionales:', error);
    throw error;
  }
};

const actualizarVehiculoPorId = async (id, datosActualizados) => {
  try {
    const { vim, año, marca, modelo, placa } = datosActualizados;

    // Validaciones básicas
    if (!vim || !año || !marca || !modelo || !placa) {
      throw new Error("Todos los campos son requeridos");
    }

    // Validación del VIN (17 caracteres alfanuméricos excluyendo I, O, Q)
    const regexVin = /^[A-HJ-NPR-Z0-9]{17}$/; // Excluye I, O y Q
    if (!regexVin.test(vim)) {
      throw new Error("El VIN es inválido");
    }

    // Validación del formato de placa
    const regexPlaca = /^[0-9]{3,4}-[A-Z]{0,3}$/; // Ejemplo: ABC-1234 o ABC-123A
    if (!regexPlaca.test(placa)) {
      throw new Error("La placa es inválida");
    }

    // Validación del año del vehículo
    /**/

    // Actualizar el vehículo en la base de datos
    const carroActualizado = await prisma.carro.update({
      where: { id: parseInt(id) },
      data: {
        vim,
        año,
        marca,
        modelo,
        placa,
      },
    });

    return carroActualizado;

  } catch (error) {
    console.error('Error al actualizar el vehículo:', error);
    throw error;
  }
};


const actualizarCaracteristicasPorId = async (id, datosActualizados) => {
  try {
    const { tipoDeCombustible, asientos, puertas, transmicion, soat } = datosActualizados;

    // Validaciones básicas
    if (!Array.isArray(tipoDeCombustible) || tipoDeCombustible.length === 0) {
      throw new Error("Debe proporcionar al menos un tipo de combustible en un array");
    }

    if (tipoDeCombustible.length > 2) {
      throw new Error("Solo se permiten un máximo de 2 tipos de combustible");
    }

    if (typeof asientos !== "number" || asientos <= 0) {
      throw new Error("El número de asientos debe ser un número positivo");
    }

    if (typeof puertas !== "number" || puertas <= 0) {
      throw new Error("El número de puertas debe ser un número positivo");
    }

    if (typeof transmicion !== "string" || transmicion.trim() === "") {
      throw new Error("La transmisión es requerida y debe ser una cadena de texto");
    }

    if (typeof soat !== "boolean") {
      throw new Error("El campo SOAT debe ser un valor booleano (true o false)");
    }

    // Buscar los IDs de los tipos de combustible proporcionados en letras
    const combustibles = await prisma.tipoCombustible.findMany({
      where: {
        tipoDeCombustible: {
          in: tipoDeCombustible, // Busca los nombres de los combustibles
        },
      },
      select: {
        id: true, // Obtén solo los IDs
        tipoDeCombustible: true, // Incluye el nombre para depuración
      },
    });

    console.log("Nombres de combustibles proporcionados:", tipoDeCombustible);
    console.log("Combustibles encontrados en la base de datos:", combustibles);

    // Verificar si todos los combustibles existen
    const nombresEncontrados = combustibles.map((c) => c.tipoDeCombustible);
    const nombresNoEncontrados = tipoDeCombustible.filter(
      (nombre) => !nombresEncontrados.includes(nombre)
    );

    if (nombresNoEncontrados.length > 0) {
      throw new Error(
        `Los siguientes tipos de combustible no existen en la base de datos: ${nombresNoEncontrados.join(", ")}`
      );
    }

    const idsCombustibles = combustibles.map((combustible) => combustible.id);

    // Actualizar las características principales del vehículo
    const caracteristicasActualizadas = await prisma.carro.update({
      where: { id: parseInt(id) },
      data: {
        asientos,
        puertas,
        transmicion,
        soat,
      },
    });

    // Actualizar los tipos de combustible asociados al vehículo
    await prisma.combustibleCarro.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    const nuevosCombustibles = idsCombustibles.map((idCombustible) => ({
      id_carro: parseInt(id),
      id_combustible: idCombustible,
    }));

    await prisma.combustibleCarro.createMany({
      data: nuevosCombustibles,
    });

    // Construir la respuesta con las características actualizadas y los tipos de combustible
    return {
      mensaje: "Características del vehículo actualizadas correctamente",
      caracteristicas: {
        "tipo de combustible": tipoDeCombustible,
        asientos: caracteristicasActualizadas.asientos,
        puertas: caracteristicasActualizadas.puertas,
        transmicion: caracteristicasActualizadas.transmicion,
        soat: caracteristicasActualizadas.soat,
      },
    };
  } catch (error) {
    console.error("Error al actualizar las características del vehículo:", error);
    throw error;
  }
};


const actualizarCaracteristicasAdicionalesPorId = async (id, nuevasCaracteristicasAdicionales) => {
  try {
    // Validación básica: Si no se proporcionan características adicionales, elimina todas las existentes
    if (!Array.isArray(nuevasCaracteristicasAdicionales)) {
      throw new Error("El formato de las características adicionales debe ser un array");
    }

    if (nuevasCaracteristicasAdicionales.length === 0) {
      // Si no se proporcionan características adicionales, elimina todas las existentes
      await prisma.caracteristicasAdicionalesCarro.deleteMany({
        where: { id_carro: parseInt(id) },
      });

      return {
        mensaje: "Todas las características adicionales han sido eliminadas",
        caracteristicasAdicionales: [],
      };
    }

    // Si se envía "TODAS", selecciona todas las características adicionales disponibles
    let idsCaracteristicas;
    if (nuevasCaracteristicasAdicionales.includes("TODAS")) {
      const todasCaracteristicas = await prisma.carasteristicasAdicionales.findMany({
        select: { id: true },
      });
      idsCaracteristicas = todasCaracteristicas.map((caracteristica) => caracteristica.id);
    } else {
      // Buscar los IDs de las características adicionales proporcionadas en letras
      const caracteristicas = await prisma.carasteristicasAdicionales.findMany({
        where: {
          nombre: {
            in: nuevasCaracteristicasAdicionales, // Busca los nombres de las características adicionales
          },
        },
        select: {
          id: true, // Obtén solo los IDs
          nombre: true, // Incluye el nombre para depuración
        },
      });

      console.log("Características encontradas:", caracteristicas);

      // Verificar si todas las características existen
      const nombresEncontrados = caracteristicas.map((c) => c.nombre);
      const nombresNoEncontrados = nuevasCaracteristicasAdicionales.filter(
        (nombre) => !nombresEncontrados.includes(nombre)
      );

      if (nombresNoEncontrados.length > 0) {
        throw new Error(
          `Las siguientes características adicionales no existen en la base de datos: ${nombresNoEncontrados.join(", ")}`
        );
      }

      idsCaracteristicas = caracteristicas.map((caracteristica) => caracteristica.id);
    }

    // Eliminar las características adicionales existentes asociadas al vehículo
    await prisma.caracteristicasAdicionalesCarro.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    // Crear las nuevas características adicionales
    const nuevasCaracteristicas = idsCaracteristicas.map((idCaracteristica) => ({
      id_carro: parseInt(id),
      id_carasteristicasAdicionales: idCaracteristica,
    }));

    await prisma.caracteristicasAdicionalesCarro.createMany({
      data: nuevasCaracteristicas,
    });

    // Obtener las características adicionales actualizadas
    const caracteristicasActualizadas = await prisma.caracteristicasAdicionalesCarro.findMany({
      where: { id_carro: parseInt(id) },
      include: {
        CarasteristicasAdicionales: { // <-- nombre correcto según tu schema.prisma
          select: {
            nombre: true,
          },
        },
      },
    });

    const nombresActualizados = caracteristicasActualizadas.map(
      (item) => {
    if (item.CarasteristicasAdicionales) {
        return item.CarasteristicasAdicionales.nombre;
    } else {
        console.warn(`No se encontró CarasteristicasAdicionales para el item con ID ${item.id}`);
        return null; // o algún valor por defecto
    }
}
    );

    return {
      mensaje: "Características adicionales actualizadas correctamente",
      caracteristicasAdicionales: nombresActualizados,
    };
  } catch (error) {
    console.error("Error al actualizar las características adicionales del vehículo:", error);
    throw error;
  }
};

const eliminarVehiculoPorId = async (id) => {
  try {
    // Validar que el ID sea un número válido
    if (!id || isNaN(id)) {
      throw new Error("El ID del vehículo es inválido");
    }


    const idOrder = await prisma.ordenPago.findFirst({
      where: { id_carro: parseInt(id) },
      select: { id: true }
    });

    if (idOrder) {
      console.log("ID de orden de pago encontrada:", idOrder.id);
      const idOrdenPago = idOrder.id; // Obtener el ID

      const comprobantes = await prisma.comprobanteDePago.findMany({
        where: { id_orden: idOrdenPago }
      });

      for (const comprobante of comprobantes) {
        await prisma.comprobanteDePago.delete({
          where: { id: comprobante.id }
        });
        console.log(`Comprobante de pago con ID ${comprobante.id} eliminado.`);
      }

      // Elimina la OrdenPago usando su ID
      await prisma.ordenPago.delete({
        where: { id: idOrdenPago } // Usa el id de la OrdenPago
      });
      console.log(`OrdenPago con ID ${idOrdenPago} eliminada.`);

    } else {
      console.log(`No se encontró ordenPago para el carro con ID ${id}`);
    }

    await prisma.seguroCarro.deleteMany({
        where: { id_carro: parseInt(id) }, // Filtra por id_carro
      });

    // Eliminar las relaciones asociadas al vehículo en las tablas dependientes
    await prisma.caracteristicasAdicionalesCarro.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    await prisma.combustibleCarro.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    await prisma.imagen.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    await prisma.favorito.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    await prisma.calificacion.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    await prisma.reserva.deleteMany({
      where: { id_carro: parseInt(id) },
    });

    // Eliminar el vehículo de la base de datos
    const vehiculoEliminado = await prisma.carro.delete({
      where: { id: parseInt(id) },
    });

    return {
      mensaje: "Vehículo eliminado correctamente",
      vehiculo: vehiculoEliminado,
    };
  } catch (error) {
    console.error("Error al eliminar el vehículo:", error);
    throw error;
  }
};

module.exports = {
  obtenerPlacaPorId,
  obtenerVIMPorId,
  obtenerMarcaPorId,
  obtenerModeloPorId,
  obtenerAnioPorId,
  obtenerVehiculoCompletoPorId,
  obtenerCaracteristicasPorId,
  obtenerCaracteristicasAdicionalesPorId,
  actualizarVehiculoPorId,
  actualizarCaracteristicasPorId, 
  actualizarCaracteristicasAdicionalesPorId, eliminarVehiculoPorId
};
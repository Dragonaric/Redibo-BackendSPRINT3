// backend/controllers/fullCarController.js

const asyncHandler = require('express-async-handler');
const fullCarService = require('../services/fullCarService');

/**
 * Controlador para crear un carro completo sin imágenes.
 */
const createFullCarHandler = asyncHandler(async (req, res) => {
  const id_usuario_rol = req.user?.id_usuario_rol;
  if (!id_usuario_rol) {
    return res
      .status(403)
      .json({ success: false, message: 'No tienes permiso para realizar esta acción.' });
  }

  const {
    id_provincia,
    calle,
    zona,
    num_casa,
    latitud, // Extraer latitud
    longitud, // Extraer longitud
    vim,
    año,
    marca,
    modelo,
    placa,
    asientos,
    puertas,
    soat,
    transmicion,
    combustibleIds,
    extraIds,
    precio_por_dia,
    num_mantenimientos,
    estado,
    descripcion,
  } = req.body;

  const dto = {
    direccion: { id_provincia, calle, zona, num_casa, latitud, longitud }, // Incluir latitud y longitud
    carro: {
      vim,
      año,
      marca,
      modelo,
      placa,
      id_usuario_rol,
      asientos,
      puertas,
      soat,
      transmicion,
      precio_por_dia,
      num_mantenimientos,
      estado,
      descripcion,
    },
    combustibles: combustibleIds,
    caracteristicas: extraIds,
  };

  const { carro: newCar } = await fullCarService.createFullCar(dto);
  // Devolver solo el ID para que el frontend lo use en la subida de imágenes
  res.status(201).json({ success: true, data: { id: newCar.id } });
});

module.exports = { createFullCarHandler };
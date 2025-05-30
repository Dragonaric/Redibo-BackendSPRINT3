const Joi = require('joi');

/**
 * Esquema de validación para un carro completo con Joi.
 */
const newCarSchema = Joi.object({
  id_provincia: Joi.number().integer().required(),
  calle: Joi.string().required(),
  zona: Joi.string().required(),
  num_casa: Joi.string().allow(null, ''),

  vim: Joi.string().required(),
  año: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  marca: Joi.string().required(),
  modelo: Joi.string().required(),
  placa: Joi.string().required(),
 
  combustibleIds: Joi.array().items(Joi.number().integer()).min(1).required(),
  extraIds: Joi.array().items(Joi.number().integer()).min(0).required(),

  asientos: Joi.number().integer().min(1).required(),
  puertas:  Joi.number().integer().min(1).required(),
  soat:     Joi.boolean().required(),
  precio_por_dia: Joi.number().precision(2).required(),
  num_mantenimientos: Joi.number().integer().min(0).required(),
  transmicion: Joi.string().valid('Manual', 'Automatica').required(),
  estado: Joi.string().required(),
  descripcion: Joi.string().allow(null, ''),

  latitud: Joi.number().required(), // Validar que sea un número y requerido
  longitud: Joi.number().required(), // Validar que sea un número y requerido
});

const validateNewCarFull = (req, res, next) => {
  const { error } = newCarSchema.validate(req.body, { abortEarly: false, convert: true });

  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  next();
};

module.exports = validateNewCarFull;
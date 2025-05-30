const segurosService = require('../services/segurosService');

/** Controlador para crear múltiples seguros de carro */
async function crearSegurosCarroBatch(req, res, next) {
  try {
    const { id_carro } = req.params;
    const seguros = req.body; // array de objetos con id_seguro, fechaInicio, fechaFin, enlace?
    await segurosService.crearSegurosCarroBatch(+id_carro, seguros);
    res.status(201).json({ success: true, count: seguros.length });
  } catch (err) {
    next(err);
  }
}

/** Controlador para crear un solo seguro de carro */
async function crearSeguroCarro(req, res, next) {
  try {
    const { id_carro } = req.params;
    const dto = { id_carro: +id_carro, ...req.body };
    const seguroCarro = await segurosService.crearSeguroCarro(dto);
    res.status(201).json(seguroCarro);
  } catch (err) {
    next(err);
  }
}

// Resto de controladores (listar, obtener, actualizar, eliminar...) siguen igual:
const {
  listarSeguros,
  obtenerSeguroPorId,
  crearSeguro,
  actualizarSeguro,
  eliminarSeguro,
  listarSegurosCarro,
  obtenerSeguroCarroPorId,
  actualizarSeguroCarro,
  eliminarSeguroCarro
} = segurosService;

module.exports = {
  listarSeguros: async (req, res, next) => {
    try { res.json(await listarSeguros()); } catch (e) { next(e); }
  },
  obtenerSeguro: async (req, res, next) => {
    try { res.json(await obtenerSeguroPorId(+req.params.id)); } catch (e) { next(e); }
  },
  crearSeguro: async (req, res, next) => {
    try { res.status(201).json(await crearSeguro(req.body)); } catch (e) { next(e); }
  },
  actualizarSeguro: async (req, res, next) => {
    try { res.json(await actualizarSeguro(+req.params.id, req.body)); } catch (e) { next(e); }
  },
  eliminarSeguro: async (req, res, next) => {
    try { await eliminarSeguro(+req.params.id); res.sendStatus(204); } catch (e) { next(e); }
  },
  crearSeguroCarro,
  crearSegurosCarroBatch,
  listarSegurosCarro: async (req, res, next) => {
    try { res.json(await listarSegurosCarro(+req.params.id_carro)); } catch (e) { next(e); }
  },
  obtenerSeguroCarro: async (req, res, next) => {
    try { res.json(await obtenerSeguroCarroPorId(+req.params.id)); } catch (e) { next(e); }
  },
  actualizarSeguroCarro: async (req, res, next) => {
    try { res.json(await actualizarSeguroCarro(+req.params.id, req.body)); } catch (e) { next(e); }
  },
  eliminarSegurosCarroPorCarro: async (req, res, next) => {
  try {
    const { id_carro } = req.params;
    await eliminarSegurosCarroPorCarro(id_carro);
    res.sendStatus(204);
  } catch (e) { next(e); }
}
};

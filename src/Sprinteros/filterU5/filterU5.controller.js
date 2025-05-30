const express = require('express');
const filterService = require('./filterU5.service');

const router = express.Router();

// Obtener lista inicial
router.get('/filtrosIniciales', async (req, res) => {
  try {
    const carros = await filterService.getFiltrosIniciales();
    if (!carros) {
      return res.status(404).json({ error: 'No se encontraron carros' });
    }
    res.json(carros);
  } catch (error) {
    console.error('Error en filtros iniciales:', error);
    res.status(500).json({ error: 'Error al obtener filtros iniciales' });
  }
});

// Filtrar por precio
router.post('/filtroPrecio', async (req, res) => {
  try {
    const { minPrecio, maxPrecio, idsCarros } = req.body;
    
    if (!minPrecio || !maxPrecio || !idsCarros || !Array.isArray(idsCarros)) {
      return res.status(400).json({ 
        error: 'Se requieren minPrecio, maxPrecio y un array de idsCarros' 
      });
    }

    const carros = await filterService.filtrarPorPrecio(
      parseFloat(minPrecio),
      parseFloat(maxPrecio),
      idsCarros
    );
    
    res.json(carros);
  } catch (error) {
    console.error('Error en filtro por precio:', error);
    res.status(500).json({ error: 'Error al filtrar por precio' });
  }
});

// Filtrar por número de viajes
router.post('/filtroViaje', async (req, res) => {
  try {
    const { minViajes, idsCarros } = req.body;
    
    if (!minViajes || !idsCarros || !Array.isArray(idsCarros)) {
      return res.status(400).json({ 
        error: 'Se requiere minViajes y un array de idsCarros' 
      });
    }

    const carros = await filterService.filtrarPorViajes(
      parseInt(minViajes),
      idsCarros
    );
    res.json(carros);
  } catch (error) {
    console.error('Error en filtro por viajes:', error);
    res.status(500).json({ error: 'Error al filtrar por viajes' });
  }
});

// Filtrar por calificación
router.post('/filtroCalificacion', async (req, res) => {
  try {
    const { minCalificacion, idsCarros } = req.body;
    
    if (!minCalificacion || !idsCarros || !Array.isArray(idsCarros)) {
      return res.status(400).json({ 
        error: 'Se requiere minCalificacion y un array de idsCarros' 
      });
    }

    const carros = await filterService.filtrarPorCalificacion(
      parseInt(minCalificacion),
      idsCarros
    );
    res.json(carros);
  } catch (error) {
    console.error('Error en filtro por calificación:', error);
    res.status(500).json({ error: 'Error al filtrar por calificación' });
  }
});

module.exports = router; 
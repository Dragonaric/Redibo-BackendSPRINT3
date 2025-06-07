const express = require('express');
const router = express.Router();

const authenticateRol = require('../middlewares/authenticateRol');
const validateID = require('../middlewares/validateID');
const { validateCreateCar } = require('../middlewares/validateCreateCar');
const { validateUpdateCar } = require('../middlewares/validateUpdateCar');
const validateNewCarFull = require('../middlewares/validateNewCarFull');
const carController = require('../controllers/carController');
const fullCarController = require('../controllers/fullCarController');

// Middleware para deshabilitar el almacenamiento en caché
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

router.get("/idUser", authenticateRol, (req, res) => {
  const id_usuario = req.user.id_usuario;
  res.status(200).json({ message: "Ruta de upload", userId: id_usuario });
});
// Ruta para crear un carro completo (sin imágenes)
router.post(
  '/full',
  authenticateRol, // Middleware para autenticar el token
  validateNewCarFull, // Middleware para validar los datos del carro completo
  fullCarController.createFullCarHandler // Controlador para manejar la creación
);

// Middleware para validar el parámetro "id" en las rutas
router.param('id', validateID);

// Rutas estándar CRUD para carros
router
  .route('/')
  .get(authenticateRol, carController.getCars) // Obtener lista de carros
  .post(authenticateRol, validateCreateCar, carController.createCar); // Crear un carro

router
  .route('/:id')
  .get(authenticateRol, carController.getCarById) // Obtener un carro por ID
  .put(authenticateRol, validateUpdateCar, carController.updateCar) // Actualizar un carro
  .delete(authenticateRol, carController.deleteCar); // Eliminar un carro

// Middleware global para manejar errores en las rutas
router.use((err, res) => {
  console.error('Error en carRoutes:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

module.exports = router;
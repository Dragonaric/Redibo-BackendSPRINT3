const express = require("express")
const cityController = require("../controllers/cityController")

const router = express.Router()

// Ruta para obtener todas las ciudades
router.get("/ciudades", cityController.getAllCities)

module.exports = router

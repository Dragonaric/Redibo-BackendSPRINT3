const Router = require("express");
const { CarController } = require("../controllers/cars");

const carRouter = Router()

carRouter.get('/most-rented', CarController.getMostRented)
carRouter.get('/:id',CarController.getByIdCar)
carRouter.get('/:id/host',CarController.getHostOfCarro)
module.exports = { carRouter }
const Router = require("express");
const { CarController } = require("../controllers/cars");

const carRouter = Router()

carRouter.get('/cars/most-rented', CarController.getMostRented)
carRouter.get('/cars/:id', CarController.getByIdCar)
carRouter.get('/cars/:id/host', CarController.getHostOfCarro)
module.exports = { carRouter }
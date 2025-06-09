const Router = require("express");
const { AirportController } = require("../controllers/airports");

const airportRouter = Router()

airportRouter.get('/airports', AirportController.getAll)

module.exports = { airportRouter }
const Router = require("express");
const { ReservationController } = require("../controllers/reservation");

const reservationRouter = Router()

reservationRouter.post('/reservations', ReservationController.createReservation)
reservationRouter.patch('/reservations/:id/state', ReservationController.updateReservationState)
reservationRouter.delete('/reservations/:id', ReservationController.deleteReservation)

module.exports = { reservationRouter }
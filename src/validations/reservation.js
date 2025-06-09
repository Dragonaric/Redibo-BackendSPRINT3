const { z } = require("zod");

const reservationSchema = z.object({
  userId: z.number({
    required_error: 'El userId es obligatorio',
    invalid_type_error: 'userId debe ser un número'
  }),
  carId: z.number({
    required_error: 'El carId es obligatorio',
    invalid_type_error: 'carId debe ser un número'
  }),
  starDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'starDate debe ser una fecha válida'
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'endDate debe ser una fecha válida'
  }),
  estado: z.enum(['en_curso', 'pendiente', 'confirmado', 'cancelado'], {
    required_error: 'El estado es obligatorio'
  })
})


function validateReservation(reservation) {
  return reservationSchema.safeParse(reservation)
}

function validatePartialReservation(reservation) {
  return reservationSchema.partial().safeParse(reservation)
}

module.exports = {
  validateReservation,
  validatePartialReservation
}
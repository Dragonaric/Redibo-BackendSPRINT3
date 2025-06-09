const express = require("express");
const router = express.Router();
const {
  getTransacciones,
  aceptarTransaccion,
  rechazarTransaccion,
} = require("../controllers/transaccionController");

router.get("/get-transacciones", getTransacciones);
router.put("/aceptar-transaccion/:id", aceptarTransaccion);
router.put("/rechazar-transaccion/:id", rechazarTransaccion);

module.exports = router;

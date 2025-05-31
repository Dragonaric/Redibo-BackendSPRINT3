const express = require("express");
const router = express.Router();
const { getTransacciones } = require("../controllers/transaccionController");

router.get("/get-transacciones",  getTransacciones);

module.exports = router;

const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { uploadImage, uploadTransaccion, getTransacciones } = require("../controllers/uploadController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { get } = require("http");

router.post("/upload", authenticateToken, upload.single("image"), uploadImage);
router.post("/upload-qr", authenticateToken, upload.single("qr"), uploadTransaccion);
router.get("/transacciones", authenticateToken, getTransacciones);

module.exports = router;

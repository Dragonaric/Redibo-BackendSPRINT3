const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { uploadImage, uploadTransaccion, getTransacciones } = require("../controllers/uploadController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/upload", authenticateToken, upload.single("image"), uploadImage);
router.post("/upload-qr", authenticateToken, upload.single("qr"), uploadTransaccion);
router.get("/transacciones", authenticateToken, getTransacciones);
router.get("/prueba", authenticateToken, (req, res) => {
    const id = req.user.id
  res.status(200).json({ message: "Ruta de prueba de upload", userId: id });
});

module.exports = router;

const cloudinary = require("../config/cloudinary");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user?.id;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!userId)
      return res.status(401).json({ error: "User not authenticated" });

    const stream = cloudinary.uploader.upload_stream(
      { folder: "redibo" },
      async (error, result) => {
        if (error)
          return res.status(500).json({ error: "Cloudinary upload failed" });

        // Guardar la URL en el usuario autenticado
        await prisma.usuario.update({
          where: { id: userId },
          data: { foto: result.secure_url },
        });

        return res.json({ message: "Imagen subida", url: result.secure_url });
      }
    );

    stream.end(file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

const uploadTransaccion = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user?.id;
    const { transaccion } = req.body;

    if (!transaccion)
      return res.status(400).json({ error: "Transaction data is required" });
    const transaccionData = JSON.parse(transaccion);

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!userId)
      return res.status(401).json({ error: "User not authenticated" });

    const stream = cloudinary.uploader.upload_stream(
      { folder: "redibo/qr" },
      async (error, result) => {
        if (error)
          return res.status(500).json({ error: "Cloudinary upload failed" });

        await prisma.transaccion.create({
          data: {
            userId: userId,
            monto: transaccionData.monto,
            qrUrl: result.secure_url,
            tipo: "RETIRO",
          },
        });

        await prisma.usuario.update({
          where: { id: userId },
          data: {
            saldo: {
              decrement: transaccionData.monto,
            },
          },
        });

        return res.json({ message: "QR subido" });
      }
    );

    stream.end(file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

const getTransacciones = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ error: "User not authenticated" });

    const transacciones = await prisma.transaccion.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        monto: true,
        tipo: true,
        createdAt: true,
        qrUrl: true,
        estado: true,
      }
    });

    res.status(200).json(transacciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve transactions" });
  }
};

module.exports = { uploadImage, uploadTransaccion, getTransacciones };

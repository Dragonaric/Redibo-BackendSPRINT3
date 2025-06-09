const { response } = require("express");
const cloudinary = require("../config/cloudinary");
const prisma = require("../config/prisma");

exports.crearSolicitud = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { license } = req.body;
    const licenseData = JSON.parse(license);

    const frontFile = req.files.front?.[0];
    const backFile = req.files.back?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ error: "Faltan imágenes de licencia" });
    }

    const uploadToCloudinary = (buffer, filename) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "licencias", public_id: filename },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });
    };

    const frontUrl = await uploadToCloudinary(
      frontFile.buffer,
      `front-${Date.now()}`
    );
    const backUrl = await uploadToCloudinary(
      backFile.buffer,
      `back-${Date.now()}`
    );

    await prisma.solicitudConductor.create({
      data: {
        usuarioId: userId,
        front: frontUrl,
        back: backUrl,
        categoria: licenseData.categoria,
        numeroLicencia: licenseData.numeroLicencia,
        fechaEmision: new Date(licenseData.fechaEmision),
        fechaVencimiento: new Date(licenseData.fechaVencimiento),
      },
    });

    // Actualizar estado del usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: userId },
      data: {
        estadoConductor: "PENDING",
      },
      select: {
        estadoConductor: true,
      },
    });

    res.status(201).json({
      message: "Solicitud creada correctamente",
      estadoConductor: usuarioActualizado.estadoConductor,
    });
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.getSolicitudes = async (req, res) => {
  try {
    const solicitudes = await prisma.solicitudConductor.findMany({
      where: {
        usuario: {
          estadoConductor: "PENDING",
        },
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            foto: true,
          },
        },
      },
    });

    res.status(200).json(solicitudes);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitudConductor.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: true,
      },
    });

    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    await prisma.usuario.update({
      where: { id: solicitud.usuarioId },
      data: { estadoConductor: "APPROVED" },
    });

    await prisma.usuarioRol.create({
      data: {
        id_usuario: solicitud.usuarioId,
        id_rol: 3,
      },
    });

    await prisma.licenciaConducir.create({
      data: {
        usuarioId: solicitud.usuarioId,
        numeroLicencia: solicitud.numeroLicencia,
        fechaEmision: solicitud.fechaEmision,
        fechaVencimiento: solicitud.fechaVencimiento,
        categoria: solicitud.categoria,
      },
    });

    await prisma.solicitudConductor.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "Solicitud aprobada correctamente" });
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitudConductor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    await prisma.solicitudConductor.delete({
      where: { id: parseInt(id) },
    });

    await prisma.usuario.update({
      where: { id: solicitud.usuarioId },
      data: { estadoConductor: "NO_REQUESTED" },
    });
    res.status(200).json({ message: "Solicitud rechazada correctamente" });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


exports.getLicenciaConductor = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const licencia = await prisma.licenciaConducir.findFirst({
      where: { usuarioId: userId },
      select: {
        numeroLicencia: true,
        fechaEmision: true,
        fechaVencimiento: true,
        categoria: true,
      },
    });

    if (!licencia) {
      return res.status(404).json({ error: "Licencia no encontrada" });
    }
    const userData = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        nombre: true,
        foto: true,
        fecha_nacimiento: true,
        genero: true,
      },
    });
    const response = {
      ...licencia,
      ...userData,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error al obtener licencia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Envía un correo electrónico con un código de recuperación
exports.sendRecoveryCode = async (email, code) => {
  const mailOptions = {
    from: `"REDIBO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de recuperación de contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expirará en 30 minutos.</p>
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          Este es un correo automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error enviando email:", error)
    throw new Error("Error al enviar el correo electrónico")
  }
}

// Envía una notificación de cambio de contraseña exitoso
exports.sendPasswordChangedNotification = async (email) => {
  const mailOptions = {
    from: `"REDIBO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Tu contraseña ha sido actualizada",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Contraseña actualizada</h2>
        <p>Te informamos que tu contraseña ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contacta inmediatamente con nuestro soporte.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          Este es un correo automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error enviando email de notificación:", error)
    throw new Error("Error al enviar el correo electrónico de notificación")
  }
}

const express = require("express")
const passport = require("passport")
const userController = require("../controllers/userController")
const { authenticateToken } = require("../middlewares/authMiddleware")

const router = express.Router()

// Flujo de OAuth de Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

// Callback de Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login-failed",
  }),
  userController.googleCallback,
)

// Login con correo y contraseña
router.post("/login", userController.loginUser)

// Registro google
router.post("/register-google", userController.completeGoogleRegistration)

// Completar perfil de usuario
router.post("/complete-profile", userController.completeUserProfile)

// Obtener perfil del usuario (protegido con JWT)
router.get("/profile", authenticateToken, userController.getUserProfile)

// Verificar estado del perfil de un usuario
router.get("/check-profile/:id", userController.checkProfileStatus)

// Verificar estado usuario por email
router.get("/check-profile/email/:email", userController.checkProfileByEmail)

router.get("/validateTokenCompleteRegister", authenticateToken, userController.checkTokenCompleteRegister)

router.post("/request-recovery-code", userController.requestRecoveryCode)

router.post("/verify-recovery-code", userController.verifyRecoveryCode)

router.post("/reset-password", userController.resetPassword)

module.exports = router

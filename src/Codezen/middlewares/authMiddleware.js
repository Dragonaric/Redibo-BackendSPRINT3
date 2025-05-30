const { verifyToken } = require("../services/jwtService")

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" })
  }

  const token = authHeader.split(" ")[1].replace(/^"|"$/g, "")

  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }

  req.user = decoded
  next()
}

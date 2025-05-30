// Create a new file for authentication utilities
const jwt = require("jsonwebtoken")

/**
 * Gets the user ID from the request
 * @param {import('express').Request} req - Express request object
 * @returns {string|null} - User ID or null if not authenticated
 */
exports.getUserId = (req) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded.id
  } catch (error) {
    console.error("Error extracting user ID:", error)
    return null
  }
}

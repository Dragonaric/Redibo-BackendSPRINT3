const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

exports.getAllCities = async (req, res) => {
  try {
    const ciudades = await prisma.ciudad.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: "asc",
      },
    })

    return res.status(200).json(ciudades)
  } catch (error) {
    console.error("Error al obtener ciudades:", error)
    return res.status(500).json({ error: "Error al obtener las ciudades" })
  }
}

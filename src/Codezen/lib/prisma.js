// Create a new file for Prisma client
const { PrismaClient } = require("@prisma/client")

// Create a global prisma instance to avoid multiple instances in development
const globalForPrisma = global

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

module.exports = { prisma }

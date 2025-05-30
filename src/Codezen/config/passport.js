require("dotenv").config();
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value

       
        const existingUser = await prisma.usuario.findFirst({
          where: {
            OR: [{ correo: email }, { google_id: profile.id }],
          },
          include: {
            roles: {
              include: {
                rol: true,
              },
            },
          },
        })

        if (existingUser) {
         
          const updateData = {}
          if (!existingUser.google_id) {
            updateData.google_id = profile.id
          }
          if (!existingUser.foto || existingUser.foto.startsWith("https://ui-avatars.com/api/")) {
            updateData.foto = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.usuario.update({
              where: { id: existingUser.id },
              data: updateData,
            })
          }

         
          const camposRequeridos = [
            existingUser.fecha_nacimiento,
            existingUser.genero,
            existingUser.telefono,
            existingUser.id_ciudad,
          ]

          const perfilIncompleto =
            camposRequeridos.some((campo) => campo === null || campo === "" || campo === undefined) ||
            !existingUser.roles?.length

          
          if (perfilIncompleto) {
            
            return done(null, {
              isNewUser: false,
              isIncomplete: true,
              id: existingUser.id,
              correo: existingUser.correo,
              nombre: existingUser.nombre,
              foto: existingUser.foto,
            })
          }
          const userComplete = await prisma.usuario.findFirst({
            where: {
              OR: [{ correo: email }, { google_id: profile.id }],
            },
            select: {
              id: true,
              nombre: true,
              correo: true,
              telefono: true,
              fecha_nacimiento: true,
              genero: true,
              foto: true,
              google_id: true,
              ciudad: {
                select: {
                  nombre: true,
                },
              },
              roles: {
                select: {
                  rol: {
                    select: {
                      rol: true,
                    },
                  },
                },
              },
            },
          })
          
          const roles = userComplete.roles.map((userRole) => userRole.rol.rol)
          
          return done(null, {
            isNewUser: false,
            isIncomplete: false,
            id: userComplete.id,
            nombre: userComplete.nombre,
            correo: userComplete.correo,
            telefono: userComplete.telefono,
            fecha_nacimiento: userComplete.fecha_nacimiento,
            genero: userComplete.genero,
            ciudad: userComplete.ciudad.nombre,
            foto: userComplete.foto,
            roles: roles,
          })
        }

       
        const newUser = await prisma.usuario.create({
          data: {
            google_id: profile.id,
            correo: email.toLowerCase(),
            nombre: profile.displayName,
            foto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          },
        })

       
        return done(null, {
          isNewUser: true,
          isIncomplete: true,
          id: newUser.id,
          correo: newUser.correo,
          nombre: newUser.nombre,
          foto: newUser.foto,
        })
      } catch (error) {
        console.error("Error en estrategia Google:", error)
        return done(error)
      }
    },
  ),
)

module.exports = passport

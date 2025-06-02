const { PrismaClient } = require('@prisma/client');
const { get } = require('http');
const prisma = new PrismaClient();

const getLinkedDrivers = async (req, res) => {
    try {
        const userId = req.user.id;

        const asociaciones = await prisma.asociacion.findMany({
            where: { renterId: parseInt(userId), activa : true },
            include: {
                driver: {
                    select: {
                        id: true,
                        nombre: true,
                        correo: true,
                        roles: { select: { id_rol: true, } },
                    }
                }
            }
        });

        const conductores = asociaciones
            .map(a => a.driver)
            .filter(d => 
                d.roles.some(role => role.id_rol === 3)
            )
            .map(c => ({
                id: c.id,
                nombre: c.nombre,
                correo: c.correo
            }));

            res.json({ conductores });

    } catch (error) {
        console.error('Error al obtener conductores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getLinkedDrivers };
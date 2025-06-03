const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const guardarBusquedas = async (req, res) => {  
    try {
        const userId= req.user.id;
        const { busquedas } = req.body;
        if (!Array.isArray(busquedas)) {
            return res.status(400).json({ error: 'El campo "busquedas" debe ser un array' });
        }

        await prisma.usuario.update({
            where: { id: userId },
            data: { busquedas: JSON.stringify(busquedas) }
        });

        res.json({ message: 'Búsquedas guardadas correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar las búsquedas' });
    }
};

const obtenerBusquedas = async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { busquedas: true }
        });

        let busquedas = [];
        if (usuario && usuario.busquedas) {
            try {
                busquedas = JSON.parse(usuario.busquedas);
            } catch (error) {
                busquedas = [];
                console.error('Error al parsear las búsquedas:', error);
            }
        }
        res.json({ busquedas });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las búsquedas' });
    }
};

module.exports = { guardarBusquedas, obtenerBusquedas };
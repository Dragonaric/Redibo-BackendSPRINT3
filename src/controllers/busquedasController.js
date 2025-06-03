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

module.exports = { guardarBusquedas };
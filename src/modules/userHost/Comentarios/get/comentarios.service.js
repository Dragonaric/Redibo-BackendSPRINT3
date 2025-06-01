const prisma = require('../../../../config/prisma');

const comentarioHost = {
    async findById(hostId) {
        try {
            return await prisma.comentariohost.findMany({
                where: { id_host: hostId },
                select: {
                    id: true,
                    id_host: true,
                    id_renter: true,
                    comentario: true,
                    fecha: true,
                    Usuario_comentariohost_id_renterToUsuario: {
                        select: {
                            nombre: true,
                        }
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }
};

module.exports = comentarioHost;
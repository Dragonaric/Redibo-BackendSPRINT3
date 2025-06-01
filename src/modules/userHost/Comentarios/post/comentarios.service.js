const prisma = require('../../../../config/prisma');

const comentarioHost = {

    async create(data) {
        try {
            return await prisma.comentariohost.create({
                data: {
                    id_host: data.id_host,
                    id_renter: data.id_renter,
                    comentario: data.comentario,
                }
            });
        } catch (error) {
            throw error;
        }
    }
};

module.exports = comentarioHost;
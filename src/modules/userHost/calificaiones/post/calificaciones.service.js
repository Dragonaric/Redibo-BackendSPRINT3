const prisma = require('../../../../config/prisma');

const calificacionHost = {

    async create(data) {
        try {
            return await prisma.calificacionhost.create({
                data: {
                    id_host: data.id_host,
                    id_renter: data.id_renter,
                    calificacion: data.calificacion,
                }
            });
        } catch (error) {
            throw error;
        }
    }
};

module.exports = calificacionHost;
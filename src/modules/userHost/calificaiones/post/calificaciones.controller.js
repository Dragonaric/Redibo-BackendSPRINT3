const {Router} = require('express');
const calificaionService = require('./calificaciones.service');

const router = Router();
router.post('/', async (req, res) => {
    const { id_host, id_renter, calificacion } = req.body;
    try {
        const nuevaCalificacion = await calificaionService.create({
            id_host,
            id_renter,
            calificacion
        });
        res.status(201).json(nuevaCalificacion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al registrar la calificación' });
    }
});

module.exports = router;
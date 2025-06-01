const {Router} = require('express');
const comentarioService = require('./comentarios.service');

const router = Router();
router.post('/', async (req, res) => {
    const { id_host, id_renter, comentario, fecha } = req.body;
    try {
        const nuevaComentario = await comentarioService.create({
            id_host,
            id_renter,
            comentario
        });
        res.status(201).json(nuevaComentario);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al registrar la calificación' });
    }
});

module.exports = router;
const {Router} = require('express');
const comentarioService = require('./comentarios.service');

const router = Router();

router.get('/:id',async(req, res)=> {
    const hostId = parseInt(req.params.id);
    
    try {
        const caliHost = await comentarioService.findById(hostId);
        res.json(caliHost);
    } catch (error) {
        throw error;
        console.log(error);
    }
})

module.exports = router;
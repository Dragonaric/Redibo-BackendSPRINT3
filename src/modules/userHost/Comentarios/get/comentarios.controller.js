const {Router} = require('express');
const calificaionService = require('./calificaiones.service');

const router = Router();

router.get('/:id',async(req, res)=> {
    const hostId = parseInt(req.params.id);
    
    try {
        const caliHost = await calificaionService.findById(hostId);
        res.json(caliHost);
    } catch (error) {
        throw error (error);
        console.log(error);
    }
})

module.exports = router;
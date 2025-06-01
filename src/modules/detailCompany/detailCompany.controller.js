 const {Router} = require('express');
 const companyService= require('./detailCompany.service');
 const router = Router();

 router.get('/:id', async (req,res)=>{
    const idCarro = parseInt(req.params.id);
    console.log('ID de auto recibido', idCarro);
    try{
        const carro= await companyService.findById(idCarro);
        if(!carro){
            console.log('carro no asegurado')
            return res.status(404).json({message:'no existe esa empresa'});
        }
        res.json(carro);
    }catch(error){
        console.log(error);
    }
 })
 module.exports =router;

const express= require ('express');
const servicioSeguro =  require('./detailCarInsuarance.service');
 
const buscarAutos = express.Router();

buscarAutos.get('/',async(req,res)=>{
    try{
        const buscarJson = await servicioSeguro.findAll();
        res.json(buscarJson);
    }catch(error){
        console.log('Seguros no encontrados ');
        res.status(500).json({error:'Seguros no encontrados'})
    }
})

module.exports = buscarAutos;
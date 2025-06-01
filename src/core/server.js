const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const detailCarModule = require('../modules/detailCar/detailCar.module');
const filterCarModule = require('../modules/filterCar/filterCar.module');
const searchCarModule = require('../modules/searchCar/searchCar.module');
const insertCondition= require('../modules/insertCondition/insertCondition.module');
const insertInsurance= require('../modules/InsertInsurance/InsertedInsurance.module');
const insurance = require('../modules/insurance/insurance.module');

const correoPost = require('../modules/sms/postSMS/correoG.module');
const correoGet = require('../modules/sms/getSMS/correoM.module');
const correoUpdate = require('../modules/sms/putSMS/correoE.module')


const detailHostModule=require('../modules/detailHost/detailHost.module');
const useConditonModule=require('../modules/detailUseCondition/detailUseCondition.module');

const updateSeguro = require('../modules/updateSeguro/updateSeguro.module');
const deleteSeguro = require('../modules/deleteSeguro/deleteSeguro.module');

const comments=require('../modules/comments/comments.module');

const insEnlace= require('../modules/insertEnlace/insertEnlace.module');

const detailCarInsurance = require('../modules/detailCarInsurance/detailCarInsurance.module');
const detailCompany = require('../modules/detailCompany/detailCompany.module');

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

//RUTAS DEFINIDAS

app.use('/detailCar', detailCarModule.controller);
app.use('/filterCar', filterCarModule.controller);
app.use('/searchCar', searchCarModule.controller);
app.use('/insertCondition', insertCondition.controller);
app.use('/insertedInsurance', insertInsurance.controller);

app.use('/correo/enviarGuardar', correoPost.controller);
app.use('/correo/obtener', correoGet.controller);
app.use('/correo/updateEstado', correoUpdate.controller);
app.use('/correo/updateEstadoCorreo', correoUpdate.correoECorreoController);

app.use('/useConditon',useConditonModule.controller);
app.use('/detailHost',detailHostModule.controller);
app.use('/comments',comments.controller);

//sure
app.use('/updateSeguro',updateSeguro.controller);
app.use('/deleteSeguro', deleteSeguro.controller);
app.use('/insertEnlace',insEnlace.controller);
app.use('/infoSeguro', insurance.controller);
app.use('/insertSeguro', insertInsurance.controller);

//tarjetas
app.use('/detailCarInsurance', detailCarInsurance.controller);
app.use('/detailCompany', detailCompany.controller);

module.exports = app;
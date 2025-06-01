const { controller } = require('../get/comentarios.module');
const comentarioPostController = require('./comentarios.controller');
const comentarioPostService = require('./comentarios.service');

module.exports = {
    controller: comentarioPostController,
    service: comentarioPostService,
};
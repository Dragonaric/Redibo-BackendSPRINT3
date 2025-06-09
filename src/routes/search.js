const Router = require("express");
const { searchController } = require("../controllers/search");

const searchRouter = Router()

searchRouter.post('/search', searchController.createSearch)
searchRouter.get('/search/:id', searchController.getSearchByUserId)
searchRouter.delete('/search/:id', searchController.deleteSearchById)

searchRouter.post('/search/save', searchController.saveSearch);

searchRouter.get('/search/id/:userId', searchController.getUserSearchesD);

searchRouter.delete('/search/delete/:id', searchController.deleteSearchByIdD);

searchRouter.get('/search/all', searchController.getAllSearchesD);

module.exports = { searchRouter }

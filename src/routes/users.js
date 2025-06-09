const Router = require("express");
const { userController } = require("../controllers/users")


const userRouter = Router()

userRouter.get("/users/:id", userController.getUserData)

module.exports = { userRouter }
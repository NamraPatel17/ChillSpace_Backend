const router = require("express").Router()
const userController = require("../controllers/UserController")
const validateToken = require("../middlewares/AuthMiddleware")

router.post("/register",userController.registerUser)
router.post("/login",userController.loginUser)

router.get("/profile", validateToken, userController.getProfile)
router.put("/profile", validateToken, userController.updateProfile)

module.exports = router
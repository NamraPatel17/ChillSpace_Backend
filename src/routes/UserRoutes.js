const router = require("express").Router()
const userController = require("../controllers/UserController")
const validateToken = require("../middlewares/AuthMiddleware")

router.post("/register",userController.registerUser)
router.post("/login",userController.loginUser)

router.post("/forgot-password", userController.forgotPassword)
router.post("/reset-password/:token", userController.resetPassword)

router.get("/profile", validateToken, userController.getProfile)
router.put("/profile", validateToken, userController.updateProfile)

module.exports = router
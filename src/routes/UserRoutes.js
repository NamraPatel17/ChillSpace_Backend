const router = require("express").Router()
const userController = require("../controllers/UserController")
const validateToken = require("../middlewares/AuthMiddleware")
const upload = require("../middlewares/UploadMiddleware")

router.post("/register",userController.registerUser)
router.post("/login",userController.loginUser)

router.post("/forgot-password", userController.forgotPassword)
router.post("/reset-password/:token", userController.resetPassword)

router.get("/profile", validateToken, userController.getProfile)
router.put("/profile", validateToken, userController.updateProfile)
router.post("/profile/photo", validateToken, upload.single("photo"), userController.uploadProfilePhoto)
router.post("/verification/document", validateToken, upload.single("document"), userController.uploadIdDocument)

module.exports = router
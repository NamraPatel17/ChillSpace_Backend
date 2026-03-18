const router = require("express").Router()
const adminController = require("../controllers/AdminController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")

// Create activity log
router.post("/activity", validateToken, checkRole(["Admin"]), adminController.createActivity)

// Get all activities
router.get("/activity", validateToken, checkRole(["Admin"]), adminController.getAllActivities)

module.exports = router

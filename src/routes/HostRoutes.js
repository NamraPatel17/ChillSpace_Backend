const router = require("express").Router()
const hostController = require("../controllers/HostController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")

// Get Analytics (Restricted to Hosts)
router.get("/analytics", validateToken, checkRole(["Host"]), hostController.getHostAnalytics)

module.exports = router

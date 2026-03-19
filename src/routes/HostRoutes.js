const router = require("express").Router()
const hostController = require("../controllers/HostController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")

// Get Analytics (Restricted to Hosts)
router.get("/analytics", validateToken, checkRole(["Host"]), hostController.getHostAnalytics)

// Get All Host Bookings
router.get("/bookings", validateToken, checkRole(["Host"]), hostController.getHostBookings)

// Get Host Earnings
router.get("/earnings", validateToken, checkRole(["Host"]), hostController.getHostEarnings)

// Get Host Properties
router.get("/properties", validateToken, checkRole(["Host"]), hostController.getHostProperties)

// Get Host Reviews
router.get("/reviews", validateToken, checkRole(["Host"]), hostController.getHostReviews)

module.exports = router

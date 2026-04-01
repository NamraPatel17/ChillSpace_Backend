const router = require("express").Router()
const adminController = require("../controllers/AdminController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")

// Create activity log
router.post("/activity", validateToken, checkRole(["Admin"]), adminController.createActivity)

// Get all activities
router.get("/activity", validateToken, checkRole(["Admin"]), adminController.getAllActivities)

// Admin Analytics Dashboard
router.get("/analytics", validateToken, checkRole(["Admin"]), adminController.getAdminAnalytics)

// Get all bookings
router.get("/bookings", validateToken, checkRole(["Admin"]), adminController.getAllBookings)

// Get all disputes
router.get("/disputes", validateToken, checkRole(["Admin"]), adminController.getAllDisputes)

// Get all payments / financials
router.get("/payments", validateToken, checkRole(["Admin"]), adminController.getAllPayments)

// Get all properties
router.get("/properties", validateToken, checkRole(["Admin"]), adminController.getAllProperties)

// Get all reviews
router.get("/reviews", validateToken, checkRole(["Admin"]), adminController.getAllReviews)
// Delete a review
router.delete("/reviews/:id", validateToken, checkRole(["Admin"]), adminController.deleteReview)

// Get all users
router.get("/users", validateToken, checkRole(["Admin"]), adminController.getAllUsers)

// Modify Users
router.put("/users/:id/verify", validateToken, checkRole(["Admin"]), adminController.verifyUser)
router.put("/users/:id/suspend", validateToken, checkRole(["Admin"]), adminController.suspendUser)
router.put("/users/:id/unsuspend", validateToken, checkRole(["Admin"]), adminController.unsuspendUser)
router.put("/users/:id/delete", validateToken, checkRole(["Admin"]), adminController.deleteUser)
router.put("/bookings/:id/status", validateToken, checkRole(["Admin"]), adminController.updateBookingStatus)

// Verification Endpoints
router.get("/verifications", validateToken, checkRole(["Admin"]), adminController.getPendingVerifications)
router.patch("/verifications/:id/approve", validateToken, checkRole(["Admin"]), adminController.approveVerification)
router.patch("/verifications/:id/reject", validateToken, checkRole(["Admin"]), adminController.rejectVerification)

module.exports = router

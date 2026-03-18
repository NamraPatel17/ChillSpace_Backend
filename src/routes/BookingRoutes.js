const router = require("express").Router()
const bookingController = require("../controllers/BookingController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")

// Create booking (Guests and Hosts can book)
router.post("/", validateToken, checkRole(["Guest", "Host"]), bookingController.createBooking)

// Get all bookings (Admin only)
router.get("/", validateToken, checkRole(["Admin"]), bookingController.getAllBookings)

// Get bookings by guest id
router.get("/user/:guestId", validateToken, bookingController.getBookingsByGuest)

// Update booking status
router.put("/:id/status", validateToken, bookingController.updateBookingStatus)

// Cancel booking
router.put("/:id/cancel", validateToken, bookingController.cancelBooking)

module.exports = router

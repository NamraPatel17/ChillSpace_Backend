const router = require("express").Router()
const razorpayController = require("../controllers/RazorpayController")
const validateToken = require("../middlewares/AuthMiddleware")

// Get public Razorpay key (no auth needed)
router.get("/key", razorpayController.getKey)

// Create a Razorpay order (requires login)
router.post("/create-order", validateToken, razorpayController.createOrder)

// Verify payment and create booking (requires login)
router.post("/verify", validateToken, razorpayController.verifyPayment)

module.exports = router

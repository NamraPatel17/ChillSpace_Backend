const router = require("express").Router()
const paymentController = require("../controllers/PaymentController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")

// Process a payment
router.post("/process", validateToken, paymentController.processPayment)

// Get all payments (Admin)
router.get("/", validateToken, checkRole(["Admin"]), paymentController.getAllPayments)

// Get payment by ID
router.get("/:id", validateToken, paymentController.getPaymentById)

// Release payout to host
router.post("/:id/release", validateToken, checkRole(["Admin"]), paymentController.releasePayout)

module.exports = router

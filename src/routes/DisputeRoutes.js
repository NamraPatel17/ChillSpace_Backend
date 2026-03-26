const router = require("express").Router()
const disputeController = require("../controllers/DisputeController")
const validateToken = require("../middlewares/AuthMiddleware")

// Guest or Host raises a dispute
router.post("/", validateToken, disputeController.raiseDispute)

// Logged-in user views their own disputes
router.get("/my", validateToken, disputeController.getMyDisputes)

// Admin: view all disputes (with ?status= filter)
router.get("/admin", validateToken, disputeController.getAllDisputes)

// Admin: update dispute status/priority/note
router.put("/admin/:id", validateToken, disputeController.updateDispute)

module.exports = router

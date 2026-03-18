const router = require("express").Router()
const verificationController = require("../controllers/VerificationController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")
const upload = require("../middlewares/UploadMiddleware")

// Submit ID for verification (Guest/Host) - Uses multer to handle file upload
router.post("/submit", validateToken, upload.single("document"), verificationController.submitVerification)

// Check own verification status
router.get("/my-status", validateToken, verificationController.getMyVerificationStatus)

// Admin Routes
// Get all pending requests
router.get("/pending", validateToken, checkRole(["Admin"]), verificationController.getPendingVerifications)

// Approve or Reject verification
router.put("/:id/status", validateToken, checkRole(["Admin"]), verificationController.updateVerificationStatus)

module.exports = router

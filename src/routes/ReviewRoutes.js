const router = require("express").Router()
const reviewController = require("../controllers/ReviewController")
const validateToken = require("../middlewares/AuthMiddleware")

// Add a review
router.post("/", validateToken, reviewController.addReview)

// Get reviews by property ID - Public
router.get("/property/:propertyId", reviewController.getReviewsByProperty)

// Delete a review
router.delete("/:id", validateToken, reviewController.deleteReview)

// Host rates a guest (after completed booking)
router.post("/guest", validateToken, reviewController.addGuestReview)

module.exports = router

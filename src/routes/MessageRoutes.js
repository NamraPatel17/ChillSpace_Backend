const router = require("express").Router()
const messageController = require("../controllers/MessageController")
const validateToken = require("../middlewares/AuthMiddleware")

// Both Guests and Hosts can message, so we just check for a valid token

// Send a message
router.post("/", validateToken, messageController.sendMessage)

// Get conversation history with a specific user
router.get("/:userId", validateToken, messageController.getConversation)

module.exports = router

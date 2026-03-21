const router = require("express").Router()
const messageController = require("../controllers/MessageController")
const validateToken = require("../middlewares/AuthMiddleware")

// Both Guests and Hosts can message, so we just check for a valid token

// Get all recent aggregated conversations for the user sidebar
router.get("/conversations/all", validateToken, messageController.getConversations)

// Send a message
router.post("/", validateToken, messageController.sendMessage)

// Get conversation history with a specific user
router.get("/:userId", validateToken, messageController.getConversation)

module.exports = router

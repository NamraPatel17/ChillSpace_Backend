const Message = require("../models/MessageModel")

// SEND MESSAGE
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, propertyId, content } = req.body
        const senderId = req.user._id // from AuthMiddleware

        if (!receiverId || !content) {
            return res.status(400).json({ message: "receiverId and content are required" })
        }

        const message = new Message({
            senderId,
            receiverId,
            propertyId, // optional context
            content
        })

        const savedMessage = await message.save()

        res.status(201).json({
            message: "Message sent successfully",
            data: savedMessage
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET CONVERSATION (Between logged-in user and another user)
exports.getConversation = async (req, res) => {
    try {
        const loggedInUserId = req.user._id
        const otherUserId = req.params.userId

        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: loggedInUserId }
            ]
        })
        .sort({ createdAt: 1 }) // chronological order
        .populate("senderId", "fullName email")
        .populate("receiverId", "fullName email")

        // Optionally, mark messages as read if the receiver is the logged-in user
        await Message.updateMany(
            { senderId: otherUserId, receiverId: loggedInUserId, readStatus: false },
            { $set: { readStatus: true } }
        )

        res.status(200).json(messages)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

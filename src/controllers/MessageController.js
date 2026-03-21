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

// GET ALL CONVERSATIONS LIST
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        })
        .sort({ createdAt: -1 })
        .populate("senderId", "fullName email")
        .populate("receiverId", "fullName email")
        .populate("propertyId", "title");

        const convs = [];
        const seen = new Set();

        messages.forEach(msg => {
            const isSender = msg.senderId._id.toString() === userId.toString();
            const otherUser = isSender ? msg.receiverId : msg.senderId;
            if (!otherUser) return;

            const otherId = otherUser._id.toString();

            if (!seen.has(otherId)) {
                seen.add(otherId);
                let unreadCount = 0;
                if (!isSender && !msg.readStatus) unreadCount = 1;

                convs.push({
                    id: otherId,
                    host: otherUser.fullName, 
                    property: msg.propertyId ? msg.propertyId.title : "Direct Inquiry",
                    lastMessage: msg.content,
                    timestamp: new Date(msg.createdAt).toLocaleDateString([], {hour: '2-digit', minute:'2-digit'}),
                    unread: unreadCount,
                    avatar: otherUser.fullName.substring(0, 2).toUpperCase()
                });
            } else {
                const existing = convs.find(c => c.id === otherId);
                if (!isSender && !msg.readStatus && existing) {
                    existing.unread += 1;
                }
            }
        });

        res.status(200).json(convs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

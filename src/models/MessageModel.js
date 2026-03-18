const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
    },
    content: {
        type: String,
        required: true
    },
    readStatus: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model("Message", messageSchema)

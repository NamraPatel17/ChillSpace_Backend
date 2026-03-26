const mongoose = require("mongoose")

const disputeSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    against: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reason: {
        type: String,
        enum: ["Property condition", "Host behaviour", "Incorrect listing", "Refund issue", "Safety concern", "Other"],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "resolved"],
        default: "pending"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    adminNote: {
        type: String,
        default: null
    }
}, { timestamps: true })

module.exports = mongoose.model("Dispute", disputeSchema)

const mongoose = require("mongoose")

const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    documentUrl: {
        type: String, // E.g., Cloudinary URL for the uploaded ID
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },
    remarks: {
        type: String // Admin comments, especially if rejected
    }
}, { timestamps: true })

module.exports = mongoose.model("Verification", verificationSchema)

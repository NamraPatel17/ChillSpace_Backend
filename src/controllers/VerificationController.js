const Verification = require("../models/VerificationModel")
const User = require("../models/UserModel")
const uploadToCloudinary = require("../utils/CloudinaryUtil")

// SUBMIT VERIFICATION
// Expects a file upload under the field name "document"
exports.submitVerification = async (req, res) => {
    try {
        const userId = req.user._id

        if (!req.file) {
            return res.status(400).json({ message: "Verification document image is required" })
        }

        // Upload to Cloudinary
        const cloudinaryResponse = await uploadToCloudinary(req.file.path)
        const documentUrl = cloudinaryResponse.secure_url

        // Check if user already submitted a verification
        let verification = await Verification.findOne({ userId })
        
        if (verification) {
            if (verification.status === "Approved") {
                return res.status(400).json({ message: "User is already verified" })
            }
            if (verification.status === "Pending") {
                return res.status(400).json({ message: "Verification is already pending review" })
            }
            
            // If rejected, allow resubmission
            verification.documentUrl = documentUrl
            verification.status = "Pending"
            verification.remarks = undefined
            await verification.save()
            return res.status(200).json({ message: "Verification resubmitted", data: verification })
        }

        verification = new Verification({
            userId,
            documentUrl
        })

        const savedVerification = await verification.save()

        res.status(201).json({
            message: "Verification submitted successfully",
            data: savedVerification
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET ALL PENDING VERIFICATIONS (Admin)
exports.getPendingVerifications = async (req, res) => {
    try {
        const verifications = await Verification.find({ status: "Pending" })
            .populate("userId", "fullName email role")
        
        res.status(200).json(verifications)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// UPDATE VERIFICATION STATUS (Admin)
exports.updateVerificationStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body
        
        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be Approved or Rejected." })
        }

        const verification = await Verification.findByIdAndUpdate(
            req.params.id,
            { status, remarks },
            { new: true }
        )

        if (!verification) {
            return res.status(404).json({ message: "Verification request not found" })
        }

        // If approved, update User model directly
        if (status === "Approved") {
            await User.findByIdAndUpdate(verification.userId, { verificationStatus: true })
        } else if (status === "Rejected") {
            // Optional: reset just in case
            await User.findByIdAndUpdate(verification.userId, { verificationStatus: false })
        }

        res.status(200).json({
            message: `Verification status updated to ${status}`,
            data: verification
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET MY VERIFICATION STATUS
exports.getMyVerificationStatus = async (req, res) => {
    try {
        const verification = await Verification.findOne({ userId: req.user._id })
        
        if (!verification) {
            return res.status(404).json({ message: "No verification request found for this user." })
        }

        res.status(200).json(verification)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

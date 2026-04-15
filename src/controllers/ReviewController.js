const Review = require("../models/ReviewModel")
const Booking = require("../models/BookingModel")


// ADD REVIEW
exports.addReview = async (req,res)=>{
    try{

        const reviewData = {
            ...req.body,
            guestId: req.user._id // enforce guest ID from the validated token
        }

        const review = new Review(reviewData)
        const savedReview = await review.save()

        // Sync flag back to specific booking
        if (reviewData.bookingId) {
            await Booking.findByIdAndUpdate(reviewData.bookingId, { isReviewed: true });
        }

        res.status(201).json({
            message:"Review added successfully",
            data:savedReview
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET REVIEWS BY PROPERTY
exports.getReviewsByProperty = async (req,res)=>{
    try{

        const reviews = await Review.find({
            propertyId: req.params.propertyId,
            $or: [{ reviewType: "property" }, { reviewType: { $exists: false } }]
        }).populate("guestId", "fullName profilePicture")

        res.status(200).json(reviews)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// DELETE REVIEW
exports.deleteReview = async (req,res)=>{
    try{

        await Review.findByIdAndDelete(req.params.id)

        res.status(200).json({
            message:"Review deleted"
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}

// ADD GUEST REVIEW — host rates a guest after completed booking
exports.addGuestReview = async (req, res) => {
    try {
        const { bookingId, rating, reviewText } = req.body
        const hostId = req.user._id

        if (!bookingId || !rating) {
            return res.status(400).json({ message: "bookingId and rating are required" })
        }

        const booking = await Booking.findById(bookingId).populate("propertyId", "hostId")
        if (!booking) return res.status(404).json({ message: "Booking not found" })

        // Support both old bookings (no hostId on booking) and new ones
        const bookingHostId = booking.hostId?.toString() || booking.propertyId?.hostId?.toString()
        if (!bookingHostId || bookingHostId !== hostId.toString()) {
            return res.status(403).json({ message: "You are not the host for this booking" })
        }

        if (booking.bookingStatus?.toLowerCase() !== "completed") {
            return res.status(400).json({ message: "Can only review guests for completed bookings" })
        }

        const existingReview = await Review.findOne({ bookingId, reviewType: "guest" })
        if (existingReview) {
            return res.status(400).json({ message: "You have already submitted a review for this booking" })
        }

        const review = new Review({
            guestId: booking.guestId,
            propertyId: booking.propertyId?._id || booking.propertyId,
            bookingId: booking._id,
            reviewType: "guest",
            hostReviewer: hostId,
            rating,
            reviewText
        })
        await review.save()

        res.status(201).json({ message: "Guest review submitted", review })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// HOST RESPONDS TO REVIEW
exports.respondToReview = async (req, res) => {
    try {
        const { response } = req.body
        const reviewId = req.params.id

        if (!response || !response.trim()) {
            return res.status(400).json({ message: "Response text is required" })
        }

        const review = await Review.findById(reviewId)
        if (!review) return res.status(404).json({ message: "Review not found" })

        review.hostResponse = response.trim()
        await review.save()

        res.status(200).json({ message: "Response attached successfully", review })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET REVIEWS WRITTEN ABOUT GUEST
exports.getMyGuestReviews = async (req, res) => {
    try {
        const guestId = req.user._id
        
        const reviews = await Review.find({ guestId, reviewType: "guest" })
            .populate("hostReviewer", "fullName profilePicture")
            .populate("propertyId", "title")
            .sort({ createdAt: -1 })
            
        res.status(200).json(reviews)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
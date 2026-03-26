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
            propertyId:req.params.propertyId
        }).populate("guestId","fullName")

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

        const booking = await Booking.findById(bookingId)
        if (!booking) return res.status(404).json({ message: "Booking not found" })

        if (booking.hostId?.toString() !== hostId.toString()) {
            return res.status(403).json({ message: "You are not the host for this booking" })
        }

        if (booking.status !== "Completed" && booking.bookingStatus?.toLowerCase() !== "completed") {
            return res.status(400).json({ message: "Can only review guests for completed bookings" })
        }

        const review = new Review({
            guestId: booking.guestId,
            propertyId: booking.propertyId,
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
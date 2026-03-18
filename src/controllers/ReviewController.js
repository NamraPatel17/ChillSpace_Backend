const Review = require("../models/ReviewModel")


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
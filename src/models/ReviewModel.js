const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({

    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Property"
    },

    guestId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    rating:{
        type:Number,
        min:1,
        max:5
    },

    reviewText:{
        type:String
    }

},{timestamps:true})

module.exports = mongoose.model("Review",reviewSchema)
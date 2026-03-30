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

    bookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Booking"
    },

    rating:{
        type:Number,
        min:1,
        max:5
    },

    reviewText:{
        type:String
    },

    hostResponse:{
        type:String,
        default:null
    },

    reviewType:{
        type:String,
        enum:["property","guest"],
        default:"property"
    },

    hostReviewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    }

},{timestamps:true})

module.exports = mongoose.model("Review",reviewSchema)
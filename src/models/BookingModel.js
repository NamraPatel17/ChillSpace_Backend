const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({

    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Property"
    },

    guestId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    checkInDate:{
        type:Date
    },

    checkOutDate:{
        type:Date
    },

    totalPrice:{
        type:Number
    },

    bookingStatus:{
        type:String,
        enum:["Pending","Confirmed","Cancelled"],
        default:"Pending"
    },
    paymentStatus:{
    type:String,
    enum:["Pending","Paid"],
    default:"Pending"
    }

},{timestamps:true})

module.exports = mongoose.model("Booking",bookingSchema)